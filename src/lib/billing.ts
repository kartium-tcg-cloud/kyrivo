import {
  BillingPeriod,
  PaidSubscriptionPlan,
  PLAN_LINE_LIMITS,
  PLAN_PRICES_EUR,
  SubscriptionPlan,
} from "@/types/subscription";

export const BILLING_PERIOD_MONTHS: Record<BillingPeriod, number> = {
  monthly: 1,
  quarterly: 3,
};

export const PLAN_QUARTERLY_PRICES_EUR: Record<PaidSubscriptionPlan, number> = {
  pro: 26.4,
  business: 64.9,
  entreprise: 214.9,
};

export function getSubscriptionPrice(params: {
  plan: PaidSubscriptionPlan;
  period: BillingPeriod;
}) {
  const { plan, period } = params;

  if (period === "monthly") {
    return PLAN_PRICES_EUR[plan];
  }

  return PLAN_QUARTERLY_PRICES_EUR[plan];
}

export function getPlanLineLimit(plan: SubscriptionPlan) {
  return PLAN_LINE_LIMITS[plan];
}

// Prix mensuel effectif : monthly = prix mensuel, quarterly = prix trimestriel / 3
function getEffectiveMonthlyPrice(
  plan: PaidSubscriptionPlan,
  billingPeriod: BillingPeriod
): number {
  if (billingPeriod === "monthly") {
    return PLAN_PRICES_EUR[plan];
  }
  return PLAN_QUARTERLY_PRICES_EUR[plan] / 3;
}

export function calculateRemainingLineCredit(params: {
  currentPlan: PaidSubscriptionPlan;
  remainingLines: number;
  currentBillingPeriod?: BillingPeriod;
}) {
  const { currentPlan, remainingLines, currentBillingPeriod = "monthly" } = params;

  const currentLimit = PLAN_LINE_LIMITS[currentPlan];

  if (currentLimit <= 0 || remainingLines <= 0) {
    return 0;
  }

  const effectiveMonthlyPrice = getEffectiveMonthlyPrice(currentPlan, currentBillingPeriod);

  return Number(
    ((effectiveMonthlyPrice / currentLimit) * remainingLines).toFixed(2)
  );
}

// Non utilisé dans la logique de crédit upgrade. Conservé pour rétrocompatibilité.
export function calculateRemainingMonthCredit(params: {
  currentPlan: PaidSubscriptionPlan;
  fullRemainingMonths: number;
}) {
  const { currentPlan, fullRemainingMonths } = params;

  if (fullRemainingMonths <= 0) {
    return 0;
  }

  return Number(
    (PLAN_PRICES_EUR[currentPlan] * fullRemainingMonths).toFixed(2)
  );
}

// Remplacé par calculateUpgradeCreditPreview. Conservé pour rétrocompatibilité.
export function calculatePlanChangePrice(params: {
  currentPlan: SubscriptionPlan | null;
  targetPlan: PaidSubscriptionPlan;
  targetPeriod: BillingPeriod;
  remainingLines: number;
  fullRemainingMonths: number;
  isRenewalSamePlan: boolean;
}) {
  const {
    currentPlan,
    targetPlan,
    targetPeriod,
    remainingLines,
    fullRemainingMonths,
    isRenewalSamePlan,
  } = params;

  const targetPrice = getSubscriptionPrice({
    plan: targetPlan,
    period: targetPeriod,
  });

  if (
    isRenewalSamePlan ||
    !currentPlan ||
    currentPlan === "trial"
  ) {
    return {
      basePrice: targetPrice,
      credit: 0,
      finalPrice: targetPrice,
    };
  }

  const monthCredit = calculateRemainingMonthCredit({
    currentPlan,
    fullRemainingMonths,
  });

  const lineCredit = calculateRemainingLineCredit({
    currentPlan,
    remainingLines,
  });

  const credit = Number((monthCredit + lineCredit).toFixed(2));
  const finalPrice = Math.max(
    0,
    Number((targetPrice - credit).toFixed(2))
  );

  return {
    basePrice: targetPrice,
    credit,
    finalPrice,
  };
}

