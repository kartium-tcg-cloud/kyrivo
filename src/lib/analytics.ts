// Utilitaires de tracking Kyrivo — deux niveaux :
// 1. trackMeta / trackMetaCustom : Meta Pixel, uniquement si consentement marketing
// 2. trackFunnel : tracking interne minimal, jamais envoyé à Meta

const CONSENT_KEY = "kyrivo_cookie_consent";
const FUNNEL_API = "/api/analytics/funnel";

export type FunnelEvent =
  | "landing_view"
  | "cta_register_click"
  | "register_view"
  | "registration_success";

// ─── Consentement ──────────────────────────────────────────────
function hasMarketingConsent(): boolean {
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) return false;
    const { marketing } = JSON.parse(stored) as { marketing?: boolean };
    return marketing === true;
  } catch {
    return false;
  }
}

// ─── UTM ───────────────────────────────────────────────────────
export function getUtmParams(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const sp = new URLSearchParams(window.location.search);
  const result: Record<string, string> = {};
  for (const key of [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
  ]) {
    const v = sp.get(key);
    if (v) result[key] = v;
  }
  return result;
}

export function buildRegisterUrl(): string {
  const utms = getUtmParams();
  const qs = new URLSearchParams(utms).toString();
  return qs ? `/register?${qs}` : "/register";
}

// ─── Tracking interne ──────────────────────────────────────────
// Best-effort : ne bloque jamais l'utilisateur si l'API échoue
export async function trackFunnel(
  eventName: FunnelEvent,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    const utms = getUtmParams();
    await fetch(FUNNEL_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: eventName,
        path: typeof window !== "undefined" ? window.location.pathname : null,
        utm_source: utms.utm_source ?? null,
        utm_medium: utms.utm_medium ?? null,
        utm_campaign: utms.utm_campaign ?? null,
        utm_content: utms.utm_content ?? null,
        referrer:
          typeof document !== "undefined" ? document.referrer || null : null,
        metadata,
      }),
    });
  } catch {
    // best-effort
  }
}

// ─── Meta Pixel ────────────────────────────────────────────────
type FbqFn = (...args: unknown[]) => void;

function fbq(): FbqFn | undefined {
  if (typeof window === "undefined" || !hasMarketingConsent()) return undefined;
  return (window as unknown as Record<string, unknown>).fbq as FbqFn | undefined;
}

// Événements Meta standard (e.g. "ViewContent", "Lead", "PageView")
export function trackMeta(
  event: string,
  params?: Record<string, unknown>
): void {
  fbq()?.("track", event, params);
}

// Événements Meta custom (e.g. "ClickStartTrial", "ViewRegister")
export function trackMetaCustom(
  event: string,
  params?: Record<string, unknown>
): void {
  fbq()?.("trackCustom", event, params);
}
