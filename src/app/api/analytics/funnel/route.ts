import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const ALLOWED_EVENTS = new Set([
  "landing_view",
  "cta_register_click",
  "register_view",
  "registration_success",
]);

// Tronque un champ texte et rejette les non-strings
function trimField(value: unknown, maxLen: number): string | null {
  if (typeof value !== "string") return null;
  const s = value.trim();
  return s.length > 0 ? s.slice(0, maxLen) : null;
}

// Valide et assainit metadata : objet plat, max 10 clés
function sanitizeMetadata(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }
  const safe: Record<string, unknown> = {};
  let count = 0;
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (count >= 10) break;
    safe[String(k).slice(0, 50)] =
      typeof v === "string" ? v.slice(0, 200) : v;
    count++;
  }
  return safe;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── 0. Guard service role ────────────────────────────────────
  // Défense en profondeur : vérifier ici aussi que la clé est présente.
  // admin.ts throw déjà si elle est absente, mais ce check produit un message
  // explicite dans les logs Vercel sans exposer la valeur.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      "[funnel] SUPABASE_SERVICE_ROLE_KEY absent.",
      "L'insert ne peut pas utiliser le service role.",
      "Configurez cette variable dans les variables d'environnement serveur (pas NEXT_PUBLIC_)."
    );
    return NextResponse.json(
      { ok: false, error: "server_misconfiguration" },
      { status: 500 }
    );
  }

  // ── 1. Parse du body ────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // ── 2. Validation event_name ────────────────────────────────
  const event_name = body.event_name;
  if (typeof event_name !== "string" || !ALLOWED_EVENTS.has(event_name)) {
    return NextResponse.json(
      { ok: false, error: "Invalid event_name" },
      { status: 400 }
    );
  }

  // ── 3. Nettoyage des champs ─────────────────────────────────
  const payload = {
    event_name,
    path:         trimField(body.path,         300),
    utm_source:   trimField(body.utm_source,   100),
    utm_medium:   trimField(body.utm_medium,   100),
    utm_campaign: trimField(body.utm_campaign, 150),
    utm_content:  trimField(body.utm_content,  150),
    referrer:     trimField(body.referrer,      500),
    metadata:     sanitizeMetadata(body.metadata),
  };

  console.log(
    "[funnel] event:", event_name,
    "| service_role_key_present:", !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    "| utm_source:", payload.utm_source,
    "| path:", payload.path
  );

  // ── 4. Insertion Supabase ────────────────────────────────────
  // supabase-js retourne { data, error } — il ne lève jamais d'exception.
  // On doit impérativement vérifier error, sinon les échecs sont silencieux.
  const { error: insertError } = await supabaseAdmin
    .from("funnel_events")
    .insert(payload);

  if (insertError) {
    console.error(
      "[funnel] insert failed:",
      insertError.message,
      "| code:", insertError.code,
      "| details:", insertError.details
    );
    return NextResponse.json(
      { ok: false, error: "insert_failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
