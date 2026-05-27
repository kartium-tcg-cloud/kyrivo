import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";

function getMonthlyLineLimit(plan: string): number {
  if (plan === "pro") return 500;
  if (plan === "business") return 5000;
  if (plan === "entreprise") return 50000;
  return 0;
}

function getDurationMonths(billingPeriod: string): number {
  return billingPeriod === "quarterly" ? 3 : 1;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Signature Stripe manquante" },
      { status: 400 }
    );
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET manquant" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error: any) {
    console.error("Erreur signature webhook Stripe:", error.message);

    return NextResponse.json(
      { error: "Signature webhook invalide" },
      { status: 400 }
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const companyId = session.metadata?.companyId;
      const plan = session.metadata?.plan;
      const billingPeriod = session.metadata?.billingPeriod;

      const stripeCustomerId =
        typeof session.customer === "string" ? session.customer : null;

      const stripeSubscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : null;

      if (!companyId || !plan || !billingPeriod || !stripeSubscriptionId) {
        console.error("Metadata Stripe incomplètes:", session.metadata);
        return NextResponse.json({ received: true });
      }

      const { data: existingSubscription, error: existingError } =
        await supabaseAdmin
          .from("subscriptions")
          .select("*")
          .eq("company_id", companyId)
          .maybeSingle();

      if (existingError) {
        console.error("Erreur lecture abonnement existant:", existingError);
        throw existingError;
      }

      const newMonthlyLimit = getMonthlyLineLimit(plan);
      const durationMonths = getDurationMonths(billingPeriod);
      const now = new Date();

      const isSamePlan = existingSubscription?.plan === plan;

      let baseEndDate = now;

      if (
        isSamePlan &&
        existingSubscription?.current_period_end &&
        new Date(existingSubscription.current_period_end) > now
      ) {
        baseEndDate = new Date(existingSubscription.current_period_end);
      }

      const newEndDate = new Date(baseEndDate);
      newEndDate.setMonth(newEndDate.getMonth() + durationMonths);

      let finalLineLimit = newMonthlyLimit * durationMonths;

      if (isSamePlan && existingSubscription) {
        const oldLimit = Number(existingSubscription.monthly_line_limit || 0);
        const oldUsed = Number(existingSubscription.used_lines || 0);
        const remainingLines = Math.max(0, oldLimit - oldUsed);

        finalLineLimit = remainingLines + newMonthlyLimit * durationMonths;
      }

      const { error: upsertError } = await supabaseAdmin
        .from("subscriptions")
        .upsert(
          {
            company_id: companyId,
            plan,
            status: "active",
            billing_period: billingPeriod,
            monthly_line_limit: finalLineLimit,
            used_lines: 0,
            current_period_start: now.toISOString(),
            current_period_end: newEndDate.toISOString(),
            stripe_customer_id: stripeCustomerId,
            stripe_subscription_id: stripeSubscriptionId,
            updated_at: now.toISOString(),
          },
          {
            onConflict: "company_id",
          }
        );

      if (upsertError) {
        console.error("Erreur upsert subscription:", upsertError);
        throw upsertError;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erreur traitement webhook Stripe:", error);

    return NextResponse.json(
      { error: "Erreur traitement webhook Stripe" },
      { status: 500 }
    );
  }
}