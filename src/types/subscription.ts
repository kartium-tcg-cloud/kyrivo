export type SubscriptionPlan = "trial" | "pro" | "business" | "entreprise";

export type PaidSubscriptionPlan = Exclude<SubscriptionPlan, "trial">;

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "inactive";

export type BillingPeriod = "monthly" | "quarterly";

export interface CompanySubscription {
  id?: string;
  companyId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  monthlyLineLimit: number;
  currentPeriodStart: string;
  currentPeriodEnd?: string | null;
  trialEndsAt?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  billingPeriod?: BillingPeriod;
}

export const PLAN_LINE_LIMITS: Record<SubscriptionPlan, number> = {
  trial: 125,
  pro: 500,
  business: 5000,
  entreprise: 50000,
};

export const PLAN_PRICES_EUR: Record<PaidSubscriptionPlan, number> = {
  pro: 9.9,
  business: 24.9,
  entreprise: 79.9,
};

export const QUARTERLY_DISCOUNT_RATE = 0.05;

export function getPlanPrice(plan: PaidSubscriptionPlan, period: BillingPeriod) {
  const monthlyPrice = PLAN_PRICES_EUR[plan];

  if (period === "monthly") {
    return monthlyPrice;
  }

  return Number((monthlyPrice * 3 * (1 - QUARTERLY_DISCOUNT_RATE)).toFixed(2));
}