/**
 * A recurring subscription already purchased for this tier must never launch a
 * second Checkout for the same plan. Billing interval does not matter:
 * changing monthly to quarterly is handled separately via subscription management.
 *
 * The server repeats this check, independently of the disabled UI button.
 */
export interface ExistingCheckoutSubscription {
  plan: string | null;
  status: string | null;
  subscriptionEndsAt: string | null;
  stripeSubscriptionId?: string | null;
}

export function blocksDuplicatePlanCheckout(
  subscription: ExistingCheckoutSubscription | null,
  targetPlan: string,
  now: Date = new Date()
): boolean {
  if (!subscription || !targetPlan || subscription.plan !== targetPlan || subscription.plan === "trial") {
    return false;
  }

  // A payment failure on an existing recurring subscription must be resolved
  // in Stripe's customer portal, not by subscribing again.
  if (subscription.status === "past_due" && !!subscription.stripeSubscriptionId) {
    return true;
  }

  if (subscription.status !== "active" && subscription.status !== "canceled") {
    return false;
  }

  const expiresAt = subscription.subscriptionEndsAt
    ? new Date(subscription.subscriptionEndsAt).getTime()
    : Number.NaN;
  return Number.isFinite(expiresAt) && expiresAt > now.getTime();
}
