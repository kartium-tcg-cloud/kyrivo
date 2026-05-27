import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

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

    const metadata = {
      userId: user.id,
      companyId: membership.company_id,
      plan,
      billingPeriod,
    };

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card", "link"],
      customer_email: user.email ?? undefined,

      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

      metadata,

      subscription_data: {
        metadata,
      },

success_url: `${appUrl}/dashboard?stripe=success`,
cancel_url: `${appUrl}/abonnements?stripe=cancel`,
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