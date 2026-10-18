import { supabaseAdmin } from "@/lib/supabase/admin";
import { KYRIVO_OPENAI_ADS_PIXEL_ID } from "@/lib/openaiAdsConfig";

type SubscriptionConversion = {
  companyId: string;
  stripeSubscriptionId: string;
  plan: string;
  billingPeriod: string;
  amountCents: number | null;
  currency: string;
  timestampMs: number;
};

/**
 * Conversion uniquement après confirmation du premier abonnement payé.
 * Le webhook Stripe reste prioritaire : absence de Pixel/API ou erreur réseau = aucune
 * perturbation du paiement, des droits, des quotas ou des stocks.
 */
export async function sendOpenAISubscriptionConversion(data: SubscriptionConversion): Promise<void> {
  const pixelId = KYRIVO_OPENAI_ADS_PIXEL_ID;
  const apiKey = process.env.OPENAI_ADS_CONVERSIONS_API_KEY;
  if (!pixelId || !apiKey) return;
  if (Date.now() - data.timestampMs > 7 * 86400000) return;

  try {
    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .select("created_by")
      .eq("id", data.companyId)
      .maybeSingle();
    if (companyError || !company?.created_by) return;

    const { data: owner, error: ownerError } =
      await supabaseAdmin.auth.admin.getUserById(company.created_by);
    if (ownerError || !owner?.user) return;

    const attribution = owner.user.user_metadata?.kyrivo_campaign_attribution;
    // Pas de transmission à OpenAI sans consentement explicite lors de la collecte.
    if (!attribution || attribution.marketing_consent !== true) return;

    const event: Record<string, unknown> = {
      id: `kyrivo_subscription_${data.stripeSubscriptionId}`,
      type: "subscription_created",
      timestamp_ms: data.timestampMs,
      source_url: "https://kyrivo.fr/abonnements",
      action_source: "web",
      opt_out: true,
      data: {
        type: "plan_enrollment",
        plan_id: `${data.plan}_${data.billingPeriod}`,
        ...(data.amountCents !== null && data.amountCents > 0
          ? { amount: data.amountCents, currency: data.currency.toUpperCase() }
          : {}),
      },
    };

    // Opaque, ne doit être ni reformaté ni journalisé.
    if (typeof attribution.oppref === "string" && attribution.oppref.length < 1024) {
      event.oppref = attribution.oppref;
    }

    const response = await fetch(
      `https://bzr.openai.com/v1/events?pid=${encodeURIComponent(pixelId)}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ validate_only: false, events: [event] }),
        signal: AbortSignal.timeout(3500),
      }
    );
    if (!response.ok) {
      console.warn("[OpenAI Ads] conversion subscription non reçue; status:", response.status);
    }
  } catch {
    console.warn("[OpenAI Ads] conversion subscription indisponible (non bloquant)");
  }
}
