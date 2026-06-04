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
  // ── DIAG-0 : état des variables d'environnement ──────────────
  // Temporaire — à retirer une fois le tracking stable
  const srkPresent = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const srkLength  = process.env.SUPABASE_SERVICE_ROLE_KEY?.length ?? 0;
  const anonKey    = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const srkIsAnon  =
    srkPresent && !!anonKey &&
    process.env.SUPABASE_SERVICE_ROLE_KEY === anonKey;

  console.log(
    "[funnel-diag]",
    "url_present:",  !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    "| srk_present:", srkPresent,
    "| srk_length:",  srkLength,
    "| srk_is_anon:", srkIsAnon
  );

  // ── 0. Guard service role ────────────────────────────────────
  if (!srkPresent) {
    console.error(
      "[funnel] SUPABASE_SERVICE_ROLE_KEY absent.",
      "Configurez cette variable dans les variables d'environnement serveur (pas NEXT_PUBLIC_)."
    );
    return NextResponse.json(
      { ok: false, error: "server_misconfiguration" },
      { status: 500 }
    );
  }

  if (srkIsAnon) {
    console.error(
      "[funnel] SUPABASE_SERVICE_ROLE_KEY est identique à l'anon key.",
      "La service role key doit être distincte et ne doit pas commencer par NEXT_PUBLIC_."
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

  console.log("[funnel] event:", event_name, "| utm_source:", payload.utm_source, "| path:", payload.path);

  // ── DIAG-1 : vérification des droits admin avant insert ──────
  // Temporaire — appel à l'API admin pour confirmer que la clé a bien le rôle service_role.
  // Si cette clé n'est pas la service role, listUsers retourne une erreur d'auth.
  const adminCheck = await supabaseAdmin.auth.admin.listUsers({ perPage: 1 });
  if (adminCheck.error) {
    console.error(
      "[funnel] service role admin check failed:",
      adminCheck.error.message,
      "| status:", (adminCheck.error as { status?: number }).status ?? "unknown"
    );
    return NextResponse.json(
      { ok: false, error: "service_role_invalid" },
      { status: 500 }
    );
  }
  console.log("[funnel-diag] admin check OK — service role confirmed");

  // ── 4. Insertion Supabase ────────────────────────────────────
  // supabase-js retourne { data, error } — il ne lève jamais d'exception.
  const { error: insertError } = await supabaseAdmin
    .from("funnel_events")
    .insert(payload);

  if (insertError) {
    if (insertError.code === "42501") {
      console.error(
        "[funnel] service role works but insert denied (42501).",
        "La clé admin est valide mais l'insert est refusé.",
        "Vérifiez : nom de la table (public.funnel_events), colonnes, schema, et que RLS",
        "n'a pas de politique DENY explicite pour service_role."
      );
    } else {
      console.error(
        "[funnel] insert failed:",
        insertError.message,
        "| code:", insertError.code,
        "| details:", insertError.details
      );
    }
    return NextResponse.json(
      { ok: false, error: "insert_failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
