import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

// Résiliation à l'échéance uniquement. Aucun abonnement n'est annulé immédiatement.
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Connexion requise." }, { status: 401 });
    }

    const { data: membership, error: membershipError } = await supabase
      .from("memberships")
      .select("company_id, role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) throw membershipError;
    if (!membership || membership.role !== "owner") {
      return NextResponse.json({ ok: false, error: "Seul le propriétaire du compte peut résilier l'abonnement." }, { status: 403 });
    }

    const { data: subscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id, stripe_customer_id, status, subscription_ends_at, cancel_at_period_end")
      .eq("company_id", membership.company_id)
      .maybeSingle();

    if (subscriptionError) throw subscriptionError;
    if (!subscription?.stripe_subscription_id || !subscription.stripe_customer_id) {
      return NextResponse.json({ ok: false, error: "Aucun abonnement Stripe à résilier." }, { status: 400 });
    }

    if (!["active", "past_due", "canceled"].includes(subscription.status)) {
      return NextResponse.json({ ok: false, error: "Cet abonnement n'est pas résiliable." }, { status: 409 });
    }

    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
    const stripeCustomerId = typeof stripeSubscription.customer === "string"
      ? stripeSubscription.customer
      : stripeSubscription.customer.id;

    if (stripeCustomerId !== subscription.stripe_customer_id) {
      console.error("[Stripe cancel] Identifiants client et abonnement incohérents.");
      return NextResponse.json({ ok: false, error: "Impossible de vérifier l'abonnement." }, { status: 409 });
    }

    if (stripeSubscription.status === "canceled") {
      return NextResponse.json({ ok: false, error: "L'abonnement est déjà terminé." }, { status: 409 });
    }

    const alreadyScheduled = stripeSubscription.cancel_at_period_end;
    const updatedSubscription = alreadyScheduled
      ? stripeSubscription
      : await stripe.subscriptions.update(stripeSubscription.id, { cancel_at_period_end: true });

    // Le webhook customer.subscription.updated synchronise Supabase, y compris
    // en cas de résiliation depuis le portail Stripe. Ici, synchronisation immédiate
    // pour éviter de présenter de nouveau l'action après une requête réussie.
    const { error: syncError } = await supabase
      .from("subscriptions")
      .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
      .eq("company_id", membership.company_id)
      .eq("stripe_subscription_id", updatedSubscription.id);

    if (syncError) {
      console.error("[Stripe cancel] Synchronisation locale différée au webhook:", syncError);
    }

    const endsAt = subscription.subscription_ends_at;
    return NextResponse.json({ ok: true, alreadyScheduled, endsAt });
  } catch (error) {
    console.error("[Stripe cancel] Échec de programmation de la résiliation:", error);
    return NextResponse.json(
      { ok: false, error: "Impossible d'annuler le renouvellement pour le moment. Réessayez ou contactez l'assistance." },
      { status: 500 }
    );
  }
}
