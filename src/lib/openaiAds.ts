import { hasMarketingConsent } from "@/lib/analytics";
import { KYRIVO_OPENAI_ADS_PIXEL_ID } from "@/lib/openaiAdsConfig";

/** Événements normalisés documentés dans l'API OpenAI Ads. */
export type OpenAIAdsEvent =
  | "page_viewed"
  | "checkout_started"
  | "registration_completed"
  | "trial_started"
  | "subscription_created";

type PixelData = {
  type: "contents" | "customer_action" | "plan_enrollment";
  plan_id?: string;
  amount?: number;
  currency?: string;
  contents?: { id: string; name: string; content_type: "page" | "plan" | "product" }[];
};

declare global {
  interface Window {
    oaiq?: (...args: unknown[]) => void;
  }
}

/**
 * Uniquement après consentement marketing et initialisation du Pixel.
 * Les événements sont mis en file par le SDK, aucun appel bloquant.
 */
export function trackOpenAIAds(
  event: OpenAIAdsEvent,
  data: PixelData,
  eventId?: string
): void {
  if (typeof window === "undefined" || !hasMarketingConsent()) return;
  if (!KYRIVO_OPENAI_ADS_PIXEL_ID || !window.oaiq) return;
  try {
    // OpenAI measurement is only used for advertising attribution, not future user-level personalization.
    window.oaiq("measure", event, data, {
      opt_out: true,
      ...(eventId ? { event_id: eventId } : {}),
    });
  } catch {
    // Un incident de mesure ne bloque jamais les inscriptions ou paiements.
  }
}
