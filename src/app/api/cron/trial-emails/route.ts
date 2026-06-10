import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/emails/mailer";
import { createUnsubscribeUrl } from "@/lib/emails/unsubscribe";
import { trialWelcomeJ0 } from "@/lib/emails/templates/trialWelcomeJ0";
import { trialActivationJ3 } from "@/lib/emails/templates/trialActivationJ3";
import { trialLastDay } from "@/lib/emails/templates/trialLastDay";

export const runtime = "nodejs";
export const maxDuration = 60;

// ────────────────────────────────────────────────────────────────────────────
// Critère "vrai trial gratuit" — TRIPLE condition obligatoire.
//
// Un utilisateur est considéré en trial pur seulement si :
//   1. plan = "trial"       → n'a jamais acheté Pro/Business/Entreprise
//   2. status = "trialing"  → état Stripe/interne = essai en cours
//   3. stripe_subscription_id IS NULL → aucun abonnement Stripe créé (= pas d'achat)
//
// Si l'utilisateur a acheté Pro avant la fin du trial :
//   → plan devient "pro", stripe_subscription_id est rempli
//   → ces 3 conditions ne sont plus réunies → il ne recevra aucun email de relance.
// ────────────────────────────────────────────────────────────────────────────
function isPureTrial(sub: {
  plan: string;
  status: string;
  stripe_subscription_id: string | null;
}): boolean {
  return (
    sub.plan === "trial" &&
    sub.status === "trialing" &&
    !sub.stripe_subscription_id
  );
}

type EmailType = "trial_welcome_j0" | "trial_activation_j3" | "trial_last_day";

interface Candidate {
  userId: string;
  companyId: string;
  email: string;
  emailType: EmailType;
}

interface ProcessResult {
  email: string;
  emailType: EmailType;
  status: "sent" | "skipped" | "failed";
  reason?: string;
  messageId?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getUserEmail(userId: string): Promise<string | null> {
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (error || !user?.email) return null;
  return user.email;
}

async function isAlreadySent(userId: string, email: string, emailType: EmailType): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();

  // Check principal : par user_id
  const { data: byUserId } = await supabaseAdmin
    .from("email_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("email_type", emailType)
    .eq("status", "sent")
    .maybeSingle();
  if (byUserId) return true;

  // Fallback : par email (couvre les lignes insérées manuellement sans user_id)
  const { data: byEmail } = await supabaseAdmin
    .from("email_logs")
    .select("id")
    .eq("email", normalizedEmail)
    .eq("email_type", emailType)
    .eq("status", "sent")
    .maybeSingle();
  return !!byEmail;
}

async function isUnsubscribed(email: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  const { data } = await supabaseAdmin
    .from("email_unsubscribes")
    .select("id")
    .eq("email", normalizedEmail)
    .in("scope", ["kyrivo_followup", "all"])
    .maybeSingle();
  return !!data;
}

async function logEmail(params: {
  userId: string;
  companyId: string;
  email: string;
  emailType: EmailType;
  status: "sent" | "skipped" | "failed";
  messageId?: string;
  errorMessage?: string;
}) {
  const now = new Date().toISOString();
  await supabaseAdmin.from("email_logs").upsert(
    {
      user_id: params.userId,
      company_id: params.companyId,
      email: params.email.trim().toLowerCase(),
      email_type: params.emailType,
      status: params.status,
      provider_message_id: params.messageId ?? null,
      error_message: params.errorMessage ?? null,
      sent_at: params.status === "sent" ? now : null,
      updated_at: now,
    },
    { onConflict: "user_id,email_type", ignoreDuplicates: false }
  );
}

// ─── Candidate finders ───────────────────────────────────────────────────────

async function findJ0Candidates(): Promise<Candidate[]> {
  const now = new Date();
  const since48h = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();

  const { data: subs, error } = await supabaseAdmin
    .from("subscriptions")
    .select("id, company_id, plan, status, stripe_subscription_id, created_at")
    .eq("plan", "trial")
    .eq("status", "trialing")
    .is("stripe_subscription_id", null)
    .gte("created_at", since48h);

  if (error || !subs?.length) return [];

  const candidates: Candidate[] = [];

  for (const sub of subs) {
    if (!isPureTrial(sub)) continue;

    const { data: membership } = await supabaseAdmin
      .from("memberships")
      .select("user_id")
      .eq("company_id", sub.company_id)
      .maybeSingle();

    if (!membership?.user_id) continue;

    const email = await getUserEmail(membership.user_id);
    if (!email) continue;

    candidates.push({
      userId: membership.user_id,
      companyId: sub.company_id,
      email,
      emailType: "trial_welcome_j0",
    });
  }

  return candidates;
}

async function findJ3Candidates(): Promise<Candidate[]> {
  const now = new Date();
  // Au moins 3 jours depuis la création
  const j3Cutoff = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
  // Exclure la fenêtre "veille" (trial_ends_at dans les 48h) — le mail trial_last_day couvre cette plage
  const lastDayWindowCutoff = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();

  const { data: subs, error } = await supabaseAdmin
    .from("subscriptions")
    .select("id, company_id, plan, status, stripe_subscription_id, trial_ends_at, created_at")
    .eq("plan", "trial")
    .eq("status", "trialing")
    .is("stripe_subscription_id", null)
    .lte("created_at", j3Cutoff)
    .gt("trial_ends_at", lastDayWindowCutoff); // encore plus de 48h restantes

  if (error || !subs?.length) return [];

  const candidates: Candidate[] = [];

  for (const sub of subs) {
    if (!isPureTrial(sub)) continue;

    const { data: membership } = await supabaseAdmin
      .from("memberships")
      .select("user_id")
      .eq("company_id", sub.company_id)
      .maybeSingle();

    if (!membership?.user_id) continue;

    const email = await getUserEmail(membership.user_id);
    if (!email) continue;

    candidates.push({
      userId: membership.user_id,
      companyId: sub.company_id,
      email,
      emailType: "trial_activation_j3",
    });
  }

  return candidates;
}

async function findLastDayCandidates(): Promise<Candidate[]> {
  const now = new Date();
  // Fenêtre : trial_ends_at dans les 24h–48h à venir
  // → l'utilisateur est encore en trial, le mail part la veille de la fin
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  const { data: subs, error } = await supabaseAdmin
    .from("subscriptions")
    .select("id, company_id, plan, status, stripe_subscription_id, trial_ends_at")
    .eq("plan", "trial")
    .eq("status", "trialing")
    .is("stripe_subscription_id", null)
    .lte("trial_ends_at", in48h) // expire dans les 48h max
    .gt("trial_ends_at", in24h); // mais pas dans les 24h (encore 1 jour devant soi)

  if (error || !subs?.length) return [];

  const candidates: Candidate[] = [];

  for (const sub of subs) {
    if (!isPureTrial(sub)) continue;

    const { data: membership } = await supabaseAdmin
      .from("memberships")
      .select("user_id")
      .eq("company_id", sub.company_id)
      .maybeSingle();

    if (!membership?.user_id) continue;

    const email = await getUserEmail(membership.user_id);
    if (!email) continue;

    candidates.push({
      userId: membership.user_id,
      companyId: sub.company_id,
      email,
      emailType: "trial_last_day",
    });
  }

  return candidates;
}

// ─── Process one candidate ───────────────────────────────────────────────────

async function processCandidate(
  candidate: Candidate,
  dryRun: boolean
): Promise<ProcessResult> {
  const { userId, companyId, email, emailType } = candidate;

  // Anti-doublon : déjà envoyé ?
  const alreadySent = await isAlreadySent(userId, email, emailType);
  if (alreadySent) {
    return { email, emailType, status: "skipped", reason: "already_sent" };
  }

  // Désinscrit ?
  const unsubscribed = await isUnsubscribed(email);
  if (unsubscribed) {
    return { email, emailType, status: "skipped", reason: "unsubscribed" };
  }

  if (dryRun) {
    return { email, emailType, status: "skipped", reason: "dry_run" };
  }

  // Générer l'URL de désinscription
  const unsubscribeUrl = createUnsubscribeUrl(email, "kyrivo_followup");

  // Générer le template
  let template: { subject: string; html: string; text: string };
  if (emailType === "trial_welcome_j0") {
    template = trialWelcomeJ0({ unsubscribeUrl });
  } else if (emailType === "trial_activation_j3") {
    template = trialActivationJ3({ unsubscribeUrl });
  } else {
    template = trialLastDay({ unsubscribeUrl });
  }

  // Envoyer
  try {
    const messageId = await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      unsubscribeUrl,
    });

