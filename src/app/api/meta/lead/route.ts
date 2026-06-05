import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

const META_GRAPH_API = "https://graph.facebook.com/v19.0";

function sha256hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function trimStr(value: unknown, maxLen: number): string | null {
  if (typeof value !== "string") return null;
  const s = value.trim();
  return s.length > 0 ? s.slice(0, maxLen) : null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── 1. Vérification des variables serveur ───────────────────
  const pixelId     = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    console.error("[meta-capi] META_PIXEL_ID ou META_CAPI_ACCESS_TOKEN manquant");
    return NextResponse.json(
      { ok: false, error: "server_misconfiguration" },
      { status: 500 }
    );
  }

  // ── 2. Parse du body ────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 }
    );
  }

  // ── 3. Validation ───────────────────────────────────────────
  const eventId = trimStr(body.event_id, 128);
  if (!eventId) {
    return NextResponse.json(
      { ok: false, error: "event_id_required" },
      { status: 400 }
    );
  }

  // ── 4. user_data : hash email côté serveur uniquement ───────
  const userData: Record<string, string> = {};
  if (typeof body.email === "string" && body.email.trim()) {
    // Normalise avant hash : trim + lowercase
    userData.em = sha256hex(body.email.trim().toLowerCase());
    // L'email et son hash ne sont jamais loggués
  }

  // ── 5. custom_data ──────────────────────────────────────────
  const customData: Record<string, string> = {
    content_name: "Kyrivo Registration",
  };
  const utmSource   = trimStr(body.utm_source,   100);
  const utmCampaign = trimStr(body.utm_campaign, 150);
  const utmContent  = trimStr(body.utm_content,  150);
  if (utmSource)   customData.utm_source   = utmSource;
  if (utmCampaign) customData.utm_campaign = utmCampaign;
  if (utmContent)  customData.utm_content  = utmContent;

  // ── 6. Construction du payload CAPI ─────────────────────────
  const sourceUrl =
    trimStr(body.source_url, 500) ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://kyrivo.com";

  const capiPayload: Record<string, unknown> = {
    data: [
      {
        event_name:       "Lead",
        event_time:       Math.floor(Date.now() / 1000),
        event_id:         eventId,
        action_source:    "website",
        event_source_url: sourceUrl,
        user_data:        userData,
        custom_data:      customData,
      },
    ],
  };

  // Test event code (facultatif — pour Events Manager > Événements de test)
  const testCode = process.env.META_TEST_EVENT_CODE;
  if (testCode) {
    capiPayload.test_event_code = testCode;
  }

  // ── 7. Envoi à Meta CAPI ────────────────────────────────────
  // Le token est passé en query param (jamais loggué)
  const endpoint = `${META_GRAPH_API}/${pixelId}/events?access_token=${accessToken}`;

  try {
    const res = await fetch(endpoint, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(capiPayload),
    });

    if (!res.ok) {
      // On loggue le statut sans exposer le token
      console.error("[meta-capi] Réponse Meta non-ok:", res.status);
      return NextResponse.json({ ok: false, error: "meta_api_error" });
    }

    console.log("[meta-capi] Lead envoyé — event_id:", eventId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(
      "[meta-capi] Erreur réseau:",
      err instanceof Error ? err.message : "unknown"
    );
    return NextResponse.json({ ok: false, error: "network_error" });
  }
}
