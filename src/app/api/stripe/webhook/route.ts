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

function addMonths(date: Date, months: number): Date {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

function getPlanRank(plan: string | null | undefined): number {
  if (plan === "trial") return 1;
  if (plan === "pro") return 1;
  if (plan === "business") return 2;
  if (plan === "entreprise") return 3;
  return 0;
}

function maxDate(...dates: Array<Date | null | undefined>): Date {
  const validDates = dates.filter(Boolean) as Date[];

  if (validDates.length === 0) {
    return new Date();
  }

  return new Date(Math.max(...validDates.map((date) => date.getTime())));
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  const primarySecret = process.env.STRIPE_WEBHOOK_SECRET;
  // Migration de domaine : secret de l'ancien endpoint kyrivo.kartium-tcg.com.
  // À supprimer une fois l'endpoint kyrivo.fr actif et l'ancien désactivé dans Stripe.
  const legacySecret = process.env.STRIPE_WEBHOOK_SECRET_LEGACY;

  if (!signature || !primarySecret) {
    return NextResponse.json(
      { error: "Webhook Stripe invalide" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, primarySecret);
  } catch (primaryError: any) {
    if (!legacySecret) {
      console.error("Erreur signature webhook Stripe:", primaryError.message);
      return NextResponse.json(
        { error: "Signature webhook invalide" },
        { status: 400 }
      );
    }
    try {
      event = stripe.webhooks.constructEvent(body, signature, legacySecret);
    } catch {
      console.error("Erreur signature webhook Stripe:", primaryError.message);
      return NextResponse.json(
        { error: "Signature webhook invalide" },
        { status: 400 }
      );
    }
  }

  try {
    // ── customer.subscription.deleted ─────────────────────────────────────
    if (event.type === "customer.subscription.deleted") {
      const stripeSubscription = event.data.object as Stripe.Subscription;

      await supabaseAdmin
        .from("subscriptions")
        .update({
          status: "canceled",
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", stripeSubscription.id);

      return NextResponse.json({ received: true });
    }

    // ── invoice.paid (renouvellements uniquement) ──────────────────────────
    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;

      // On ne traite que les renouvellements automatiques, pas la création initiale
      if (invoice.billing_reason !== "subscription_cycle") {
        return NextResponse.json({ received: true });
      }

      // SDK v22 : subscription dans parent.subscription_details.subscription
      // Legacy : directement dans invoice.subscription
      const invoiceRaw = invoice as any;
      const stripeSubId: string | null =
        typeof invoiceRaw.subscription === "string"
          ? invoiceRaw.subscription
          : typeof invoiceRaw.parent?.subscription_details?.subscription === "string"
          ? invoiceRaw.parent.subscription_details.subscription
          : null;

      if (!stripeSubId) return NextResponse.json({ received: true });

      const { data: sub, error: subError } = await supabaseAdmin
        .from("subscriptions")
        .select("stripe_subscription_id, status")
        .eq("stripe_subscription_id", stripeSubId)
        .maybeSingle();

      if (subError) throw subError;
      // Abonnement introuvable ou déjà annulé : on ne prolonge pas
      if (!sub || sub.status === "canceled") return NextResponse.json({ received: true });

      // ── Source de vérité : lignes de cette facture précise ───────────────
      // Toutes les dates sont lues depuis invoice.id, immuable après finalisation.
      // Rejouer cet événement à n'importe quelle date produit toujours les mêmes
      // valeurs — la subscription n'est jamais consultée.

      // Prédicat : ligne d'abonnement non-proration
      const isRenewalLine = (l: Stripe.InvoiceLineItem) =>
        l.parent?.type === "subscription_item_details" &&
        l.parent.subscription_item_details?.proration !== true;

      // Étape 1 : lignes embarquées dans le payload webhook
      let renewalLine = invoice.lines.data.find(isRenewalLine);

      // Étape 2 : si la liste est incomplète, récupérer les lignes via l'API
      // de cette facture (invoice.id) — pas l'état courant de la subscription
      if (!renewalLine && invoice.lines.has_more) {
        const allLines = await stripe.invoices.listLineItems(invoice.id, { limit: 100 });
        renewalLine = allLines.data.find(isRenewalLine);
      }

      // Étape 3 : sans ligne fiable, échec → Stripe réessaiera
      if (!renewalLine) {
        console.error("[invoice.paid] Ligne d'abonnement introuvable:", {
          invoiceId: invoice.id,
          stripeSubId,
        });
        return NextResponse.json(
          { error: "Ligne d'abonnement introuvable" },
          { status: 500 }
        );
      }

      const periodStart = new Date(renewalLine.period.start * 1000);
      const periodEnd = new Date(renewalLine.period.end * 1000);

      // Écriture déterministe — les dates viennent de invoice.id, fixe et immuable
      const { error: renewalError } = await supabaseAdmin
        .from("subscriptions")
        .update({
          subscription_ends_at: periodEnd.toISOString(),
          current_period_start: periodStart.toISOString(),
          current_period_end: periodEnd.toISOString(),
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", stripeSubId);

      if (renewalError) throw renewalError;

      return NextResponse.json({ received: true });
    }

    // ── invoice.payment_failed ─────────────────────────────────────────────
    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const invoiceRaw = invoice as any;
      const stripeSubId: string | null =
        typeof invoiceRaw.subscription === "string"
          ? invoiceRaw.subscription
          : typeof invoiceRaw.parent?.subscription_details?.subscription === "string"
          ? invoiceRaw.parent.subscription_details.subscription
          : null;

      if (!stripeSubId) return NextResponse.json({ received: true });

      await supabaseAdmin
        .from("subscriptions")
        .update({
          status: "past_due",
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", stripeSubId)
        .neq("status", "canceled");

      return NextResponse.json({ received: true });
    }

    // ── checkout.session.completed ─────────────────────────────────────────
    if (event.type !== "checkout.session.completed") {
      return NextResponse.json({ received: true });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    const companyId = session.metadata?.companyId;
    const plan = session.metadata?.plan;
    const billingPeriod = session.metadata?.billingPeriod;

    const stripeCustomerId =
      typeof session.customer === "string" ? session.customer : null;

    const stripeSubscriptionId =
      typeof session.subscription === "string" ? session.subscription : null;

    if (!companyId || !plan || !billingPeriod || !stripeSubscriptionId) {
      console.error("Metadata Stripe incomplètes:", session.metadata);
      return NextResponse.json({ received: true });
    }

    const monthlyLimit = getMonthlyLineLimit(plan);
    const durationMonths = getDurationMonths(billingPeriod);
    const now = new Date();

    const { data: existingSubscription, error: existingError } =
      await supabaseAdmin
        .from("subscriptions")
        .select("*")
        .eq("company_id", companyId)
        .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    const currentPlan = existingSubscription?.plan ?? null;
    const currentRank = getPlanRank(currentPlan);
    const newRank = getPlanRank(plan);

    const existingCurrentStart = existingSubscription?.current_period_start
      ? new Date(existingSubscription.current_period_start)
      : null;

    const existingCurrentEnd = existingSubscription?.current_period_end
      ? new Date(existingSubscription.current_period_end)
      : null;

    const existingSubscriptionEnd = existingSubscription?.subscription_ends_at
      ? new Date(existingSubscription.subscription_ends_at)
      : null;

    const existingTrialEnd = existingSubscription?.trial_ends_at
      ? new Date(existingSubscription.trial_ends_at)
      : null;

    // Une conversion trial → plan payant doit toujours être traitée comme un upgrade
    // (trial et pro ont le même rang dans getPlanRank, ce qui causerait sinon isExtension)
    const isTrialConversion = currentPlan === "trial";
    const isExtension = !isTrialConversion && currentRank === newRank;
    const isUpgrade = !isTrialConversion && newRank > currentRank;

    if (!isTrialConversion && newRank < currentRank) {
      console.warn("Tentative de rétrogradation ignorée:", {
        companyId,
        currentPlan,
        requestedPlan: plan,
      });

      return NextResponse.json({ received: true });
    }

    let currentPeriodStart = now;
    let currentPeriodEnd = addMonths(now, 1);
    let subscriptionEndsAt = addMonths(now, durationMonths);
    let finalMonthlyLimit = monthlyLimit;

    // Conversion trial → plan payant : on étend depuis la fin du trial si encore actif
    if (isTrialConversion && existingSubscription) {
      const baseForEnd =
        existingTrialEnd && existingTrialEnd > now ? existingTrialEnd : now;
      subscriptionEndsAt = addMonths(baseForEnd, durationMonths);
      currentPeriodStart = now;
      currentPeriodEnd = addMonths(now, 1);
      finalMonthlyLimit = monthlyLimit;
    }

    if (isExtension && existingSubscription) {
      const baseEnd = maxDate(
        existingSubscriptionEnd,
        existingCurrentEnd,
        existingTrialEnd,
        now
      );

      subscriptionEndsAt = addMonths(baseEnd, durationMonths);

      if (existingCurrentEnd && existingCurrentEnd > now) {
        currentPeriodStart = existingCurrentStart ?? now;
        currentPeriodEnd = existingCurrentEnd;
        finalMonthlyLimit =
          Number(existingSubscription.monthly_line_limit || 0) || monthlyLimit;
      } else {
        currentPeriodStart = now;
        currentPeriodEnd = addMonths(now, 1);
        finalMonthlyLimit = monthlyLimit;
      }
    }

    if (isUpgrade || !existingSubscription) {
      currentPeriodStart = now;
      currentPeriodEnd = addMonths(now, 1);
      subscriptionEndsAt = addMonths(now, durationMonths);
      finalMonthlyLimit = monthlyLimit;
    }

    const { error: upsertError } = await supabaseAdmin
      .from("subscriptions")
      .upsert(
        {
          company_id: companyId,
          plan,
          status: "active",
          billing_period: billingPeriod,
          monthly_line_limit: finalMonthlyLimit,
          current_period_start: currentPeriodStart.toISOString(),
          current_period_end: currentPeriodEnd.toISOString(),
          subscription_ends_at: subscriptionEndsAt.toISOString(),
          trial_ends_at: existingSubscription?.trial_ends_at ?? null,
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubscriptionId,
          updated_at: now.toISOString(),
        },
        {
          onConflict: "company_id",
        }
      );

    if (upsertError) {
      throw upsertError;
    }

    // Annuler l'ancienne subscription Stripe pour éviter deux abonnements actifs
    const oldStripeSubscriptionId = existingSubscription?.stripe_subscription_id ?? null;

    if (oldStripeSubscriptionId && oldStripeSubscriptionId !== stripeSubscriptionId) {
      try {
        await stripe.subscriptions.cancel(oldStripeSubscriptionId);
        console.log("[Stripe] Ancienne subscription annulée:", oldStripeSubscriptionId);
      } catch (cancelError: any) {
        console.error("[Stripe] Échec annulation ancienne subscription:", {
          oldStripeSubscriptionId,
          newStripeSubscriptionId: stripeSubscriptionId,
          companyId,
          error: cancelError?.message,
        });
        // Ne pas propager : l'upsert DB est déjà validé. Retourner 500 ici
        // ferait re-tenter Stripe, causant un second upsert et une tentative
        // d'annulation sur une subscription déjà annulée → boucle infinie.
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