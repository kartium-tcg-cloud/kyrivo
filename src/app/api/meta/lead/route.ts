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
  // ── 1. Diagnostic variables serveur ────────────────────────
  const pixelId     = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  const testCode    = process.env.META_TEST_EVENT_CODE;

  console.log(
    "[meta-capi] config —",
    "pixel_id_present:", !!pixelId,
    "| token_present:", !!accessToken,
    "| test_event_code_present:", !!testCode
  );

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

  console.log("[meta-capi] event_id reçu:", eventId);

  // ── 4. user_data : em = tableau de hash SHA-256 ─────────────
  // Meta CAPI exige un tableau : { "em": ["hash"] }
  // Email normalisé côté serveur : trim + lowercase avant hash.
  // Ni l'email ni le hash ne sont loggués.
  const userData: Record<string, unknown> = {};
  if (typeof body.email === "string" && body.email.trim()) {
    userData.em = [sha256hex(body.email.trim().toLowerCase())];
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

  // test_event_code uniquement si la variable est définie
  if (testCode) {
    capiPayload.test_event_code = testCode;
  }

  // ── 7. Envoi à Meta CAPI ────────────────────────────────────
  // Le token est passé en query param — jamais loggué
  const endpoint = `${META_GRAPH_API}/${pixelId}/events?access_token=${accessToken}`;

  try {
    const res = await fetch(endpoint, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(capiPayload),
    });

    // Lire la réponse JSON de Meta pour logs précis
    let metaJson: Record<string, unknown> = {};
    try {
      metaJson = (await res.json()) as Record<string, unknown>;
    } catch {
      // réponse non-JSON (rare)
    }

    if (!res.ok) {
      // Extraire le message d'erreur Meta sans exposer de données sensibles
      const metaError = metaJson.error as Record<string, unknown> | undefined;
      console.error(
        "[meta-capi] Meta API error —",
        "status:", res.status,
        "| message:", metaError?.message ?? "unknown",
        "| code:", metaError?.code ?? "unknown",
        "| type:", metaError?.type ?? "unknown"
      );
      return NextResponse.json({ ok: false, error: "meta_api_error" });
    }

    console.log(
      "[meta-capi] Lead accepté par Meta —",
      "event_id:", eventId,
      "| events_received:", metaJson.events_received ?? "?"
    );
    return NextResponse.json({
      ok: true,
      events_received: metaJson.events_received ?? null,
    });
  } catch (err) {
    console.error(
      "[meta-capi] Erreur réseau:",
      err instanceof Error ? err.message : "unknown"
    );
    return NextResponse.json({ ok: false, error: "network_error" });
  }
}
