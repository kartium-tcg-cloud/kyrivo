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

export function calculateRemainingLineCredit(params: {
  currentPlan: PaidSubscriptionPlan;
  remainingLines: number;
}) {
  const { currentPlan, remainingLines } = params;

  const currentPrice = PLAN_PRICES_EUR[currentPlan];
  const currentLimit = PLAN_LINE_LIMITS[currentPlan];

  if (currentLimit <= 0 || remainingLines <= 0) {
    return 0;
  }

  return Number(
    ((currentPrice / currentLimit) * remainingLines).toFixed(2)
  );
}

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