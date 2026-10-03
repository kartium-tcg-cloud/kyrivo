import type { BillingPeriod, PaidSubscriptionPlan } from "@/types/subscription";

export const STRIPE_PRICE_IDS: Record<PaidSubscriptionPlan, Record<BillingPeriod, string>> = {
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY!,
    quarterly: process.env.STRIPE_PRICE_PRO_QUARTERLY!,
  },
  business: {
    monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY!,
    quarterly: process.env.STRIPE_PRICE_BUSINESS_QUARTERLY!,
  },
  entreprise: {
    monthly: process.env.STRIPE_PRICE_ENTREPRISE_MONTHLY!,
    quarterly: process.env.STRIPE_PRICE_ENTREPRISE_QUARTERLY!,
  },
};

// Mapping inverse price_id → plan, dérivé de STRIPE_PRICE_IDS (source unique de vérité).
export function getPlanFromPriceId(
  priceId: string | null | undefined
): PaidSubscriptionPlan | null {
  if (!priceId) return null;

  for (const plan of Object.keys(STRIPE_PRICE_IDS) as PaidSubscriptionPlan[]) {
    const periods = STRIPE_PRICE_IDS[plan];
    if (periods.monthly === priceId || periods.quarterly === priceId) {
      return plan;
    }
  }

  return null;
}