export interface UpgradeCreditPreview {
  currentPlan: PaidSubscriptionPlan;
  currentBillingPeriod: BillingPeriod;
  targetPlan: PaidSubscriptionPlan;
  targetBillingPeriod: BillingPeriod;
  fullRemainingMonths: number;
  usedLines: number;
  totalLines: number;
  remainingLines: number;
  effectiveMonthlyPrice: number;
  fullMonthsCredit: number;
  currentMonthCredit: number;
  creditAmount: number;
  targetPrice: number;
  finalPrice: number;
  lostCredit: number;
  isFreeUpgrade: boolean;
}

export function calculateUpgradeCreditPreview(params: {
  currentPlan: PaidSubscriptionPlan;
  currentBillingPeriod: BillingPeriod;
  targetPlan: PaidSubscriptionPlan;
  targetBillingPeriod: BillingPeriod;
  fullRemainingMonths: number;
  usedLines: number;
}): UpgradeCreditPreview {
  const {
    currentPlan,
    currentBillingPeriod,
    targetPlan,
    targetBillingPeriod,
    fullRemainingMonths,
    usedLines,
  } = params;

  const targetPrice = getSubscriptionPrice({
    plan: targetPlan,
    period: targetBillingPeriod,
  });

  const totalLines = PLAN_LINE_LIMITS[currentPlan];
  const remainingLines = Math.max(0, totalLines - usedLines);
  const effectiveMonthlyPrice = getEffectiveMonthlyPrice(currentPlan, currentBillingPeriod);

  // Prolongation du même plan : crédit = 0 €, on paie le plein tarif
  if (currentPlan === targetPlan) {
    return {
      currentPlan,
      currentBillingPeriod,
      targetPlan,
      targetBillingPeriod,
      fullRemainingMonths,
      usedLines,
      totalLines,
      remainingLines,
      effectiveMonthlyPrice,
      fullMonthsCredit: 0,
      currentMonthCredit: 0,
      creditAmount: 0,
      targetPrice,
      finalPrice: targetPrice,
      lostCredit: 0,
      isFreeUpgrade: false,
    };
  }

  const fullMonthsCredit = Number(
    (effectiveMonthlyPrice * fullRemainingMonths).toFixed(2)
  );

  const currentMonthCredit =
    totalLines > 0
      ? Number(((effectiveMonthlyPrice / totalLines) * remainingLines).toFixed(2))
      : 0;

  const creditAmount = Number((fullMonthsCredit + currentMonthCredit).toFixed(2));

  const finalPrice = Math.max(0, Number((targetPrice - creditAmount).toFixed(2)));

  const lostCredit =
    creditAmount > targetPrice
      ? Number((creditAmount - targetPrice).toFixed(2))
      : 0;

  const isFreeUpgrade = creditAmount >= targetPrice;

  return {
    currentPlan,
    currentBillingPeriod,
    targetPlan,
    targetBillingPeriod,
    fullRemainingMonths,
    usedLines,
    totalLines,
    remainingLines,
    effectiveMonthlyPrice,
    fullMonthsCredit,
    currentMonthCredit,
    creditAmount,
    targetPrice,
    finalPrice,
    lostCredit,
    isFreeUpgrade,
  };
}

export function addMonths(date: Date, months: number) {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

export function getNewSubscriptionPeriod(params: {
  period: BillingPeriod;
  mode: "new_or_upgrade" | "renewal";
  currentPeriodEnd?: string | null;
}) {
  const { period, mode, currentPeriodEnd } = params;

  const months = BILLING_PERIOD_MONTHS[period];
  const now = new Date();

  if (mode === "renewal" && currentPeriodEnd) {
    const currentEnd = new Date(currentPeriodEnd);
    const start = currentEnd > now ? currentEnd : now;

    return {
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: addMonths(start, months).toISOString(),
    };
  }

  return {
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: addMonths(now, months).toISOString(),
  };
}