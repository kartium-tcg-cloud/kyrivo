import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { stripe } from "@/lib/stripe";
import { sendOpenAISubscriptionConversion } from "@/lib/openaiAdsServer";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getPlanFromPriceId } from "@/lib/stripe-plans";

function getMonthlyLineLimit(plan: string): number {
  if (plan === "pro") return 500;
  if (plan === "business") return 5000;
  if (plan === "entreprise") return 50000;
  return 0;
}

function getDurationMonths(billingPeriod: string): number {
  return billingPeriod === "quarterly" ? 3 : 1;
}

function addMonths(date: Date, months: number): Date {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

function getPlanRank(plan: string | null | undefined): number {
  if (plan === "trial") return 1;
  if (plan === "pro") return 1;
  if (plan === "business") return 2;
  if (plan === "entreprise") return 3;
  return 0;
}

// Calcule un mois civil de quota, même sur les forfaits facturés au trimestre.
function addOneCalendarMonth(date: Date): Date {
  const result = new Date(date);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + 1);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

function quotaPeriodEnd(start: Date, entitlementEnd: Date, billingPeriod: string | null): Date {
  return billingPeriod === "quarterly"
    ? new Date(Math.min(addOneCalendarMonth(start).getTime(), entitlementEnd.getTime()))
    : entitlementEnd;
}

function maxDate(...dates: Array<Date | null | undefined>): Date {
  const validDates = dates.filter(Boolean) as Date[];

  if (validDates.length === 0) {
    return new Date();
  }

  return new Date(Math.max(...validDates.map((date) => date.getTime())));
}

function mapStripeStatusToSupabase(
  status: Stripe.Subscription.Status
): "active" | "past_due" | "canceled" {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      // past_due, unpaid, incomplete, paused
      return "past_due";
  }
}

type SubscriptionRow = {
  company_id: string;
  stripe_subscription_id: string | null;
  status: string;
  plan: string;
  billing_period: string | null;
  subscription_ends_at: string | null;
};