    await logEmail({ userId, companyId, email, emailType, status: "sent", messageId });

    return { email, emailType, status: "sent", messageId };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
    await logEmail({ userId, companyId, email, emailType, status: "failed", errorMessage });

    return { email, emailType, status: "failed", reason: errorMessage };
  }
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  // Vérification du secret cron
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[cron/trial-emails] CRON_SECRET manquant");
    return NextResponse.json({ error: "Configuration serveur incomplète" }, { status: 500 });
  }

  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const dryRun = request.nextUrl.searchParams.get("dryRun") === "true";

  console.log(`[cron/trial-emails] Démarrage — dryRun=${dryRun}`);

  try {
    // Trouver tous les candidats en parallèle
    const [j0Candidates, j3Candidates, lastDayCandidates] = await Promise.all([
      findJ0Candidates(),
      findJ3Candidates(),
      findLastDayCandidates(),
    ]);

    const allCandidates = [...j0Candidates, ...j3Candidates, ...lastDayCandidates];

    console.log(
      `[cron/trial-emails] Candidats — J0:${j0Candidates.length} J3:${j3Candidates.length} LastDay:${lastDayCandidates.length}`
    );

    // Traiter chaque candidat séquentiellement (évite de surcharger SMTP)
    const results: ProcessResult[] = [];
    for (const candidate of allCandidates) {
      const result = await processCandidate(candidate, dryRun);
      results.push(result);
      console.log(
        `[cron/trial-emails] ${result.emailType} → ${result.email} : ${result.status}${result.reason ? ` (${result.reason})` : ""}`
      );
    }

    const sent = results.filter((r) => r.status === "sent").length;
    const skipped = results.filter((r) => r.status === "skipped").length;
    const failed = results.filter((r) => r.status === "failed").length;

    return NextResponse.json({
      ok: true,
      dryRun,
      summary: { total: allCandidates.length, sent, skipped, failed },
      results: dryRun
        ? results.map((r) => ({ emailType: r.emailType, email: r.email.replace(/(.{2}).*@/, "$1…@"), reason: r.reason }))
        : results.map((r) => ({ emailType: r.emailType, status: r.status, reason: r.reason })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[cron/trial-emails] Erreur fatale:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
