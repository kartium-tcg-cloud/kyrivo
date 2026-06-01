// src/app/abonnements/page.tsx
// Page Abonnements / Pricing
// Modèle : essai gratuit 7 jours sur Pro uniquement
// Toggle 1 mois / 3 mois avec prix réduits
// Limites basées sur nombre de lignes/mois (achat + vente + article stock)

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

type BillingPeriod = "monthly" | "quarterly";

type CurrentPlan = "trial" | "pro" | "business" | "entreprise" | null;

function getPlanRank(plan: CurrentPlan): number {
  if (plan === "trial") return 1;
  if (plan === "pro") return 1;
  if (plan === "business") return 2;
  if (plan === "entreprise") return 3;
  return 0;
}

interface PlanFeature {
  label: string;
  emphasis?: boolean;
}

interface PlanPricing {
  /** Affichage du prix barré (3 mois uniquement) */
  oldPrice?: string;
  /** Prix affiché en grand */
  price: string;
  /** Suffixe — "/ mois" ou "/ 3 mois" */
  suffix: string;
}

interface Plan {
  id: "pro" | "business" | "entreprise";
  name: string;
  tagline: string;
  monthlyLines: string;
  pricing: Record<BillingPeriod, PlanPricing>;
  features: PlanFeature[];
  /** Pro uniquement */
  hasTrial?: boolean;
  highlighted?: boolean;
  premium?: boolean;
  badge?: string;
}

// ═══════════════════════════════════════════════════════════
// DONNÉES PLANS
// ═══════════════════════════════════════════════════════════

const PLANS: Plan[] = [
  {
    id: "pro",
    name: "Pro",
    tagline: "Pour revendeurs actifs",
    monthlyLines: "500",
    highlighted: true,
    badge: "Recommandé",
    hasTrial: true,
    pricing: {
      monthly: { price: "9,90 €", suffix: "/ mois" },
      quarterly: {
        oldPrice: "29,70 €",
        price: "26,40 €",
        suffix: "/ 3 mois",
      },
    },
    features: [
      { label: "500 lignes / mois", emphasis: true },
      { label: "Gestion achats, ventes et stock" },
      { label: "Exports Excel achats et ventes" },
      { label: "Génération factures PDF en ZIP" },
      { label: "Préférences société complètes" },
      { label: "Support standard" },
    ],
  },
  {
    id: "business",
    name: "Business",
    tagline: "Pour activités en croissance",
    monthlyLines: "5 000",
    pricing: {
      monthly: { price: "24,90 €", suffix: "/ mois" },
      quarterly: {
        oldPrice: "74,70 €",
        price: "64,90 €",
        suffix: "/ 3 mois",
      },
    },
    features: [
      { label: "5 000 lignes / mois", emphasis: true },
      { label: "Tout ce que contient Pro" },
      { label: "Support prioritaire" },
      { label: "Suggestions d'amélioration prises en compte" },
      { label: "Accès anticipé aux nouvelles fonctionnalités" },
    ],
  },
  {
    id: "entreprise",
    name: "Entreprise",
    tagline: "Pour gros volumes",
    monthlyLines: "50 000",
    premium: true,
    badge: "Entreprise",
    pricing: {
      monthly: { price: "79,90 €", suffix: "/ mois" },
      quarterly: {
        oldPrice: "239,70 €",
        price: "214,90 €",
        suffix: "/ 3 mois",
      },
    },
    features: [
      { label: "50 000 lignes / mois", emphasis: true },
      { label: "Tout ce que contient Business" },
      { label: "Support premium prioritaire" },
      { label: "Accès en avant-première aux nouveautés" },
      { label: "Vos suggestions traitées en priorité" },
    ],
  },
];

// ═══════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════

