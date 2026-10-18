import { hasMarketingConsent } from "@/lib/analytics";

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
  if (!process.env.NEXT_PUBLIC_OPENAI_ADS_PIXEL_ID || !window.oaiq) return;
  try {
    if (eventId) window.oaiq("measure", event, data, { event_id: eventId });
    else window.oaiq("measure", event, data);
  } catch {
    // Un incident de mesure ne bloque jamais les inscriptions ou paiements.
  }
}
