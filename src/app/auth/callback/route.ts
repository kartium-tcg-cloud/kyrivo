import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  // Supabase ajoute normalement un code dans l'URL après confirmation email.
  const code = searchParams.get("code");

  // Page vers laquelle on redirige après validation réussie.
  // On garde /dashboard comme destination par défaut.
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=missing_confirmation_code`
    );
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Auth callback error:", error.message);

    return NextResponse.redirect(
      `${origin}/login?error=confirmation_failed`
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}