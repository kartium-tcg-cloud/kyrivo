import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { calculateUpgradeCreditPreview } from "@/lib/billing";
import type { BillingPeriod, PaidSubscriptionPlan } from "@/types/subscription";

const PRICE_IDS = {
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

const MIN_CHECKOUT_AMOUNT_CENTS = 50;

function getPlanRank(plan: string | null | undefined): number {
  if (plan === "business") return 2;
  if (plan === "entreprise") return 3;
  if (plan === "pro" || plan === "trial") return 1;
  return 0;
}

// Nombre de mois complets entre deux dates (jamais négatif)
function calcFullRemainingMonths(from: Date, to: Date): number {
  if (to <= from) return 0;
  const yearDiff = to.getFullYear() - from.getFullYear();
  const monthDiff = to.getMonth() - from.getMonth();
  let months = yearDiff * 12 + monthDiff;
  if (to.getDate() < from.getDate()) months--;
  return Math.max(0, months);
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Utilisateur non connecté" },
        { status: 401 }
      );
    }

    const { data: membership, error: membershipError } = await supabase
      .from("memberships")
      .select("company_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError || !membership?.company_id) {
      return NextResponse.json(
        { ok: false, error: "Société introuvable" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { plan, billingPeriod } = body;

    if (!["pro", "business", "entreprise"].includes(plan)) {
      return NextResponse.json(
        { ok: false, error: "Plan invalide" },
        { status: 400 }
      );
    }

    if (!["monthly", "quarterly"].includes(billingPeriod)) {
      return NextResponse.json(
        { ok: false, error: "Période invalide" },
        { status: 400 }
      );
    }

    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("plan, status, stripe_customer_id, billing_period, current_period_start, current_period_end, subscription_ends_at")
      .eq("company_id", membership.company_id)
      .maybeSingle();

    const isActive =
      existingSubscription?.status === "active" ||
      existingSubscription?.status === "trialing";

    if (isActive && getPlanRank(existingSubscription?.plan) > getPlanRank(plan)) {
      return NextResponse.json(
        { ok: false, error: "Rétrogradation non autorisée" },
        { status: 400 }
      );
    }

    const currentPlanValue = existingSubscription?.plan ?? null;

    const isRealUpgrade =
      isActive &&
      existingSubscription !== null &&
      currentPlanValue !== null &&
      currentPlanValue !== "trial" &&
      getPlanRank(plan) > getPlanRank(currentPlanValue);

    let creditPreview: ReturnType<typeof calculateUpgradeCreditPreview> | null = null;
    let usedLines = 0;
    let fullRemainingMonths = 0;

    if (isRealUpgrade && existingSubscription) {
      const periodStart = existingSubscription.current_period_start as string | null;
      const periodEnd = (existingSubscription.current_period_end ?? new Date().toISOString()) as string;

      if (periodStart) {
        const { data: usageData } = await supabase
          .from("usage_events")
          .select("lines_used")
          .eq("company_id", membership.company_id)
          .gte("created_at", periodStart)
          .lt("created_at", periodEnd);

        usedLines = (usageData ?? []).reduce(
          (sum: number, e: any) => sum + Number(e.lines_used || 0),
          0
        );
      }

      const periodEndDate = existingSubscription.current_period_end
        ? new Date(existingSubscription.current_period_end as string)
        : new Date();
      const subEndsDate = existingSubscription.subscription_ends_at
        ? new Date(existingSubscription.subscription_ends_at as string)
        : new Date();

      fullRemainingMonths = calcFullRemainingMonths(periodEndDate, subEndsDate);

      creditPreview = calculateUpgradeCreditPreview({
        currentPlan: currentPlanValue as PaidSubscriptionPlan,
        currentBillingPeriod: ((existingSubscription.billing_period ?? "monthly") as BillingPeriod),
        targetPlan: plan as PaidSubscriptionPlan,
        targetBillingPeriod: billingPeriod as BillingPeriod,
        fullRemainingMonths,
        usedLines,
      });

      console.log("[Stripe checkout] Upgrade credit preview", {
        companyId: membership.company_id,
        currentPlan: creditPreview.currentPlan,
        targetPlan: creditPreview.targetPlan,
        usedLines: creditPreview.usedLines,
        fullRemainingMonths: creditPreview.fullRemainingMonths,
        creditAmount: creditPreview.creditAmount,
        finalPrice: creditPreview.finalPrice,
      });
    }

    // Appliquer le crédit via coupon Stripe si upgrade réel
    let couponId: string | null = null;
    let appliedDiscountCents = 0;
    let lostCreditCents = 0;

    if (creditPreview && creditPreview.creditAmount > 0) {
      const targetPriceCents = Math.round(creditPreview.targetPrice * 100);
      const theoreticalCreditCents = Math.round(creditPreview.creditAmount * 100);
      const maxAllowedDiscountCents = targetPriceCents - MIN_CHECKOUT_AMOUNT_CENTS;

      appliedDiscountCents = Math.min(theoreticalCreditCents, maxAllowedDiscountCents);
      lostCreditCents = theoreticalCreditCents - appliedDiscountCents;

      if (appliedDiscountCents > 0) {
        const coupon = await stripe.coupons.create({
          amount_off: appliedDiscountCents,
          currency: "eur",
          duration: "once",
          max_redemptions: 1,
          name: `Crédit upgrade Kyrivo - ${(appliedDiscountCents / 100).toFixed(2)} €`,
        });

        couponId = coupon.id;

        console.log("[Stripe checkout] Upgrade coupon applied", {
          companyId: membership.company_id,
          couponId,
          theoreticalCreditCents,
          appliedDiscountCents,
          lostCreditCents,
          realFinalPriceCents: targetPriceCents - appliedDiscountCents,
        });
      } else {
        console.log("[Stripe checkout] Credit absorbed by minimum amount rule — no coupon", {
          companyId: membership.company_id,
          theoreticalCreditCents,
          maxAllowedDiscountCents,
        });
      }
    }

    const existingStripeCustomerId = existingSubscription?.stripe_customer_id ?? null;

    const priceId =
      PRICE_IDS[plan as keyof typeof PRICE_IDS][
        billingPeriod as "monthly" | "quarterly"
      ];

const appUrl = process.env.NEXT_PUBLIC_APP_URL;

if (!appUrl) {
  return NextResponse.json(
    { ok: false, error: "NEXT_PUBLIC_APP_URL manquant" },
    { status: 500 }
  );
}

    const metadata: Record<string, string> = {
      userId: user.id,
      companyId: membership.company_id,
      plan,
      billingPeriod,
    };

    if (creditPreview) {
      const realFinalPriceCents = Math.round(creditPreview.targetPrice * 100) - appliedDiscountCents;
      metadata.creditAmount = String(creditPreview.creditAmount);
      metadata.creditAppliedAmount = (appliedDiscountCents / 100).toFixed(2);
      metadata.creditLostAmount = (lostCreditCents / 100).toFixed(2);
      metadata.creditFinalPrice = (realFinalPriceCents / 100).toFixed(2);
      metadata.creditUsedLines = String(usedLines);
      metadata.creditFullRemainingMonths = String(fullRemainingMonths);
    }

    if (couponId) {
      metadata.couponId = couponId;
    }

const discountsParam = couponId ? [{ coupon: couponId }] : undefined;

const session = await stripe.checkout.sessions.create({
  mode: "subscription",
  ...(existingStripeCustomerId
    ? { customer: existingStripeCustomerId }
    : { customer_email: user.email ?? undefined }),
  ...(discountsParam ? { discounts: discountsParam } : {}),
  payment_method_types: ["card", "bancontact", "sepa_debit", "paypal"],
  payment_method_collection: "always",
  billing_address_collection: "required",
  line_items: [{ price: priceId, quantity: 1 }],
  metadata,
  subscription_data: { metadata },
  success_url: `${appUrl}/dashboard?stripe=success`,
  cancel_url: `${appUrl}/abonnements?stripe=cancel`,
}).catch((err: any) => {
  if (
    existingStripeCustomerId &&
    err?.code === "resource_missing" &&
    typeof err?.message === "string" &&
    err.message.toLowerCase().includes("customer")
  ) {
    console.warn("[Stripe] Customer introuvable, fallback email:", existingStripeCustomerId);
    return stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email ?? undefined,
      ...(discountsParam ? { discounts: discountsParam } : {}),
      payment_method_types: ["card", "bancontact", "sepa_debit", "paypal"],
      payment_method_collection: "always",
      billing_address_collection: "required",
      line_items: [{ price: priceId, quantity: 1 }],
      metadata,
      subscription_data: { metadata },
      success_url: `${appUrl}/dashboard?stripe=success`,
      cancel_url: `${appUrl}/abonnements?stripe=cancel`,
    });
  }
  throw err;
});

const verifiedSession = await stripe.checkout.sessions.retrieve(session.id, {
  expand: ["total_details", "discounts", "line_items", "invoice", "subscription"],
});

console.log("[Stripe checkout] verified session after create", {
  sessionId:      verifiedSession.id,
  status:         verifiedSession.status,
  paymentStatus:  verifiedSession.payment_status,
  url:            verifiedSession.url,
  amountSubtotal: verifiedSession.amount_subtotal,
  amountTotal:    verifiedSession.amount_total,
  totalDetails:   verifiedSession.total_details,
  discounts:      verifiedSession.discounts,
  invoice:        verifiedSession.invoice,
  subscription:   verifiedSession.subscription,
  metadata:       verifiedSession.metadata,
});

    return NextResponse.json({
      ok: true,
      url: session.url,
    });
  } catch (error: any) {
    console.error("ERREUR STRIPE CHECKOUT:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Erreur création session Stripe",
      },
      { status: 500 }
    );
  }
}