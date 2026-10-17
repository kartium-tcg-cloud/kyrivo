import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Marque un compte comme configuré uniquement après enregistrement réussi
// des préférences. La propriété est persistée par société, pas dans le navigateur.
export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get("origin");
    if (origin && origin !== new URL(req.url).origin) {
      return NextResponse.json({ ok: false, error: "Origine non autorisée." }, { status: 403 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Connexion requise." }, { status: 401 });
    }

    const { data: membership, error: membershipError } = await supabase
      .from("memberships")
      .select("company_id, role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) throw membershipError;
    if (!membership?.company_id || membership.role !== "owner") {
      return NextResponse.json({ ok: false, error: "Seul le propriétaire peut configurer la société." }, { status: 403 });
    }

    const { data: preferences, error: preferencesError } = await supabaseAdmin
      .from("company_preferences")
      .select("invoice_company_name")
      .eq("company_id", membership.company_id)
      .maybeSingle();

    if (preferencesError) throw preferencesError;
    const name = preferences?.invoice_company_name?.trim() ?? "";
    if (!name || name.length > 120) {
      return NextResponse.json({ ok: false, error: "Le nom commercial est obligatoire (120 caractères maximum)." }, { status: 400 });
    }

    const { error: updateError } = await supabaseAdmin
      .from("companies")
      .update({ name, onboarding_completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", membership.company_id);

    if (updateError) throw updateError;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[onboarding/complete]", error);
    return NextResponse.json({ ok: false, error: "Impossible de finaliser la configuration. Réessayez." }, { status: 500 });
  }
}