export default function AbonnementsPage() {

const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
const [currentPlan, setCurrentPlan] = useState<CurrentPlan>(null);
const [loadingPortal, setLoadingPortal] = useState(false);
const [hasStripeCustomer, setHasStripeCustomer] = useState(false);
const [isPastDue, setIsPastDue] = useState(false);

  // ─── Meta Pixel — ViewContent ────────────────────────────
  useEffect(() => {
    if (typeof window !== "undefined" && (window as Window & { fbq?: (...args: unknown[]) => void }).fbq) {
      (window as Window & { fbq?: (...args: unknown[]) => void }).fbq!("track", "ViewContent", {
        content_name: "Page Abonnements",
        content_category: "pricing",
      });
    }
  }, []);

  // ─── Détection auth (sans logique compliquée) ────────────
useEffect(() => {
  const supabase = createClient();

async function checkAuth() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setIsAuthenticated(!!user);

    if (!user) {
      setCurrentPlan(null);
      setHasStripeCustomer(false);
      return;
    }

    const { data: membership } = await supabase
      .from("memberships")
      .select("company_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership?.company_id) {
      setCurrentPlan(null);
      setHasStripeCustomer(false);
      return;
    }

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan, status, current_period_end, subscription_ends_at, trial_ends_at, stripe_customer_id")
      .eq("company_id", membership.company_id)
      .maybeSingle();

    const now = new Date();

    const isTrialActive =
      subscription?.status === "trialing" &&
      subscription.trial_ends_at &&
      new Date(subscription.trial_ends_at) > now;

    const isPaidActive =
      subscription?.status === "active" &&
      subscription.subscription_ends_at &&
      new Date(subscription.subscription_ends_at) > now;

    const pastDue = subscription?.status === "past_due";
    setIsPastDue(pastDue);

    if (isTrialActive || isPaidActive || pastDue) {
      setCurrentPlan(subscription.plan as CurrentPlan);
      setHasStripeCustomer(!!subscription.stripe_customer_id);
    } else {
      setCurrentPlan(null);
      setHasStripeCustomer(false);
    }
  } catch (error) {
    console.error(error);
    setIsAuthenticated(false);
    setCurrentPlan(null);
    setHasStripeCustomer(false);
  }
}

  checkAuth();

  const handlePageShow = (event: PageTransitionEvent) => {
    if (event.persisted) {
      window.location.reload();
      return;
    }

    checkAuth();
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      checkAuth();
      setLoadingPlanId(null);
    }
  };

  window.addEventListener("pageshow", handlePageShow);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setIsAuthenticated(!!session?.user);
  });

  return () => {
    subscription.unsubscribe();
    window.removeEventListener("pageshow", handlePageShow);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}, []);

const handleCheckout = async (planId: Plan["id"]) => {
  try {
    setLoadingPlanId(planId);

    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan: planId,
        billingPeriod,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || "Erreur checkout");
    }

    window.location.href = data.url;

  } catch (error) {
    console.error(error);
    toast.error("Impossible de démarrer le paiement.");
  } finally {
    setLoadingPlanId(null);
  }
};

