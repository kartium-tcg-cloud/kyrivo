import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(_req: NextRequest) {
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

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("company_id", membership.company_id)
      .maybeSingle();

    const stripeCustomerId = subscription?.stripe_customer_id ?? null;

    if (!stripeCustomerId) {
      return NextResponse.json(
        { ok: false, error: "Aucun client Stripe associé à cet abonnement." },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!appUrl) {
      return NextResponse.json(
        { ok: false, error: "NEXT_PUBLIC_APP_URL manquant" },
        { status: 500 }
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${appUrl}/dashboard`,
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (error: any) {
    console.error("ERREUR STRIPE PORTAL:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Erreur création session portail" },
      { status: 500 }
    );
  }
}
