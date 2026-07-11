import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LandingAnalytics from "@/components/LandingAnalytics";
import RegisterCTA from "@/components/RegisterCTA";
import Reveal from "@/components/ui/Reveal";
import SectionHeader from "@/components/ui/SectionHeader";
import SocialProofBadges from "@/components/SocialProofBadges";

// Police d'accent réservée au hero — chargée uniquement sur cette page
// (pas dans le layout racine) pour ne pas alourdir le reste du site.
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  alternates: {
    canonical: "https://kyrivo.fr/",
  },
};

const FAQ_ITEMS = [
  {
    question: "Kyrivo remplace-t-il Excel ?",
    answer:
      "Kyrivo aide à remplacer les fichiers Excel compliqués en centralisant achats, ventes, stock, marges, TVA et exports dans un seul outil.",
  },
  {
    question: "Kyrivo est-il adapté à Vinted ?",
    answer:
      "Oui. Kyrivo permet de suivre les achats et ventes réalisés sur Vinted, en plus d'autres canaux comme la brocante, les cartes TCG ou une boutique en ligne.",
  },
  {
    question: "Peut-on gérer la TVA sur marge ?",
    answer:
      "Oui. Kyrivo suit la TVA standard et la TVA sur marge selon la manière dont l'article a été acheté. L'outil aide au suivi, sans remplacer un accompagnement comptable professionnel.",
  },
  {
    question: "Peut-on exporter pour son comptable ?",
    answer:
      "Oui. Les achats et ventes s'exportent vers Excel pour faciliter le suivi ou la transmission des informations utiles au comptable.",
  },
  {
    question: "L'essai gratuit demande-t-il une carte bancaire ?",
    answer:
      "Non. L'essai gratuit de 7 jours ne demande aucune carte bancaire. Vous pouvez tester Kyrivo sans engagement.",
  },
  {
    question: "Kyrivo convient-il aux cartes Pokémon / TCG ?",
    answer:
      "Kyrivo a été pensé au départ pour les revendeurs de cartes et de TCG, puis élargi à Vinted, la brocante, la collection et la seconde main.",
  },
];

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Kyrivo",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: "https://kyrivo.fr",
      description:
        "Outil de gestion des achats, ventes, stock, marges, TVA et factures pour revendeurs de biens physiques en France et en Belgique.",
      inLanguage: "fr",
      featureList: [
        "Gestion des achats",
        "Gestion des ventes",
        "Suivi du stock en temps réel",
        "Calcul des marges",
        "TVA sur marge",
        "Facturation PDF",
        "Export Excel et CSV",
      ],
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "EUR",
        description: "Essai gratuit 7 jours sans carte bancaire",
      },
      creator: {
        "@type": "Organization",
        name: "Kartium TCG",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ];

  return (
    <div className={`relative overflow-hidden ${spaceGrotesk.variable}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <noscript>
        <style>{`.reveal { opacity: 1 !important; transform: none !important; }`}</style>
      </noscript>
      <LandingAnalytics />

      {/* Ambiance de fond globale — deux halos maîtrisés, pas une nébuleuse */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[650px] w-[1100px] rounded-full opacity-[0.11] blur-3xl bg-glow-brand" />
        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full opacity-[0.05] blur-3xl bg-glow-brand" />
      </div>

      <div className="relative px-5 sm:px-6 lg:px-10 py-8 lg:py-12 mx-auto max-w-6xl">
        <HeroSection user={!!user} />
        <PainSection />
        <FeatureSystemSection />
        <WorkflowSection />
        <AudienceSection />
        <SocialProofSection />
        <PricingCTA user={!!user} />
        <FAQSection />
        <CredibilityFooter />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// HERO
// ═══════════════════════════════════════════════════════════

function HeroSection({ user }: { user: boolean }) {
  return (
    <section className="relative pt-2 sm:pt-6 pb-16 sm:pb-24">
      <GridFade className="h-[560px]" />

      <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16 lg:justify-between">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left lg:max-w-[500px]">
          <Reveal delay={0} className="w-full">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[54px] font-bold text-white tracking-tight leading-[1.12] mb-4">
              Tu fais de l&apos;achat-revente&nbsp;?{" "}
              <span
                className="block bg-clip-text text-transparent pb-2"
                style={{ backgroundImage: "linear-gradient(135deg, #fcd34d 0%, #f59e0b 45%, #d97706 100%)" }}
              >
                Tu sais vraiment ce que tu gagnes&nbsp;?
              </span>
            </h1>

            <p className="text-base sm:text-lg text-neutral-400 leading-relaxed mb-7 max-w-[440px] mx-auto lg:mx-0">
              Kyrivo centralise tes achats, ventes, stock, marges, TVA et factures
              dans un outil pensé pour les revendeurs Vinted, brocante, TCG et seconde main.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mb-5">
              {user ? (
                <Link
                  href="/dashboard"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 bg-amber-500 text-neutral-950 text-sm font-bold hover:bg-amber-400 hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200 shadow-xl shadow-amber-500/20"
                >
                  Accéder à mon espace
                  <ArrowIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              ) : (
                <RegisterCTA label="Essai gratuit 7 jours" />
              )}
              <Link
                href="/abonnements"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-4 bg-neutral-900/60 text-neutral-200 text-sm font-semibold border border-neutral-700/60 hover:border-neutral-600 hover:bg-neutral-900 transition-all duration-200"
              >
                Voir les tarifs
              </Link>
            </div>

            <p className="text-[12px] text-neutral-400 font-medium tracking-wide">
              Sans carte bancaire · Données exportables · Développé par Kartium TCG
            </p>

            <p className="mt-4 text-[11px] text-amber-500/70 font-semibold uppercase tracking-widest">
              TVA sur marge · Factures PDF · Export Excel
            </p>
          </Reveal>
        </div>

        <Reveal
          delay={150}
          direction="right"
          className="relative mt-12 lg:mt-0 w-full max-w-sm sm:max-w-md mx-auto lg:mx-0 lg:max-w-[440px] flex-shrink-0"
        >
          <ProductProofPanel />
        </Reveal>
      </div>
    </section>
  );
}

// Panneau produit : rentabilité réelle d'une vente en TVA sur marge —
// mêmes formules que le calcul marge de l'app (pas un dashboard générique).
function ProductProofPanel() {
  return (
    <div className="relative pb-6 pr-4 sm:pb-8 sm:pr-6">
      <div
        className="absolute -inset-6 rounded-[2rem] opacity-40 blur-2xl pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(245,158,11,0.22) 0%, transparent 70%)" }}
      />

      <div
        className="relative rounded-2xl overflow-hidden border shadow-2xl shadow-black/60"
        style={{
          background: "linear-gradient(160deg, #101012 0%, #0a0a0b 100%)",
          borderColor: "rgba(245,158,11,0.2)",
          boxShadow: "0 0 0 1px rgba(245,158,11,0.08), 0 30px 70px rgba(0,0,0,0.7)",
        }}
      >
        <div className="h-0.5 w-full bg-gradient-to-r from-amber-500 via-amber-400/70 to-transparent" />

        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800/60">
          <div className="flex items-center gap-2.5">
            <div
              className="h-6 w-6 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)" }}
            >
              <span className="text-[10px] font-black text-neutral-950">K</span>
            </div>
            <span className="text-sm font-bold text-white">Rentabilité d&apos;une vente</span>
          </div>
          <span className="rounded-full border border-neutral-700 bg-neutral-900/80 px-2 py-0.5 text-[10px] font-semibold text-neutral-400">
            TVA sur marge
          </span>
        </div>

        <div className="px-5 py-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Achat</p>
            <p className="text-lg font-bold text-neutral-200 tabular-nums">21,00 €</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1">Vente</p>
            <p className="text-lg font-bold text-neutral-200 tabular-nums">29,90 €</p>
          </div>
        </div>

        <div className="mx-5 h-px bg-neutral-800/60" />

        <div className="px-5 py-4 flex items-center justify-between">
          <span className="text-sm text-neutral-400">TVA sur marge</span>
          <span className="text-sm font-semibold text-cyan-400 tabular-nums">1,54 €</span>
        </div>

        <div className="mx-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-emerald-300">Marge nette</span>
          <span className="text-xl font-bold text-emerald-400 tabular-nums">7,36 €</span>
        </div>

        <div className="px-5 py-4 flex items-center justify-between">
          <span className="text-[11px] text-neutral-500">Stock restant</span>
          <span className="text-[11px] text-neutral-300 font-medium">3 articles</span>
        </div>

        <div className="border-t border-neutral-800/60 px-5 py-3 flex items-center justify-between text-[11px] text-neutral-500">
          <span>Facture PDF prête</span>
          <span>Export Excel inclus</span>
        </div>
      </div>

      {/* Carte flottante secondaire — profondeur visuelle */}
      <div
        className="hidden sm:flex absolute -bottom-2 -left-6 items-center gap-2.5 rounded-xl border border-neutral-800 bg-neutral-950/95 backdrop-blur-sm px-4 py-3 shadow-xl shadow-black/50"
        style={{ borderColor: "rgba(245,158,11,0.2)" }}
      >
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 text-xs">✓</span>
        <div className="leading-tight">
          <p className="text-[11px] font-semibold text-white">Marge calculée</p>
          <p className="text-[10px] text-neutral-500">Stock &amp; TVA mis à jour</p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PROBLÈME — panneau "Avant Kyrivo", pas des citations posées
// ═══════════════════════════════════════════════════════════

function PainSection() {
  const pains = [
    "Je vends, mais je ne sais pas vraiment ce que je gagne.",
    "Mon stock est éparpillé.",
    "Ma compta devient pénible.",
  ];

  return (
    <Reveal delay={0}>
      <section className="mb-20">
        <div className="max-w-2xl mx-auto rounded-2xl overflow-hidden border border-red-500/15 bg-gradient-to-b from-red-500/[0.05] to-neutral-900/20">
          <div className="px-6 py-8 sm:px-10 sm:py-10">
            <p className="text-[11px] font-semibold text-red-400/80 uppercase tracking-widest mb-5">
              Avant Kyrivo
            </p>
            <ul className="space-y-4">
              {pains.map((pain) => (
                <li key={pain} className="flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-red-400/70 flex-shrink-0" />
                  <span className="text-lg sm:text-xl text-neutral-200 font-medium leading-snug">{pain}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-neutral-800/60 bg-neutral-950/40 px-6 py-4 sm:px-10 text-center">
            <span className="text-sm font-semibold text-amber-400">→ Avec Kyrivo, tout ça devient clair.</span>
          </div>
        </div>
      </section>
    </Reveal>
  );
}

// ═══════════════════════════════════════════════════════════
// CE QUE KYRIVO FAIT — console produit : modules + résultat
// ═══════════════════════════════════════════════════════════

const MODULES = [
  { title: "Achats propres", description: "Fournisseur, coût, justificatif : chaque achat est tracé.", icon: <CartIcon /> },
  { title: "Stock suivi", description: "Quantités et références à jour, automatiquement.", icon: <StockIcon /> },
  { title: "Ventes liées", description: "Chaque vente se rattache à l'article vendu et à son coût.", icon: <SalesIcon /> },
  { title: "TVA standard ou sur marge", description: "Le bon régime selon la façon dont tu as acheté.", icon: <CalcIcon /> },
  { title: "Factures PDF", description: "Générées et numérotées, prêtes à envoyer.", icon: <InvoiceIcon /> },
  { title: "Exports Excel", description: "Tes données prêtes pour ton comptable, en un clic.", icon: <ExportIcon /> },
];

function FeatureSystemSection() {
  return (
    <Reveal delay={0}>
      <section className="mb-24">
        <SectionHeader label="Ce que Kyrivo fait" title="Un seul outil, du premier achat à l'export comptable" />

        <div className="relative mt-10 rounded-2xl border border-neutral-800 bg-neutral-900/30 overflow-hidden">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

          <div className="p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8 lg:gap-10 items-start">
            <ul className="divide-y divide-neutral-800/60">
              {MODULES.map((m) => (
                <li key={m.title} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                  <span className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    {m.icon}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{m.title}</p>
                    <p className="mt-0.5 text-sm text-neutral-400 leading-relaxed">{m.description}</p>
                  </div>
                </li>
              ))}
            </ul>

            <ResultPanel />
          </div>
        </div>
      </section>
    </Reveal>
  );
}

function ResultPanel() {
  const items = ["Stock synchronisé", "TVA suivie", "Facture prête", "Export comptable"];

  return (
    <div className="rounded-xl border border-amber-500/15 bg-gradient-to-b from-amber-500/[0.06] to-transparent p-5 lg:sticky lg:top-6">
      <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-widest mb-4">
        Résultat, à chaque vente
      </p>
      <ul className="space-y-3">
        {items.map((label) => (
          <li key={label} className="flex items-center gap-2.5 text-sm text-neutral-200 font-medium">
            <span className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 text-xs">
              ✓
            </span>
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// WORKFLOW — 4 étapes, ligne de connexion, timeline mobile
// ═══════════════════════════════════════════════════════════

function WorkflowSection() {
  const steps = [
    "Tu ajoutes tes achats.",
    "Tu vends tes articles.",
    "Kyrivo calcule stock, marges et TVA.",
    "Tu exportes ou factures.",
  ];

  return (
    <Reveal delay={0}>
      <section className="mb-24">
        <SectionHeader label="Comment ça marche" title="De l'achat à la marge, en 4 étapes" />

        {/* Desktop — ligne horizontale */}
        <div className="hidden sm:grid relative grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto">
          <div className="absolute top-[19px] left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-amber-500/50 via-amber-500/20 to-amber-500/50" />
          {steps.map((step, i) => (
            <div key={step} className="relative text-center px-2">
              <span className="relative z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-500/30 bg-neutral-950 text-amber-400 text-sm font-bold mb-3">
                {i + 1}
              </span>
              <p className="text-sm text-neutral-300 leading-relaxed">{step}</p>
            </div>
          ))}
        </div>

        {/* Mobile — timeline verticale */}
        <div className="sm:hidden relative mt-10 space-y-6 max-w-md mx-auto">
          <div className="absolute left-4 top-1 bottom-1 w-px bg-gradient-to-b from-amber-500/50 to-transparent" />
          {steps.map((step, i) => (
            <div key={step} className="relative flex items-start gap-4">
              <span className="relative z-10 flex-shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full border border-amber-500/30 bg-neutral-950 text-amber-400 text-xs font-bold">
                {i + 1}
              </span>
              <p className="pt-1.5 text-sm text-neutral-300 leading-relaxed">{step}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center">
          <Link href="/mode-emploi" className="text-xs text-neutral-500 hover:text-amber-400 transition-colors">
            Voir le mode d&apos;emploi →
          </Link>
        </p>
      </section>
    </Reveal>
  );
}

// ═══════════════════════════════════════════════════════════
// POUR QUI — chips premium, pas une grille de cartes
// ═══════════════════════════════════════════════════════════

function AudienceSection() {
  const audiences = ["Vinted", "Brocante", "Cartes & TCG", "Collection", "Lego & jouets", "Petits revendeurs"];

  return (
    <Reveal delay={0}>
      <section className="mb-24 max-w-3xl mx-auto text-center">
        <SectionHeader label="Pour qui" title="Pensé pour les revendeurs de biens physiques" />
        <div className="mt-7 flex flex-wrap justify-center gap-2.5">
          {audiences.map((a) => (
            <span
              key={a}
              className="inline-flex items-center rounded-full border border-amber-500/25 bg-gradient-to-b from-amber-500/10 to-transparent px-4 py-2 text-sm font-semibold text-amber-300"
            >
              {a}
            </span>
          ))}
        </div>
        <p className="mt-5 text-sm text-neutral-500">
          Quelques ventes par mois ou une activité à temps plein — Kyrivo s&apos;adapte.
        </p>
      </section>
    </Reveal>
  );
}

// ═══════════════════════════════════════════════════════════
// PREUVE SOCIALE — reprend les chiffres déjà annoncés dans le
// footer (CredibilityFooter), mis en valeur juste avant le CTA
// ═══════════════════════════════════════════════════════════

function SocialProofSection() {
  return (
    <Reveal delay={0}>
      <section className="mb-24">
        <SocialProofBadges />
      </section>
    </Reveal>
  );
}

// ═══════════════════════════════════════════════════════════
// TARIFS / CTA — bloc le plus premium de la page
// ═══════════════════════════════════════════════════════════

function PricingCTA({ user }: { user: boolean }) {
  const reassurance = ["Essai gratuit 7 jours", "Sans carte bancaire", "Dès 9,90 €/mois", "Données exportables"];

  return (
    <Reveal delay={0} direction="scale">
      <section className="mb-24">
        <div
          className="relative rounded-2xl overflow-hidden border px-6 py-12 lg:px-16 lg:py-16 text-center"
          style={{
            borderColor: "rgba(245,158,11,0.22)",
            background: "linear-gradient(160deg, rgba(245,158,11,0.07) 0%, #0d0d0e 55%, rgba(245,158,11,0.04) 100%)",
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
          <div
            className="absolute -top-20 right-0 h-64 w-64 rounded-full opacity-25 blur-3xl pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(245,158,11,0.6) 0%, transparent 70%)" }}
          />

          <div className="relative">
            <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-widest mb-4">Tarifs</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight max-w-xl mx-auto">
              Commence sans risque
            </h2>
            <p className="mt-4 text-neutral-400 max-w-lg mx-auto leading-relaxed">
              Encode quelques achats, quelques ventes, et vois directement si Kyrivo remplace ton Excel.
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {reassurance.map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5 text-sm text-neutral-300">
                  <span className="text-emerald-400">✓</span>
                  {t}
                </span>
              ))}
            </div>

            <div className="mt-9 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-center w-full max-w-sm sm:max-w-none mx-auto">
              {user ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 bg-amber-500 text-neutral-950 text-sm font-bold hover:bg-amber-400 hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200 shadow-xl shadow-amber-500/25"
                >
                  Accéder à mon espace
                </Link>
              ) : (
                <RegisterCTA label="Essai gratuit 7 jours" />
              )}
              <Link
                href="/abonnements"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-4 text-neutral-400 text-sm font-medium hover:text-neutral-200 transition-colors duration-200"
              >
                Voir les tarifs
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Reveal>
  );
}

// ═══════════════════════════════════════════════════════════
// FAQ — <details>/<summary> natifs, pas de JS
// ═══════════════════════════════════════════════════════════

function FAQSection() {
  return (
    <Reveal delay={0}>
      <section className="mb-20" aria-labelledby="faq-heading">
        <SectionHeader label="FAQ" title="Questions fréquentes" id="faq-heading" />

        <div className="mt-10 max-w-2xl mx-auto space-y-2.5">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.question}
              className="group rounded-xl border border-neutral-800 bg-neutral-900/30 px-5 py-4 open:border-amber-500/25 open:bg-neutral-900/50 hover:border-neutral-700 transition-colors duration-200"
            >
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none marker:content-none [&::-webkit-details-marker]:hidden">
                <h3 className="text-sm font-semibold text-white">{item.question}</h3>
                <span className="text-neutral-400 text-lg leading-none transition-transform duration-200 group-open:rotate-45 flex-shrink-0">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-neutral-400 leading-relaxed">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </Reveal>
  );
}

// ═══════════════════════════════════════════════════════════
// CRÉDIBILITÉ + FOOTER
// ═══════════════════════════════════════════════════════════

function CredibilityFooter() {
  return (
    <>
      <Reveal delay={0} className="mb-10 text-center">
        <p className="text-base text-neutral-400">
          Développé par <span className="text-amber-400 font-semibold">Kartium TCG</span>, boutique e-commerce professionnelle.
        </p>
        <p className="mt-2 text-sm text-neutral-400">
          Avis clients : Vinted (24 avis) · Google (7 avis)
        </p>
      </Reveal>

      <div className="pt-6 mt-6 border-t border-neutral-800/60">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <p className="text-[11px] text-neutral-400 tracking-wider uppercase">
            Kyrivo · Gestion achat-revente
          </p>
          <p className="text-[11px] text-neutral-400">France · Belgique · Luxembourg</p>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Liens légaux">
          {[
            { href: "/mentions-legales", label: "Mentions légales" },
            { href: "/conditions-generales", label: "CGU / CGV" },
            { href: "/politique-confidentialite", label: "Confidentialité" },
            { href: "/cookies", label: "Cookies" },
            { href: "/donnees-personnelles", label: "Données personnelles" },
          ].map(({ href, label }) => (
            <Link key={href} href={href} prefetch={false} className="text-[10px] text-neutral-400 hover:text-neutral-200 transition-colors">
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// PETITS UTILITAIRES PARTAGÉS
// ═══════════════════════════════════════════════════════════

// Grille fine + fondu radial — texture de fond premium contenue dans une section
function GridFade({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 top-0 -z-10 ${className}`}
      style={{
        backgroundImage:
          "linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px)",
        backgroundSize: "42px 42px",
        maskImage: "radial-gradient(ellipse 70% 60% at 50% 0%, black 25%, transparent 75%)",
        WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 0%, black 25%, transparent 75%)",
      }}
    />
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════
// ICÔNES DE MODULE — sobres, monochromes
// ═══════════════════════════════════════════════════════════

function CartIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
    </svg>
  );
}

function StockIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
  );
}

function SalesIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
    </svg>
  );
}

function CalcIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V13.5Zm0 2.25h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V18Zm2.498-6.75h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V13.5Zm0 2.25h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V18Zm2.504-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5ZM8.25 6h7.5v2.25h-7.5V6ZM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 0 0 2.25 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0 0 12 2.25Z" />
    </svg>
  );
}

function InvoiceIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
}