const handlePortal = async () => {
  try {
    setLoadingPortal(true);
    const response = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || "Erreur portail");
    }
    window.location.assign(data.url);
  } catch (error) {
    console.error(error);
    toast.error("Impossible d'ouvrir le portail de gestion.");
  } finally {
    setLoadingPortal(false);
  }
};

  return (
    <div className="relative overflow-hidden">

      {/* ═══ BANNIÈRE PAST_DUE ══════════════════════════════ */}
      {isPastDue && (
        <div className="flex items-start gap-3 border-b border-red-500/20 bg-red-500/8 px-6 py-3.5 lg:px-10">
          <svg className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-300">Paiement échoué</p>
            <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
              Votre paiement a échoué. Mettez à jour votre moyen de paiement pour éviter l'interruption de votre accès.
            </p>
          </div>
          {hasStripeCustomer && (
            <button
              type="button"
              disabled={loadingPortal}
              onClick={handlePortal}
              className="flex-shrink-0 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              {loadingPortal ? "Ouverture…" : "Mettre à jour"}
            </button>
          )}
        </div>
      )}

      {/* ═══ GLOW BACKGROUND ═══════════════════════════════ */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full opacity-[0.12] blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(245,158,11,1) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative px-6 lg:px-10 py-10 lg:py-14 mx-auto max-w-6xl">

        {/* ═══ HEADER ═══════════════════════════════════════ */}
        <header className="flex flex-col items-center text-center pb-8">

          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-amber-400 tracking-widest uppercase">
              Tarifs Kyrivo
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
            Abonnements
          </h1>

          <p className="mt-3 text-base text-neutral-400 max-w-xl">
            Choisissez la formule adaptée à votre activité. Changez à tout moment depuis votre espace compte.
          </p>

        </header>

        {/* ═══ BLOC ESSAI GRATUIT 7 JOURS (Pro uniquement) ═══ */}
        <section className="mb-10">

          <div
            className="
              relative rounded-2xl overflow-hidden
              border border-amber-500/30
              px-6 py-6 lg:px-8 lg:py-7
            "
            style={{
              background:
                "linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(23,23,23,0.5) 60%, rgba(245,158,11,0.05) 100%)",
            }}
          >

            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

            <div
              className="absolute -top-20 -right-20 h-48 w-48 rounded-full opacity-30 blur-3xl pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(245,158,11,0.6) 0%, transparent 70%)",
              }}
            />

            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">

              <div className="flex-shrink-0">
                <div
                  className="
                    inline-flex items-center justify-center
                    h-14 w-14 rounded-xl
                    border border-amber-400/40
                  "
                  style={{
                    background:
                      "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)",
                    boxShadow:
                      "0 4px 20px -4px rgba(245,158,11,0.5), inset 0 1px 0 rgba(255,255,255,0.25)",
                  }}
                >
                  <GiftIcon className="h-7 w-7 text-neutral-950" />
                </div>
              </div>

              <div className="flex-1 min-w-0">

                <div className="inline-flex items-center gap-2 rounded-full bg-neutral-950/40 border border-amber-500/30 px-2.5 py-1 mb-2 backdrop-blur-sm">
                  <SparkleIcon className="h-3 w-3 text-amber-400" />
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                    Testez gratuitement, sans engagement
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Essai gratuit de 7 jours sur Pro
                </h2>

                <p className="mt-2 text-sm text-neutral-300 leading-relaxed">
                  Tous les nouveaux comptes bénéficient de{" "}
                  <strong className="text-amber-400 font-semibold">
                    7 jours d'accès complet à Kyrivo Pro
                  </strong>
                  , sans carte bancaire requise. Découvrez la plateforme avant de choisir votre formule.
                </p>

                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-neutral-400">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckMiniIcon /> Accès complet Pro
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CheckMiniIcon /> Aucune CB requise
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CheckMiniIcon /> Sans engagement
                  </span>
                </div>

              </div>

            </div>
          </div>

        </section>

        {/* ═══ TOGGLE 1 MOIS / 3 MOIS ═════════════════════ */}
        <section className="flex flex-col items-center mb-8">

          <div
            className="
              inline-flex items-center gap-1
              p-1 rounded-xl
              bg-neutral-900/60 border border-neutral-800
              backdrop-blur-sm
            "
          >

            <button
              type="button"
              onClick={() => setBillingPeriod("monthly")}
              className={`
                relative rounded-lg px-5 py-2
                text-sm font-semibold
                transition-all duration-200
                ${
                  billingPeriod === "monthly"
                    ? "bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20"
                    : "text-neutral-400 hover:text-neutral-200"
                }
              `}
            >
              1 mois
            </button>

            <button
              type="button"
              onClick={() => setBillingPeriod("quarterly")}
              className={`
                relative rounded-lg px-5 py-2
                text-sm font-semibold
                transition-all duration-200
                inline-flex items-center gap-2
                ${
                  billingPeriod === "quarterly"
                    ? "bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20"
                    : "text-neutral-400 hover:text-neutral-200"
                }
              `}
            >
              3 mois
              <span
                className={`
                  inline-flex items-center
                  rounded-full px-2 py-0.5
                  text-[9px] font-bold uppercase tracking-widest
                  ${
                    billingPeriod === "quarterly"
                      ? "bg-neutral-950/20 text-neutral-950"
                      : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  }
                `}
              >
                Économisez
              </span>
            </button>

          </div>

          <p className="mt-3 text-xs text-neutral-500">
            {billingPeriod === "quarterly"
              ? "Abonnement prépayé 3 mois — les lignes restent réinitialisées chaque mois."
              : "Paiement mensuel — résiliable à tout moment."}
          </p>

        </section>

        {/* ═══ PRICING GRID ═══════════════════════════════ */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          {PLANS.map((plan) => (
            <PlanCard
                key={plan.id}
                plan={plan}
                billingPeriod={billingPeriod}
                isAuthenticated={isAuthenticated}
                loadingPlanId={loadingPlanId}
                currentPlan={currentPlan}
onCheckout={handleCheckout}
                />
          ))}
        </section>

        {/* ═══ PORTAIL CLIENT STRIPE ══════════════════════ */}
        {isAuthenticated && hasStripeCustomer && (
          <section className="mb-8 flex justify-center">
            <button
              type="button"
              disabled={loadingPortal}
              onClick={handlePortal}
              className={`
                inline-flex items-center gap-2
                rounded-lg border px-5 py-2.5
                text-sm font-semibold
                transition-all duration-200
                ${loadingPortal
                  ? "border-neutral-800 bg-neutral-900/40 text-neutral-500 cursor-not-allowed"
                  : "border-neutral-700 bg-neutral-900/60 text-neutral-200 hover:bg-neutral-800 hover:border-neutral-600"
                }
              `}
            >
              {loadingPortal
                ? <SpinnerIcon className="h-4 w-4 animate-spin" />
                : <ExternalLinkIcon className="h-4 w-4 text-neutral-400" />
              }
              {loadingPortal ? "Ouverture…" : "Gérer mon abonnement"}
            </button>
          </section>
        )}

        {/* ═══ NOTE EXPLICATIVE LIGNES ═════════════════════ */}
        <section className="mb-16">
          <div className="rounded-lg bg-neutral-900/40 border border-neutral-800/60 px-4 py-3 flex items-start gap-3">
            <InfoIcon className="h-4 w-4 text-neutral-500 flex-shrink-0 mt-0.5" />
            <p className="text-[12px] text-neutral-500 leading-relaxed">
              <span className="text-neutral-400 font-medium">Une ligne</span> = un achat
ou une vente créée. Le compteur est{" "}
              <span className="text-neutral-400 font-medium">remis à zéro chaque mois</span>
              , y compris pour les abonnements 3 mois. Vous pouvez changer de formule à tout moment depuis votre espace compte.
            </p>
          </div>
        </section>

        {/* ═══ VALUE PROPS ════════════════════════════════ */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16">

          <ValueProp
            icon={<LockIcon />}
            title="Paiement sécurisé"
            description="Vos données bancaires ne transitent jamais par Kyrivo. Aucune donnée stockée chez nous."
          />

          <ValueProp
            icon={<HeartIcon />}
            title="Sans engagement"
            description="Résiliable à tout moment depuis votre espace compte. Aucune pénalité, aucune question."
          />

          <ValueProp
            icon={<RocketIcon />}
            title="Vous influencez le produit"
            description="À partir du plan Business, vous pouvez proposer des améliorations et influencer l'évolution de Kyrivo."
          />

        </section>

        {/* ═══ CONTACT ════════════════════════════════════ */}
        <section className="text-center pb-8">
          <p className="text-sm text-neutral-500 mb-3">
            Besoin d'un volume supérieur ou d'une formule sur mesure ?
          </p>
<div className="inline-flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/60 px-5 py-2.5 text-sm font-semibold text-neutral-200">
  <MailIcon className="h-4 w-4 text-amber-400" />
  contact@kartium-tcg.com
</div>
        </section>

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CARTE PLAN
// ═══════════════════════════════════════════════════════════

function PlanCard({
  plan,
  billingPeriod,
  isAuthenticated,
  loadingPlanId,
currentPlan,
onCheckout,
}: {
  plan: Plan;
  billingPeriod: BillingPeriod;
  isAuthenticated: boolean | null;
  loadingPlanId: string | null;
  currentPlan: CurrentPlan;
  onCheckout: (planId: Plan["id"]) => void;
}) {

  const isHighlighted = plan.highlighted;
  const isPremium = plan.premium;
  const pricing = plan.pricing[billingPeriod];
  const currentRank = getPlanRank(currentPlan);
  const planRank = getPlanRank(plan.id);
  const isDowngradeBlocked =
    currentPlan !== null &&
    currentPlan !== "trial" &&
    planRank < currentRank;

  const isSameActivePlan =
    currentPlan !== null &&
    currentPlan !== "trial" &&
    currentPlan === plan.id;

  const isUpgrade =
    currentPlan !== null &&
    currentPlan !== "trial" &&
    planRank > currentRank;

  // Styles selon le tier
  const cardClasses = isHighlighted
    ? "border border-amber-500/40 shadow-2xl shadow-amber-500/10"
    : isPremium
    ? "border border-neutral-700"
    : "border border-neutral-800 bg-neutral-900/40 hover:border-neutral-700";

  const cardStyle = isHighlighted
    ? {
        background:
          "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(23,23,23,0.6) 60%, rgba(23,23,23,0.6) 100%)",
      }
    : isPremium
    ? {
        background:
          "linear-gradient(135deg, rgba(40,40,40,0.6) 0%, rgba(23,23,23,0.7) 50%, rgba(15,15,15,0.8) 100%)",
        boxShadow:
          "0 8px 32px -12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
      }
    : undefined;

  // CTA — texte et destination selon l'état auth
  const ctaConfig = (() => {
    if (isAuthenticated === null) {
      // Loading initial — placeholder
      return {
        label: "Chargement…",
        href: null,
        disabled: true,
      };
    }
if (isAuthenticated) {
  if (isDowngradeBlocked) {
    return {
      label: "Vous avez déjà un meilleur abonnement",
      href: null,
      disabled: true,
    };
  }

  return {
    label:
      loadingPlanId === plan.id
        ? "Préparation…"
        : isSameActivePlan
          ? "Prolonger mon abonnement"
          : isUpgrade
            ? "Upgrade mon compte"
            : "Choisir ce plan",
    href: null,
    disabled: loadingPlanId !== null,
  };
}
    return {
      label: "Se connecter pour choisir",
      href: "/login",
      disabled: false,
    };
  })();

  return (
    <div
      className={`
        relative rounded-2xl overflow-hidden
        transition-all duration-300
        flex flex-col
        ${cardClasses}
      `}
      style={cardStyle}
    >

      {/* Badge top */}
      {plan.badge && (
        <div className="absolute top-0 left-0 right-0 flex justify-center z-10">
          <div
            className={`
              inline-flex items-center gap-1.5
              rounded-b-lg px-3 py-1
              text-[10px] font-bold uppercase tracking-widest
              ${
                isPremium
                  ? "bg-neutral-100 text-neutral-900 shadow-lg shadow-black/40"
                  : "bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20"
              }
            `}
          >
            {isPremium ? (
              <DiamondIcon className="h-3 w-3" />
            ) : (
              <SparkleIcon className="h-3 w-3" />
            )}
            {plan.badge}
          </div>
        </div>
      )}

      {/* Glow décoratif highlighted */}
      {isHighlighted && (
        <div
          className="absolute -top-24 -right-24 h-48 w-48 rounded-full opacity-30 blur-3xl pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(245,158,11,0.6) 0%, transparent 70%)",
          }}
        />
      )}

      {/* Glow premium subtil pour Entreprise */}
      {isPremium && (
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 h-56 w-56 rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)",
          }}
        />
      )}

      {/* Ligne argentée subtile en haut pour Entreprise */}
      {isPremium && (
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
          }}
        />
      )}

      <div className={`relative p-6 lg:p-7 flex flex-col flex-1 ${plan.badge ? "pt-10" : ""}`}>

        {/* Header carte */}
        <div className="mb-6">
          <h3
            className={`
              text-2xl font-bold tracking-tight
              ${isHighlighted ? "text-amber-400" : "text-white"}
            `}
          >
            {plan.name}
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            {plan.tagline}
          </p>
        </div>

        {/* Bloc lignes/mois */}
        <div
          className={`
            mb-5 rounded-lg px-3 py-2.5
            border
            ${
              isHighlighted
                ? "bg-amber-500/10 border-amber-500/25"
                : isPremium
                ? "bg-neutral-800/40 border-neutral-700/60"
                : "bg-neutral-800/40 border-neutral-800"
            }
          `}
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
              Volume mensuel
            </span>
            <div className="flex items-baseline gap-1">
              <span
                className={`
                  text-lg font-bold tabular-nums
                  ${isHighlighted ? "text-amber-400" : "text-white"}
                `}
              >
                {plan.monthlyLines}
              </span>
              <span className="text-[11px] text-neutral-500">
                lignes / mois
              </span>
            </div>
          </div>
        </div>

        {/* Prix */}
        <div className="mb-6 pb-6 border-b border-neutral-800">

          {/* Prix barré si quarterly */}
          {pricing.oldPrice && (
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-base text-neutral-600 line-through tabular-nums">
                {pricing.oldPrice}
              </span>
              <span
                className="
                  inline-flex items-center
                  rounded-full px-2 py-0.5
                  text-[9px] font-bold uppercase tracking-widest
                  bg-emerald-500/10 border border-emerald-500/25 text-emerald-400
                "
              >
                Économie
              </span>
            </div>
          )}

          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold tracking-tight tabular-nums text-white">
              {pricing.price}
            </span>
            <span className="text-sm text-neutral-500 font-medium">
              {pricing.suffix}
            </span>
          </div>

          <p className="mt-2 text-[11px] text-neutral-600">
            {billingPeriod === "monthly"
              ? "Facturé mensuellement — TTC"
              : "Prépayé 3 mois — TTC"}
            {plan.hasTrial && (
              <>
                {" · "}
                <span className="text-amber-400/80 font-medium">
                  7 jours d'essai gratuit
                </span>
              </>
            )}
          </p>

        </div>

        {/* Features */}
        <ul className="space-y-3 mb-8 flex-1">
          {plan.features.map((feature, i) => (
            <li
              key={i}
              className={`
                flex items-start gap-2.5 text-sm
                ${feature.emphasis ? "text-white font-medium" : "text-neutral-300"}
              `}
            >
              <span className="flex-shrink-0 mt-0.5">
                <CheckIcon
                  className={
                    isHighlighted
                      ? "text-amber-400"
                      : isPremium
                      ? "text-neutral-300"
                      : "text-emerald-400"
                  }
                />
              </span>
              <span>{feature.label}</span>
            </li>
          ))}
        </ul>

        {/* CTA — adapté à l'état auth */}
        {ctaConfig.href ? (
          <Link
            href={ctaConfig.href}
            className={`
              w-full inline-flex items-center justify-center gap-2
              rounded-lg px-5 py-3
              text-sm font-semibold
              transition-all duration-200
              ${
                isHighlighted
                  ? "bg-amber-500 text-neutral-950 hover:bg-amber-400 active:scale-[0.98] shadow-lg shadow-amber-500/20"
                  : isPremium
                  ? "bg-neutral-100 text-neutral-900 hover:bg-white active:scale-[0.98] shadow-lg shadow-black/40"
                  : "bg-neutral-800 text-white border border-neutral-700 hover:bg-neutral-700 hover:border-neutral-600 active:scale-[0.98]"
              }
            `}
          >
            <LoginIcon className="h-3.5 w-3.5" />
            {ctaConfig.label}
          </Link>
        ) : (
          <button
            type="button"
            disabled={ctaConfig.disabled}
            onClick={() => onCheckout(plan.id)}
className={`
  w-full inline-flex items-center justify-center gap-2
  rounded-lg px-5 py-3
  text-sm font-semibold
  transition-all duration-200
  ${
    ctaConfig.disabled
      ? isHighlighted
        ? "bg-amber-500/30 text-neutral-950/60 cursor-not-allowed"
        : isPremium
        ? "bg-neutral-100/30 text-neutral-900/60 cursor-not-allowed"
        : "bg-neutral-900/60 text-neutral-500 border border-neutral-800 cursor-not-allowed"
      : isHighlighted
      ? "bg-amber-500 text-neutral-950 hover:bg-amber-400 active:scale-[0.98] shadow-lg shadow-amber-500/20"
      : isPremium
      ? "bg-neutral-100 text-neutral-900 hover:bg-white active:scale-[0.98] shadow-lg shadow-black/40"
      : "bg-neutral-800 text-white border border-neutral-700 hover:bg-neutral-700 hover:border-neutral-600 active:scale-[0.98]"
  }
`}
          >
            {isAuthenticated === null ? (
              <SpinnerIcon className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckIcon className="h-3.5 w-3.5" />
            )}
            {ctaConfig.label}
          </button>
        )}

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// VALUE PROP CARD
// ═══════════════════════════════════════════════════════════

function ValueProp({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 hover:border-neutral-700 transition-colors duration-200">

      <span className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-4">
        {icon}
      </span>

      <h3 className="text-sm font-semibold text-white">
        {title}
      </h3>

      <p className="mt-1.5 text-xs text-neutral-500 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ICÔNES
// ═══════════════════════════════════════════════════════════

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`h-4 w-4 ${className}`} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function CheckMiniIcon() {
  return (
    <svg className="h-3 w-3 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
    </svg>
  );
}

function DiamondIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h12l4 6-10 13L2 9Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 3 8 9l4 13 4-13-3-6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 9h20" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
    </svg>
  );
}

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  );
}

function RocketIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  );
}

function LoginIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  );
}