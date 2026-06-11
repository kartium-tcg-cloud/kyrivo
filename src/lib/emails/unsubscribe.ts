import crypto from "crypto";
import { APP_URL } from "./mailer";

type Scope = "kyrivo_followup" | "kyrivo_marketing" | "all";

export function createUnsubscribeUrl(
  email: string,
  scope: Scope = "kyrivo_followup"
): string {
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) throw new Error("[unsubscribe] UNSUBSCRIBE_SECRET manquant");

  const normalizedEmail = email.trim().toLowerCase();
  const payload = `${normalizedEmail}:${scope}`;

  const token = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  // TEMP DEBUG (non sensible, à retirer une fois le bug désinscription résolu)
  const secretFingerprint = crypto.createHash("sha256").update(secret).digest("hex").slice(0, 8);
  console.log(
    `[unsubscribe][debug] generate — payload="${payload}" secretFingerprint=${secretFingerprint} tokenPrefix=${token.slice(0, 8)}`
  );

  const url = new URL("/api/unsubscribe", APP_URL);
  url.searchParams.set("email", normalizedEmail);
  url.searchParams.set("scope", scope);
  url.searchParams.set("token", token);

  return url.toString();
}
