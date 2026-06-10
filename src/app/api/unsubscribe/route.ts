import { NextRequest } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const ALLOWED_SCOPES = ["kyrivo_followup", "kyrivo_marketing", "all"] as const;
type Scope = (typeof ALLOWED_SCOPES)[number];

function htmlSuccess(): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Désinscription confirmée — Kyrivo</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0a0a0a;
      color: #e5e5e5;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .card {
      background: #141414;
      border: 1px solid #2a2a2a;
      border-radius: 12px;
      padding: 2.5rem 2rem;
      max-width: 480px;
      width: 100%;
      text-align: center;
    }
    .icon {
      width: 48px;
      height: 48px;
      background: rgba(245,158,11,0.13);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      font-size: 1.4rem;
    }
    h1 { font-size: 1.5rem; font-weight: 700; color: #f59e0b; margin-bottom: 0.75rem; }
    p { color: #a3a3a3; line-height: 1.6; }
    .subtext {
      font-size: 0.875rem;
      color: #737373;
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid #2a2a2a;
    }
    .btn {
      display: inline-block;
      margin-top: 1.75rem;
      padding: 0.6875rem 1.5rem;
      background: #f59e0b;
      color: #0a0a0a;
      font-weight: 600;
      font-size: 0.9375rem;
      text-decoration: none;
      border-radius: 8px;
    }
    .btn:hover { background: #d97706; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✓</div>
    <h1>Désinscription confirmée</h1>
    <p>Tu ne recevras plus les emails de suivi Kyrivo pour cette adresse.</p>
    <p class="subtext">Ton compte Kyrivo reste actif. Tu peux toujours te connecter et utiliser le service normalement.</p>
    <a href="https://kyrivo.kartium-tcg.com" class="btn">Retourner sur Kyrivo</a>
  </div>
</body>
</html>`;
}

function htmlError(): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Lien invalide — Kyrivo</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0a0a0a;
      color: #e5e5e5;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .card {
      background: #141414;
      border: 1px solid #2a2a2a;
      border-radius: 12px;
      padding: 2.5rem 2rem;
      max-width: 480px;
      width: 100%;
      text-align: center;
    }
    .icon {
      width: 48px;
      height: 48px;
      background: rgba(239,68,68,0.13);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      font-size: 1.4rem;
    }
    h1 { font-size: 1.5rem; font-weight: 700; color: #ef4444; margin-bottom: 0.75rem; }
    p { color: #a3a3a3; line-height: 1.6; }
    a { color: #f59e0b; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✕</div>
    <h1>Lien de désinscription invalide</h1>
    <p>Le lien utilisé est invalide ou a expiré. Si tu souhaites ne plus recevoir d'emails Kyrivo, <a href="mailto:contact@kartium-tcg.com">contacte-nous</a>.</p>
  </div>
</body>
</html>`;
}

function respond(html: string, status = 200) {
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function verifyToken(
  normalizedEmail: string,
  scope: string,
  token: string
): boolean {
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) return false;

  const payload = `${normalizedEmail}:${scope}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  try {
    const tokenBuf = Buffer.from(token, "hex");
    const expectedBuf = Buffer.from(expected, "hex");
    if (tokenBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(tokenBuf, expectedBuf);
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const emailRaw = searchParams.get("email") ?? "";
  const scopeRaw = searchParams.get("scope") ?? "kyrivo_followup";
  const token = searchParams.get("token") ?? "";

  // --- Validation des paramètres ---
  if (!emailRaw || !token) return respond(htmlError(), 400);

  const normalizedEmail = emailRaw.trim().toLowerCase();
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail))
    return respond(htmlError(), 400);

  if (!(ALLOWED_SCOPES as readonly string[]).includes(scopeRaw))
    return respond(htmlError(), 400);
  const scope = scopeRaw as Scope;

  // Token attendu : 64 caractères hexadécimaux (sha256)
  if (!/^[0-9a-f]{64}$/.test(token)) return respond(htmlError(), 400);

  // --- Vérification variable d'environnement ---
  if (!process.env.UNSUBSCRIBE_SECRET) {
    console.error("[unsubscribe] UNSUBSCRIBE_SECRET manquante");
    return respond(htmlError(), 500);
  }

  // --- Vérification HMAC ---
  if (!verifyToken(normalizedEmail, scope, token)) {
    console.warn("[unsubscribe] token invalide pour", normalizedEmail);
    return respond(htmlError(), 403);
  }

  // --- Upsert dans email_unsubscribes ---
  // On tente un insert ; si conflit sur (email_normalized, scope), la ligne existe déjà → succès idempotent.
  const { error } = await supabaseAdmin.from("email_unsubscribes").insert({
    email: normalizedEmail,
    scope,
    source: "unsubscribe_link",
    reason: "Désinscription via lien email",
  });

  if (error) {
    if (error.code === "23505") {
      // Déjà désinscrit — idempotent, on retourne succès
      return respond(htmlSuccess());
    }
    console.error("[unsubscribe] erreur Supabase:", error.code, error.message);
    return respond(htmlError(), 500);
  }

  return respond(htmlSuccess());
}
