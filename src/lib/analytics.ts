// Utilitaires de tracking Kyrivo — deux niveaux :
// 1. trackMeta / trackMetaCustom : Meta Pixel, uniquement si consentement marketing
// 2. trackFunnel : tracking interne minimal, jamais envoyé à Meta

const CONSENT_KEY    = "kyrivo_cookie_consent";
const FUNNEL_API     = "/api/analytics/funnel";
const UTM_SESSION_KEY = "kyrivo_utm_session";

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

type UtmKey = (typeof UTM_KEYS)[number];

export type FunnelEvent =
  | "landing_view"
  | "cta_register_click"
  | "register_view"
  | "registration_success";

// ─── Consentement ──────────────────────────────────────────────
export function hasMarketingConsent(): boolean {
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) return false;
    const { marketing } = JSON.parse(stored) as { marketing?: boolean };
    return marketing === true;
  } catch {
    return false;
  }
}

// ─── UTM sessionStorage helpers ────────────────────────────────

function readSessionUtms(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem(UTM_SESSION_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

// Lit les UTM de l'URL courante et les persiste en sessionStorage.
// Doit être appelé le plus tôt possible sur chaque page entry (avant toute
// manipulation d'URL par Next.js ou Meta).
// Ne touche pas aux clés manquantes : fusionne sans écraser ce qui existe.
export function storeUtmsInSession(): void {
  if (typeof window === "undefined") return;
  try {
    const sp = new URLSearchParams(window.location.search);
    const fromUrl: Partial<Record<UtmKey, string>> = {};
    for (const key of UTM_KEYS) {
      const v = sp.get(key);
      if (v) fromUrl[key] = v;
    }
    if (Object.keys(fromUrl).length === 0) return; // rien à sauvegarder

    // Merge : URL gagne sur les clés communes, session préserve les autres
    const existing = readSessionUtms();
    sessionStorage.setItem(
      UTM_SESSION_KEY,
      JSON.stringify({ ...existing, ...fromUrl })
    );
  } catch {
    // sessionStorage indisponible (navigation privée stricte, iframe cross-origin)
  }
}

// ─── UTM ───────────────────────────────────────────────────────
// Stratégie de lecture : URL courante en priorité, sessionStorage en fallback.
// Merge les deux sources : URL gagne sur les clés présentes, session comble les manquants.
// Exemple : URL a utm_campaign mais plus utm_source → session fournit utm_source.
export function getUtmParams(): Record<string, string> {
  if (typeof window === "undefined") return {};

  // 1. URL courante
  const sp = new URLSearchParams(window.location.search);
  const fromUrl: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const v = sp.get(key);
    if (v) fromUrl[key] = v;
  }

  // 2. sessionStorage (sauvegardé à l'arrivée initiale via storeUtmsInSession)
  const fromSession = readSessionUtms();

  // 3. Merge : session en base, URL en priorité
  return { ...fromSession, ...fromUrl };
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
        utm_source:   utms.utm_source   ?? null,
        utm_medium:   utms.utm_medium   ?? null,
        utm_campaign: utms.utm_campaign ?? null,
        utm_content:  utms.utm_content  ?? null,
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
// eventId optionnel : permet la déduplication navigateur/CAPI côté Meta
export function trackMeta(
  event: string,
  params?: Record<string, unknown>,
  eventId?: string
): void {
  if (eventId) {
    fbq()?.("track", event, params, { eventID: eventId });
  } else {
    fbq()?.("track", event, params);
  }
}

// Événements Meta custom (e.g. "ClickStartTrial", "ViewRegister")
export function trackMetaCustom(
  event: string,
  params?: Record<string, unknown>
): void {
  fbq()?.("trackCustom", event, params);
}

// ─── Meta Conversions API (CAPI) ───────────────────────────────
// Appel serveur best-effort — ne bloque jamais l'inscription si Meta échoue.
// Doit être appelé uniquement si hasMarketingConsent() === true.
// L'email est hashé côté serveur ; ne jamais l'afficher ou le stocker.
export async function sendMetaCapi(payload: {
  event_id: string;
  email?: string;
  source_url?: string;
  utm_source?: string;
  utm_campaign?: string;
  utm_content?: string;
}): Promise<void> {
  try {
    await fetch("/api/meta/lead", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
  } catch {
    // best-effort : erreur réseau ignorée
  }
}
