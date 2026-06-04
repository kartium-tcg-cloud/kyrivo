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
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return {};
  }
  const safe: Record<string, unknown> = {};
  let count = 0;
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (count >= 10) break;
    const safeKey = String(k).slice(0, 50);
    safe[safeKey] = typeof v === "string" ? v.slice(0, 200) : v;
    count++;
  }
  return safe;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const event_name = body.event_name;

    if (typeof event_name !== "string" || !ALLOWED_EVENTS.has(event_name)) {
      return NextResponse.json(
        { ok: false, error: "Invalid event_name" },
        { status: 400 }
      );
    }

    await supabaseAdmin.from("funnel_events").insert({
      event_name,
      path:         trimField(body.path,         300),
      utm_source:   trimField(body.utm_source,   100),
      utm_medium:   trimField(body.utm_medium,   100),
      utm_campaign: trimField(body.utm_campaign, 150),
      utm_content:  trimField(body.utm_content,  150),
      referrer:     trimField(body.referrer,      500),
      metadata:     sanitizeMetadata(body.metadata),
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Best-effort : ne jamais échouer pour l'utilisateur
    return NextResponse.json({ ok: true });
  }
}