// Retrouve la ligne Supabase correspondant à l'événement Stripe.
// Priorité : stripe_subscription_id. Fallback : stripe_customer_id, mais
// uniquement si la ligne trouvée ne référence pas déjà une AUTRE subscription
// Stripe (ex: ancien abonnement annulé lors d'un upgrade) — on ne met jamais
// à jour la mauvaise company.
async function findSubscriptionRow(
  stripeSubscriptionId: string,
  stripeCustomerId: string | null
): Promise<SubscriptionRow | null> {
  const { data: byStripeSubId, error: byStripeSubIdError } = await supabaseAdmin
    .from("subscriptions")
    .select("company_id, stripe_subscription_id, status, plan, billing_period, subscription_ends_at")
    .eq("stripe_subscription_id", stripeSubscriptionId)
    .maybeSingle();

  if (byStripeSubIdError) throw byStripeSubIdError;
  if (byStripeSubId) return byStripeSubId;

  if (!stripeCustomerId) return null;

  const { data: byCustomerId, error: byCustomerIdError } = await supabaseAdmin
    .from("subscriptions")
    .select("company_id, stripe_subscription_id, status, plan, billing_period, subscription_ends_at")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();

  if (byCustomerIdError) throw byCustomerIdError;
  if (!byCustomerId) return null;

  if (
    byCustomerId.stripe_subscription_id &&
    byCustomerId.stripe_subscription_id !== stripeSubscriptionId
  ) {
    return null;
  }

  return byCustomerId;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  const primarySecret = process.env.STRIPE_WEBHOOK_SECRET;
  // Migration de domaine : secret de l'ancien endpoint kyrivo.kartium-tcg.com.
  // À supprimer une fois l'endpoint kyrivo.fr actif et l'ancien désactivé dans Stripe.
  const legacySecret = process.env.STRIPE_WEBHOOK_SECRET_LEGACY;

  if (!signature || !primarySecret) {
    return NextResponse.json(
      { error: "Webhook Stripe invalide" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, primarySecret);
  } catch (primaryError: any) {
    if (!legacySecret) {
      console.error("Erreur signature webhook Stripe:", primaryError.message);
      return NextResponse.json(
        { error: "Signature webhook invalide" },
        { status: 400 }
      );
    }
    try {
      event = stripe.webhooks.constructEvent(body, signature, legacySecret);
    } catch {
      console.error("Erreur signature webhook Stripe:", primaryError.message);
      return NextResponse.json(
        { error: "Signature webhook invalide" },
        { status: 400 }
      );
    }
  }

  try {
    // ── customer.subscription.deleted ─────────────────────────────────────
    if (event.type === "customer.subscription.deleted") {
      const stripeSubscription = event.data.object as Stripe.Subscription;

      await supabaseAdmin
        .from("subscriptions")
        .update({
          status: "canceled",
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", stripeSubscription.id);

      return NextResponse.json({ received: true });
    }

    // ── invoice.paid (renouvellements uniquement) ──────────────────────────
    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;

      // On ne traite que les renouvellements automatiques, pas la création initiale
      if (invoice.billing_reason !== "subscription_cycle") {
        return NextResponse.json({ received: true });
      }

      // SDK v22 : subscription dans parent.subscription_details.subscription
      // Legacy : directement dans invoice.subscription
      const invoiceRaw = invoice as any;
      const stripeSubId: string | null =
        typeof invoiceRaw.subscription === "string"
          ? invoiceRaw.subscription
          : typeof invoiceRaw.parent?.subscription_details?.subscription === "string"
          ? invoiceRaw.parent.subscription_details.subscription
          : null;

      if (!stripeSubId) return NextResponse.json({ received: true });

      const invoiceCustomerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id ?? null;

      const row = await findSubscriptionRow(stripeSubId, invoiceCustomerId);

      if (!row) {
        console.error("[invoice.paid] Abonnement introuvable dans Supabase:", {
          stripeSubId,
          stripeCustomerId: invoiceCustomerId,
        });
        return NextResponse.json({ received: true });
      }

      // Abonnement déjà annulé côté Kyrivo : on ne prolonge pas
      if (row.status === "canceled") return NextResponse.json({ received: true });

      // ── Source de vérité : lignes de cette facture précise ───────────────
      // Toutes les dates sont lues depuis invoice.id, immuable après finalisation.
      // Rejouer cet événement à n'importe quelle date produit toujours les mêmes
      // valeurs — la subscription n'est jamais consultée.

      // Prédicat : ligne d'abonnement non-proration
      const isRenewalLine = (l: Stripe.InvoiceLineItem) =>
        l.parent?.type === "subscription_item_details" &&
        l.parent.subscription_item_details?.proration !== true;

      // Étape 1 : lignes embarquées dans le payload webhook
      let renewalLine = invoice.lines.data.find(isRenewalLine);

      // Étape 2 : si la liste est incomplète, récupérer les lignes via l'API
      // de cette facture (invoice.id) — pas l'état courant de la subscription
      if (!renewalLine && invoice.lines.has_more) {
        const allLines = await stripe.invoices.listLineItems(invoice.id, { limit: 100 });
        renewalLine = allLines.data.find(isRenewalLine);
      }

      // Étape 3 : sans ligne fiable, échec → Stripe réessaiera
      if (!renewalLine) {
        console.error("[invoice.paid] Ligne d'abonnement introuvable:", {
          invoiceId: invoice.id,
          stripeSubId,
        });
        return NextResponse.json(
          { error: "Ligne d'abonnement introuvable" },
          { status: 500 }
        );
      }

      const periodStart = new Date(renewalLine.period.start * 1000);
      const periodEnd = new Date(renewalLine.period.end * 1000);

      // Une facture de renouvellement non réglée jusqu'à plusieurs jours après
      // l'échéance ne doit pas faire perdre des jours de service au client.
      // On utilise le vrai paid_at Stripe, jamais l'heure du webhook (rejouable).
      // Le décalage n'est opéré que sur la période courante, pour un abonnement
      // Stripe FLEXIBLE, sans résiliation programmée et sans autre facture due.
      // Contrairement au mode classic, ce changement d'ancre en mode flexible
      // avec proration_behavior=none ne crée pas de facture immédiate.
      const paidAt = invoice.status_transitions?.paid_at ?? null;
      const isLate = paidAt !== null && paidAt - renewalLine.period.start >= 24 * 3600;
      let effectiveStart = periodStart;
      let effectiveEnd = periodEnd;

      if (isLate && paidAt !== null) {
        const live = await stripe.subscriptions.retrieve(stripeSubId);
        const liveItem = live.items.data[0];
        const alreadyAdjusted = live.metadata?.kyrivo_late_invoice_id === invoice.id;
        const liveStart = liveItem?.current_period_start ?? 0;
        const liveEnd = liveItem?.current_period_end ?? 0;

        if (live.status !== "active") {
          // Une ancienne facture payée ne doit pas réactiver un compte qui
          // possède une autre facture en souffrance.
          return NextResponse.json({ received: true });
        }

        if (alreadyAdjusted && liveStart > 0 && liveEnd > liveStart) {
          // Réception répétée du webhook : ne jamais décaler une seconde fois.
          // Si le cycle Stripe est déjà passé au renouvellement suivant, cette
          // facture historique ne doit plus changer les droits Kyrivo.
          if (Math.abs(liveStart - paidAt) >= 24 * 3600) {
            return NextResponse.json({ received: true });
          }
          effectiveStart = new Date(liveStart * 1000);
          effectiveEnd = new Date(liveEnd * 1000);
        } else {
          // Ancienne facture après un autre renouvellement : ignorer et ne
          // jamais remettre le statut "active" à tort.
          if (liveStart > renewalLine.period.start + 300) {
            return NextResponse.json({ received: true });
          }
          const isCurrentCycle =
            Math.abs(liveStart - renewalLine.period.start) < 300 &&
            Math.abs(liveEnd - renewalLine.period.end) < 300;
          const isRecentPayment =
            paidAt <= Math.floor(Date.now() / 1000) + 60 &&
            Date.now() / 1000 - paidAt < 24 * 3600;
          const safeToShift =
            live.status === "active" &&
            live.billing_mode.type === "flexible" &&
            !live.cancel_at_period_end &&
            isCurrentCycle &&
            isRecentPayment &&
            paidAt < renewalLine.period.end;

          if (safeToShift) {
            const updated = await stripe.subscriptions.update(
              stripeSubId,
              {
                billing_cycle_anchor: "now",
                proration_behavior: "none",
                metadata: { kyrivo_late_invoice_id: invoice.id },
              },
              { idempotencyKey: `kyrivo-late-payment-${invoice.id}` }
            );

            const nextItem = updated.items.data[0];
            if (!nextItem?.current_period_start || !nextItem?.current_period_end) {
              throw new Error("[invoice.paid] Nouvelles dates Stripe manquantes après réalignement");
            }
            effectiveStart = new Date(nextItem.current_period_start * 1000);
            effectiveEnd = new Date(nextItem.current_period_end * 1000);
            console.log("[invoice.paid] Échéance Stripe réalignée après paiement tardif", {
              invoiceId: invoice.id,
              subscriptionId: stripeSubId,
              effectiveStart: effectiveStart.toISOString(),
              effectiveEnd: effectiveEnd.toISOString(),
            });
          } else {
            // Pas de modification risquée du cycle classic, d'une résiliation,
            // d'une facture d'un ancien cycle ou d'un paiement ancien.
            console.warn("[invoice.paid] Paiement tardif : réalignement manuel nécessaire", {
              invoiceId: invoice.id,
              subscriptionId: stripeSubId,
              billingMode: live.billing_mode.type,
              stripeStatus: live.status,
              currentCycle: isCurrentCycle,
              recentPayment: isRecentPayment,
              cancelAtPeriodEnd: live.cancel_at_period_end,
            });
          }
        }
      }

      // Plan dérivé du price_id de cette ligne (donnée immuable de la facture) —
      // pas d'appel à la subscription live, pour préserver le déterminisme ci-dessus.
      const linePriceId =
        typeof renewalLine.pricing?.price_details?.price === "string"
          ? renewalLine.pricing.price_details.price
          : null;
      const plan = getPlanFromPriceId(linePriceId);
      // Si le prix n'est pas présent dans le payload, conserver le plan déjà
      // enregistré pour rétablir les droits sans rétrograder vers un trial.
      const effectivePlan = plan ?? row.plan;
      const monthlyLineLimit = getMonthlyLineLimit(effectivePlan);
      if (monthlyLineLimit <= 0) {
        throw new Error(`[invoice.paid] Plan payant introuvable : ${effectivePlan}`);
      }

      // Ne jamais revenir en arrière en cas de redélivrance d'une ancienne
      // facture après un réalignement / un renouvellement plus récent.
      const previousEnd = row.subscription_ends_at
        ? new Date(row.subscription_ends_at).getTime()
        : 0;
      if (previousEnd > effectiveEnd.getTime() && row.status === "active") {
        console.log("[invoice.paid] Facture ancienne ignorée (droits plus récents)", {
          invoiceId: invoice.id,
          companyId: row.company_id,
        });
        return NextResponse.json({ received: true });
      }

      const renewalUpdate: Record<string, unknown> = {
        subscription_ends_at: effectiveEnd.toISOString(),
        current_period_start: effectiveStart.toISOString(),
        current_period_end: quotaPeriodEnd(
          effectiveStart, effectiveEnd, row.billing_period
        ).toISOString(),
        status: "active",
        monthly_line_limit: monthlyLineLimit,
        stripe_customer_id: invoiceCustomerId,
        updated_at: new Date().toISOString(),
      };

      if (plan) renewalUpdate.plan = plan;

      console.log("[invoice.paid] Renouvellement appliqué:", {
        stripeSubId,
        stripeCustomerId: invoiceCustomerId,
        companyId: row.company_id,
        status: "active",
        currentPeriodEnd: effectiveEnd.toISOString(),
      });

      // L'échéance est issue du cycle Stripe réel après éventuel réalignement.
      // L'ID de facture est gardé dans la metadata Stripe pour l'idempotence.
      const { error: renewalError } = await supabaseAdmin
        .from("subscriptions")
        .update(renewalUpdate)
        .eq("company_id", row.company_id);

      if (renewalError) throw renewalError;

      return NextResponse.json({ received: true });
    }

    // ── invoice.payment_failed ─────────────────────────────────────────────
    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const invoiceRaw = invoice as any;
      const stripeSubId: string | null =
        typeof invoiceRaw.subscription === "string"
          ? invoiceRaw.subscription
          : typeof invoiceRaw.parent?.subscription_details?.subscription === "string"
          ? invoiceRaw.parent.subscription_details.subscription
          : null;

      if (!stripeSubId) return NextResponse.json({ received: true });

      // Les webhooks peuvent arriver dans le désordre. Ne jamais suspendre
      // un compte pour un échec d'une facture depuis payée.
      const [currentInvoice, currentSubscription] = await Promise.all([
        stripe.invoices.retrieve(invoice.id),
        stripe.subscriptions.retrieve(stripeSubId),
      ]);
      const latestInvoiceId = typeof currentSubscription.latest_invoice === "string"
        ? currentSubscription.latest_invoice
        : currentSubscription.latest_invoice?.id ?? null;
      if (
        currentInvoice.status === "paid" ||
        (latestInvoiceId && latestInvoiceId !== invoice.id) ||
        ["canceled", "incomplete_expired"].includes(currentSubscription.status)
      ) {
        return NextResponse.json({ received: true });
      }

      await supabaseAdmin
        .from("subscriptions")
        .update({
          status: "past_due",
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", stripeSubId)
        .neq("status", "canceled");

      return NextResponse.json({ received: true });
    }

    // ── customer.subscription.updated ───────────────────────────────────────
    // Déclenché notamment par : reprise après échec de paiement, bascule
    // cancel_at_period_end via le portail client, changement de plan.
    // API dahlia : les dates de période ne sont plus sur la subscription mais
    // sur subscription.items.data[0] (un abonnement peut avoir plusieurs items).
    if (event.type === "customer.subscription.updated") {
      const eventSubscription = event.data.object as Stripe.Subscription;
      // Lire l'état Stripe ACTUEL : une notification ancienne, reçue après
      // invoice.paid, ne doit pas remettre un compte en impayé ni raccourcir
      // une période déjà réalignée.
      const subscription = await stripe.subscriptions.retrieve(eventSubscription.id);

      const stripeCustomerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

      const row = await findSubscriptionRow(subscription.id, stripeCustomerId);

      if (!row) {
        console.error(
          "[customer.subscription.updated] Abonnement introuvable dans Supabase, update ignoré:",
          {
            stripeSubscriptionId: subscription.id,
            stripeCustomerId,
            status: subscription.status,
          }
        );
        return NextResponse.json({ received: true });
      }

      const item = subscription.items.data[0];
      const priceId = item
        ? typeof item.price === "string"
          ? item.price
          : item.price.id
        : null;
      const plan = getPlanFromPriceId(priceId);
      const mappedStatus = mapStripeStatusToSupabase(subscription.status);

      const periodStart = item?.current_period_start
        ? new Date(item.current_period_start * 1000)
        : null;
      const periodEnd = item?.current_period_end
        ? new Date(item.current_period_end * 1000)
        : null;

      const update: Record<string, unknown> = {
        status: mappedStatus,
        cancel_at_period_end: subscription.cancel_at_period_end,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: subscription.id,
        updated_at: new Date().toISOString(),
      };

      // Une réactivation Stripe doit aussi restaurer le quota remis à zéro
      // par refresh_subscription_cycles() lors de l'expiration.
      if (mappedStatus === "active") {
        const effectivePlan = plan ?? row.plan;
        const monthlyLineLimit = getMonthlyLineLimit(effectivePlan);
        if (monthlyLineLimit <= 0) {
          throw new Error(
            `[customer.subscription.updated] Plan payant introuvable : ${effectivePlan}`
          );
        }
        update.monthly_line_limit = monthlyLineLimit;
      }

      // Ne jamais raccourcir des droits acquis ni rembobiner les quotas à la
      // réception d'un événement redélivré. Sur une offre 3 mois, le quota
      // reste mensuel, distinct de la date de prélèvement Stripe.
      // Une simple modification (annulation programmée, mode de paiement,
      // mise à jour de metadata) ne remet pas le compteur à zéro.
      const previousEntitlementEnd = row.subscription_ends_at
        ? new Date(row.subscription_ends_at).getTime()
        : 0;
      if (
        !subscription.cancel_at_period_end &&
        mappedStatus === "active" &&
        periodStart &&
        periodEnd &&
        periodEnd.getTime() > previousEntitlementEnd
      ) {
        update.current_period_start = periodStart.toISOString();
        update.current_period_end = quotaPeriodEnd(
          periodStart, periodEnd, row.billing_period
        ).toISOString();
        update.subscription_ends_at = periodEnd.toISOString();
      }

      if (plan) update.plan = plan;

      console.log("[customer.subscription.updated]", {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId,
        companyId: row.company_id,
        stripeStatus: subscription.status,
        mappedStatus,
        currentPeriodEnd: periodEnd?.toISOString() ?? null,
      });

      const { error: updateError } = await supabaseAdmin
        .from("subscriptions")
        .update(update)
        .eq("company_id", row.company_id);

      if (updateError) throw updateError;

      return NextResponse.json({ received: true });
    }

    // ── checkout.session.completed ─────────────────────────────────────────
    if (event.type !== "checkout.session.completed") {
      return NextResponse.json({ received: true });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    const companyId = session.metadata?.companyId;
    const plan = session.metadata?.plan;
    const billingPeriod = session.metadata?.billingPeriod;

    const stripeCustomerId =
      typeof session.customer === "string" ? session.customer : null;

    const stripeSubscriptionId =
      typeof session.subscription === "string" ? session.subscription : null;

    if (!companyId || !plan || !billingPeriod || !stripeSubscriptionId) {
      console.error("Metadata Stripe incomplètes:", session.metadata);
      return NextResponse.json({ received: true });
    }

    // La période payée est celle de Stripe (et non le reliquat de l'essai).
    // Checkout crée un abonnement Stripe payant dès la validation du paiement.
    const paidStripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    if (paidStripeSubscription.status !== "active") {
      console.warn("[checkout.session.completed] Abonnement Stripe pas encore actif :", paidStripeSubscription.status);
      return NextResponse.json({ received: true });
    }
    const paidItem = paidStripeSubscription.items.data[0];
    const paidStartSec = paidItem?.current_period_start;
    const paidEndSec = paidItem?.current_period_end;
    if (!paidStartSec || !paidEndSec || paidEndSec <= paidStartSec) {
      throw new Error("[checkout.session.completed] Dates de période payée Stripe manquantes.");
    }
    const paidStart = new Date(paidStartSec * 1000);
    const paidEnd = new Date(paidEndSec * 1000);

    const monthlyLimit = getMonthlyLineLimit(plan);
    const durationMonths = getDurationMonths(billingPeriod);
    const now = new Date();

    const { data: existingSubscription, error: existingError } =
      await supabaseAdmin
        .from("subscriptions")
        .select("*")
        .eq("company_id", companyId)
        .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    // Stripe peut redélivrer cet événement ; le même paiement ne peut
    // jamais ajouter un deuxième mois ou trimestre à la souscription.
    if (
      existingSubscription?.stripe_subscription_id === stripeSubscriptionId &&
      existingSubscription.plan !== "trial"
    ) {
      console.log("[checkout.session.completed] Déjà traité, aucun renouvellement ajouté :", stripeSubscriptionId);
      return NextResponse.json({ received: true });
    }

    const currentPlan = existingSubscription?.plan ?? null;
    const currentRank = getPlanRank(currentPlan);
    const newRank = getPlanRank(plan);

    const existingCurrentStart = existingSubscription?.current_period_start
      ? new Date(existingSubscription.current_period_start)
      : null;

    const existingCurrentEnd = existingSubscription?.current_period_end
      ? new Date(existingSubscription.current_period_end)
      : null;

    const existingSubscriptionEnd = existingSubscription?.subscription_ends_at
      ? new Date(existingSubscription.subscription_ends_at)
      : null;

    const existingTrialEnd = existingSubscription?.trial_ends_at
      ? new Date(existingSubscription.trial_ends_at)
      : null;

    // Une conversion trial → plan payant doit toujours être traitée comme un upgrade
    // (trial et pro ont le même rang dans getPlanRank, ce qui causerait sinon isExtension)
    const isTrialConversion = currentPlan === "trial";
    const isExtension = !isTrialConversion && currentRank === newRank;
    const isUpgrade = !isTrialConversion && newRank > currentRank;

    if (!isTrialConversion && newRank < currentRank) {
      console.warn("Tentative de rétrogradation ignorée:", {
        companyId,
        currentPlan,
        requestedPlan: plan,
      });

      return NextResponse.json({ received: true });
    }

    let currentPeriodStart = now;
    let currentPeriodEnd = addMonths(now, 1);
    let subscriptionEndsAt = addMonths(now, durationMonths);
    let finalMonthlyLimit = monthlyLimit;

    // Conversion essai → payant : l'essai s'arrête à l'achat. Le droit
    // démarre avec la période réellement payée, sans 7 jours supplémentaires.
    if (isTrialConversion && existingSubscription) {
      subscriptionEndsAt = paidEnd;
      currentPeriodStart = paidStart;
      currentPeriodEnd = quotaPeriodEnd(paidStart, paidEnd, billingPeriod);
      finalMonthlyLimit = monthlyLimit;
    }

    if (isExtension && existingSubscription) {
      const baseEnd = maxDate(
        existingSubscriptionEnd,
        existingCurrentEnd,
        existingTrialEnd,
        now
      );

      subscriptionEndsAt = addMonths(baseEnd, durationMonths);

      if (existingCurrentEnd && existingCurrentEnd > now) {
        currentPeriodStart = existingCurrentStart ?? now;
        currentPeriodEnd = existingCurrentEnd;
        finalMonthlyLimit =
          Number(existingSubscription.monthly_line_limit || 0) || monthlyLimit;
      } else {
        currentPeriodStart = now;
        currentPeriodEnd = addMonths(now, 1);
        finalMonthlyLimit = monthlyLimit;
      }
    }

    if (isUpgrade || !existingSubscription) {
      currentPeriodStart = paidStart;
      currentPeriodEnd = quotaPeriodEnd(paidStart, paidEnd, billingPeriod);
      subscriptionEndsAt = paidEnd;
      finalMonthlyLimit = monthlyLimit;
    }

    const { error: upsertError } = await supabaseAdmin
      .from("subscriptions")
      .upsert(
        {
          company_id: companyId,
          plan,
          status: "active",
          billing_period: billingPeriod,
          monthly_line_limit: finalMonthlyLimit,
          current_period_start: currentPeriodStart.toISOString(),
          current_period_end: currentPeriodEnd.toISOString(),
          subscription_ends_at: subscriptionEndsAt.toISOString(),
          trial_ends_at: null,
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubscriptionId,
          updated_at: now.toISOString(),
        },
        {
          onConflict: "company_id",
        }
      );

    if (upsertError) {
      throw upsertError;
    }

    // Annuler l'ancienne subscription Stripe pour éviter deux abonnements actifs
    const oldStripeSubscriptionId = existingSubscription?.stripe_subscription_id ?? null;

    if (oldStripeSubscriptionId && oldStripeSubscriptionId !== stripeSubscriptionId) {
      try {
        await stripe.subscriptions.cancel(oldStripeSubscriptionId);
        console.log("[Stripe] Ancienne subscription annulée:", oldStripeSubscriptionId);
      } catch (cancelError: any) {
        console.error("[Stripe] Échec annulation ancienne subscription:", {
          oldStripeSubscriptionId,
          newStripeSubscriptionId: stripeSubscriptionId,
          companyId,
          error: cancelError?.message,
        });
        // Ne pas propager : l'upsert DB est déjà validé. Retourner 500 ici
        // ferait re-tenter Stripe, causant un second upsert et une tentative
        // d'annulation sur une subscription déjà annulée → boucle infinie.
      }
    }

    // Comptabiliser un NOUVEL abonnement payant, jamais un renouvellement.
    // CAPI est optionnelle, consentie et isolée de la logique Stripe.
    if (isTrialConversion || !existingSubscription) {
      await sendOpenAISubscriptionConversion({
        companyId,
        stripeSubscriptionId,
        plan,
        billingPeriod,
        amountCents: session.amount_total ?? null,
        currency: session.currency || "eur",
        timestampMs: event.created * 1000,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erreur traitement webhook Stripe:", error);

    return NextResponse.json(
      { error: "Erreur traitement webhook Stripe" },
      { status: 500 }
    );
  }
}