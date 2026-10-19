"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { buildRegisterUrl, trackFunnel, trackMetaCustom } from "@/lib/analytics";
import Button from "@/components/ui/Button";
import { onboardingGuide } from "@/lib/news";

// ═══════════════════════════════════════════════════════════
// IMAGE AVEC FALLBACK
// ═══════════════════════════════════════════════════════════

function HelpImage({
  src,
  alt,
  width,
  height,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
}) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="mt-5 flex items-center justify-center rounded-xl border border-dashed border-neutral-700 bg-neutral-900/40 py-10">
        <span className="text-sm text-neutral-400">Capture d&apos;écran à venir</span>
      </div>
    );
  }

  return (
    <div className="mt-5">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        onError={() => setHasError(true)}
        className="w-full h-auto rounded-xl border border-neutral-800/60"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
        sizes="(min-width: 768px) 704px, (min-width: 640px) calc(100vw - 48px), calc(100vw - 40px)"
      />
      <div className="mt-2 text-right">
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-300 transition-colors"
        >
          Ouvrir en grand
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SECTIONS DU TUTORIEL — CONTENU VISIBLE ET ACCESSIBLE
// ═══════════════════════════════════════════════════════════

type GuideStep = {
  question: string;
  answer: React.ReactNode;
  screenshot?: { src: string; alt: string; width: number; height: number };
};

const SECTION_IDS = [
  "preparer-son-compte",
  "encoder-un-achat",
  "encoder-une-vente",
  "exporter-vers-excel",
  "generer-ses-factures",
  "suivre-son-activite",
  "choisir-son-abonnement",
] as const;

function GuideSection({ item, index }: { item: GuideStep; index: number }) {
  return (
    <section
      id={SECTION_IDS[index]}
      aria-labelledby={`${SECTION_IDS[index]}-title`}
      className="scroll-mt-24 overflow-hidden rounded-2xl border border-neutral-800/90 bg-neutral-900/45 shadow-[0_12px_48px_rgba(0,0,0,0.12)]"
    >
      <div className="flex items-start gap-4 border-b border-neutral-800/70 bg-gradient-to-r from-amber-500/[0.08] to-transparent px-5 py-5 sm:px-7 sm:py-6">
        <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10 text-sm font-bold text-amber-300">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-400/90">Étape {index + 1}</span>
          <h2 id={`${SECTION_IDS[index]}-title`} className="mt-1 text-xl font-semibold leading-snug text-white sm:text-2xl">
            {item.question.replace(/^\d+\.\s*/, "")}
          </h2>
        </div>
      </div>
      <div className="px-5 pb-7 pt-5 sm:px-7 sm:pb-8 sm:pt-6">
        <div className="space-y-4 text-[15px] leading-7 text-neutral-300">
          {item.answer}
        </div>
        {item.screenshot && (
          <HelpImage
            src={item.screenshot.src}
            alt={item.screenshot.alt}
            width={item.screenshot.width}
            height={item.screenshot.height}
          />
        )}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// CONTENU DES 7 QUESTIONS
// ═══════════════════════════════════════════════════════════

const ITEMS: GuideStep[] = [
  {
    question: "1. Comment préparer Kyrivo avant d'encoder mes transactions ?",
    answer: (
      <div className="space-y-3">
        <p>
          Avant d&apos;encoder tes premiers achats et ventes, configure les{" "}
          <strong className="text-white">Préférences</strong> de ton compte :
        </p>
        <ul className="space-y-2 pl-4">
          <li className="flex gap-2">
            <span className="text-amber-400 mt-0.5 flex-shrink-0">·</span>
            <span>
              Règle le <strong className="text-neutral-200">taux de TVA par défaut</strong>{" "}selon ta situation fiscale.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-amber-400 mt-0.5 flex-shrink-0">·</span>
            <span>
              Enregistre les <strong className="text-neutral-200">modes de paiement</strong>{" "}que tu utilises le plus souvent.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-amber-400 mt-0.5 flex-shrink-0">·</span>
            <span>
              Complète l&apos;<strong className="text-neutral-200">identité de ta société</strong>{" "}ou de ton activité : nom, adresse, numéro de TVA si applicable.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-amber-400 mt-0.5 flex-shrink-0">·</span>
            <span>
              Vérifie les <strong className="text-neutral-200">informations de facturation</strong>{" "}pour qu&apos;elles apparaissent correctement sur tes factures PDF.
            </span>
          </li>
        </ul>
        <p className="text-neutral-500 text-xs pt-1">
          Bien configurer ces éléments te permet de gagner du temps à chaque saisie et d&apos;éviter de répéter les mêmes informations.
        </p>
      </div>
    ),
    screenshot: {
      src: "/help/preferences.png",
      alt: "Page Préférences Kyrivo — configuration TVA, modes de paiement et identité",
      width: 1586,
      height: 992,
    },
  },

  {
    question: "2. Comment encoder un achat ?",
    answer: (
      <div className="space-y-3">
        <p>
          Va dans <strong className="text-white">Achats</strong> et clique sur{" "}
          <strong className="text-white">Ajouter un achat</strong>.
        </p>
        <p>Renseigne les informations : date, montant HT ou TTC, TVA et moyen de paiement.</p>

        <p>Il existe deux catégories d&apos;achats :</p>
        <ul className="space-y-2 pl-4">
          <li className="flex gap-2">
            <span className="text-amber-400 mt-0.5 flex-shrink-0">·</span>
            <span>
              <strong className="text-neutral-200">Achat avec articles en stock</strong> : produits destinés à être revendus. Chaque article encodé alimentera ton stock et sera disponible à la vente.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-amber-400 mt-0.5 flex-shrink-0">·</span>
            <span>
              <strong className="text-neutral-200">Achat sans stock</strong> : dépenses comme cartes de visite, fournitures, emballages, abonnements. Utiles pour le suivi financier et la TVA éventuelle, mais sans impact sur le stock.
            </span>
          </li>
        </ul>

        <p>Quelques détails utiles :</p>
        <ul className="space-y-2 pl-4">
          <li className="flex gap-2">
            <span className="text-amber-400 mt-0.5 flex-shrink-0">·</span>
            <span>
              <strong className="text-neutral-200">Achat professionnel</strong> : encode la TVA applicable (20 %, 21 % ou tout autre taux).
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-amber-400 mt-0.5 flex-shrink-0">·</span>
            <span>
              <strong className="text-neutral-200">Achat particulier</strong> : TVA à 0 % par défaut, pour les achats sans TVA récupérable.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-amber-400 mt-0.5 flex-shrink-0">·</span>
            <span>
              Tu peux <strong className="text-neutral-200">joindre un fichier</strong>{" "}(facture PDF, photo…) directement depuis le formulaire d&apos;achat.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-amber-400 mt-0.5 flex-shrink-0">·</span>
            <span>
              Le <strong className="text-neutral-200">fournisseur peut être enregistré en un clic</strong>{" "}pour être réutilisé lors de tes prochains achats.
            </span>
          </li>
        </ul>

        <p className="text-neutral-500 text-xs pt-1">
          Les informations détaillées de tes fournisseurs peuvent être complétées dans la section{" "}
          <strong className="text-neutral-400">Contacts</strong>.
        </p>
      </div>
    ),
    screenshot: {
      src: "/help/achats.png",
      alt: "Page Achats Kyrivo — encoder un achat avec ou sans stock",
      width: 1448,
      height: 1086,
    },
  },

  {
    question: "3. Comment encoder une vente ?",
    answer: (
      <div className="space-y-3">
        <p>
          Va dans <strong className="text-white">Ventes</strong> et clique sur{" "}
          <strong className="text-white">Ajouter une vente</strong>.
        </p>
        <ul className="space-y-2 pl-4">
          <li className="flex gap-2">
            <span className="text-amber-400 mt-0.5 flex-shrink-0">·</span>
            <span>Choisis le client si nécessaire.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-amber-400 mt-0.5 flex-shrink-0">·</span>
            <span>Sélectionne les articles depuis ton stock disponible (ou encode manuellement des articles hors stock).</span>
          </li>
          <li className="flex gap-2">
            <span className="text-amber-400 mt-0.5 flex-shrink-0">·</span>
            <span>Encode le prix de vente, la quantité et le moyen de paiement.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-amber-400 mt-0.5 flex-shrink-0">·</span>
            <span>
              Choisis le <strong className="text-neutral-200">mode TVA</strong>{" "}adapté à ta situation : TVA standard ou TVA sur marge.
            </span>
          </li>
        </ul>
        <p>Le stock est décrémenté automatiquement à l&apos;enregistrement de la vente.</p>
        <p className="text-neutral-500 text-xs pt-1">
          En cas de doute sur le régime TVA applicable à ton activité, rapproche-toi de ton comptable.
        </p>
        <p className="text-neutral-500 text-xs pt-1">
          Les informations détaillées de tes clients peuvent être complétées dans la section{" "}
          <strong className="text-neutral-400">Contacts</strong>.
        </p>
      </div>
    ),
    screenshot: {
      src: "/help/ventes.png",
      alt: "Page Ventes Kyrivo — encoder une vente avec sélection d'articles en stock",
      width: 1122,
      height: 1402,
    },
  },

  {
    question: "4. Comment exporter mes achats et ventes vers Excel ?",
    answer: (
      <div className="space-y-3">
        <p>
          Dans les pages <strong className="text-white">Achats</strong> et{" "}
          <strong className="text-white">Ventes</strong>, sélectionne une plage de dates et utilise les boutons d&apos;export pour télécharger tes données.
        </p>
        <p>
          Selon la page utilisée, tu peux exporter tes achats ou tes ventes pour retrouver les informations utiles dans un fichier Excel clair.
        </p>
        <p>
          Les fichiers Excel contiennent les montants utiles selon le type d&apos;export : montants HT, TTC, TVA, paiements et marges.
        </p>
        <p className="text-neutral-500 text-xs pt-1">
          Ces exports servent au suivi personnel et à préparer les informations utiles pour ton comptable.
        </p>
      </div>
    ),
    screenshot: {
      src: "/help/export-excel.png",
      alt: "Export Excel des achats et ventes dans Kyrivo",
      width: 1586,
      height: 992,
    },
  },

  {
    question: "5. Comment générer mes factures ?",
    answer: (
      <div className="space-y-3">
        <p>
          Va dans la section <strong className="text-white">Factures</strong>{" "}pour générer et télécharger tes factures.
        </p>
        <ul className="space-y-2 pl-4">
          <li className="flex gap-2">
            <span className="text-amber-400 mt-0.5 flex-shrink-0">·</span>
            <span>
              Vérifie d&apos;abord tes <strong className="text-neutral-200">informations de facturation</strong>{" "}dans Préférences.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-amber-400 mt-0.5 flex-shrink-0">·</span>
            <span>Sélectionne les ventes ou la période concernée, puis génère les factures PDF ou une archive ZIP.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-amber-400 mt-0.5 flex-shrink-0">·</span>
            <span>Kyrivo reprend les informations configurées dans tes Préférences et applique la numérotation prévue pour tes factures.</span>
          </li>
        </ul>
        <p className="text-neutral-500 text-xs pt-1">
          Vérifie que les mentions de tes factures correspondent à ta situation. Kyrivo aide à la génération mais ne garantit pas la conformité fiscale. En cas de doute, consulte un comptable.
        </p>
      </div>
    ),
    screenshot: {
      src: "/help/factures.png",
      alt: "Section Factures Kyrivo — générer des factures PDF",
      width: 1448,
      height: 1086,
    },
  },

  {
    question: "6. Comment suivre mes dépenses, revenus, TVA et résultat ?",
    answer: (
      <div className="space-y-3">
        <p>
          Le <strong className="text-white">Dashboard</strong>{" "}te donne une vue d&apos;ensemble de ton activité :
        </p>
        <ul className="space-y-2 pl-4">
          <li className="flex gap-2">
            <span className="text-amber-400 mt-0.5 flex-shrink-0">·</span>
            <span>Achats du mois, ventes du mois, stock disponible et quota utilisé.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-amber-400 mt-0.5 flex-shrink-0">·</span>
            <span>Argent immobilisé en stock.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-amber-400 mt-0.5 flex-shrink-0">·</span>
            <span>
              <strong className="text-neutral-200">Analyse par période</strong> : sélectionne deux dates pour voir les achats, ventes, TVA estimée et résultat net estimé sur l&apos;intervalle.
            </span>
          </li>
        </ul>
        <p className="text-neutral-500 text-xs pt-1">
          Ces montants sont des indicateurs de suivi basés sur les données encodées. Ils ne remplacent pas une comptabilité validée par un professionnel.
        </p>
      </div>
    ),
    screenshot: {
      src: "/help/dashboard.png",
      alt: "Dashboard Kyrivo — suivi des dépenses, revenus, TVA et résultat",
      width: 1448,
      height: 1086,
    },
  },

  {
    question: "7. Quel abonnement est fait pour moi ?",
    answer: (
      <div className="space-y-3">
        <p>
          Commence par l&apos;<strong className="text-white">essai gratuit de 7 jours</strong>{" "}pour tester l&apos;outil sans engagement ni carte bancaire.
        </p>
        <p>Ensuite, choisis le plan selon ton volume réel :</p>
        <ul className="space-y-2 pl-4">
          <li className="flex gap-2">
            <span className="text-amber-400 mt-0.5 flex-shrink-0">·</span>
            <span>
              <strong className="text-neutral-200">Pro</strong> : idéal pour démarrer ou pour une activité à faible volume.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-amber-400 mt-0.5 flex-shrink-0">·</span>
            <span>
              <strong className="text-neutral-200">Business</strong> : activité régulière avec un nombre de lignes plus élevé par mois.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-amber-400 mt-0.5 flex-shrink-0">·</span>
            <span>
              <strong className="text-neutral-200">Entreprise</strong> : gros volume de transactions.
            </span>
          </li>
        </ul>
        <p>
          Tu peux commencer avec le plan adapté à ton volume actuel, puis passer à une formule supérieure si ton activité augmente.
        </p>
        <div className="pt-2">
          <Link
            href="/abonnements"
            className="inline-flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium"
          >
            Voir les tarifs détaillés
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    ),
  },
];

// ═══════════════════════════════════════════════════════════
// FAQPage JSON-LD — réponses en texte brut synchronisées avec les
// 7 questions de ITEMS ci-dessus (les réponses y sont en JSX, donc
// non réutilisables telles quelles dans le schema.org).
// ═══════════════════════════════════════════════════════════

const FAQ_ANSWERS_PLAIN: string[] = [
  "Avant d'encoder tes premiers achats et ventes, configure les Préférences de ton compte : le taux de TVA par défaut selon ta situation fiscale, les modes de paiement que tu utilises le plus souvent, l'identité de ta société ou de ton activité, et les informations de facturation pour tes factures PDF.",
  "Va dans Achats et clique sur Ajouter un achat, puis renseigne la date, le montant HT ou TTC, la TVA et le moyen de paiement. Il existe deux catégories d'achats : achat avec articles en stock, destinés à être revendus, et achat sans stock pour les dépenses comme les fournitures ou les abonnements. Tu peux joindre un justificatif et enregistrer le fournisseur en un clic.",
  "Va dans Ventes et clique sur Ajouter une vente. Choisis le client si nécessaire, sélectionne les articles depuis ton stock disponible, encode le prix de vente, la quantité et le moyen de paiement, puis choisis le mode TVA adapté à ta situation : TVA standard ou TVA sur marge. Le stock est décrémenté automatiquement à l'enregistrement de la vente.",
  "Dans les pages Achats et Ventes, sélectionne une plage de dates et utilise les boutons d'export pour télécharger tes données. Les fichiers Excel contiennent les montants utiles selon le type d'export : montants HT, TTC, TVA, paiements et marges.",
  "Va dans la section Factures pour générer et télécharger tes factures. Vérifie d'abord tes informations de facturation dans Préférences, puis sélectionne les ventes ou la période concernée pour générer les factures PDF ou une archive ZIP.",
  "Le Dashboard donne une vue d'ensemble de ton activité : achats du mois, ventes du mois, stock disponible et quota utilisé, ainsi que l'argent immobilisé en stock. L'analyse par période permet de sélectionner deux dates pour voir les achats, ventes, TVA estimée et résultat net estimé sur l'intervalle.",
  "Commence par l'essai gratuit de 7 jours pour tester l'outil sans engagement ni carte bancaire. Ensuite, choisis le plan selon ton volume réel : Pro pour démarrer ou une activité à faible volume, Business pour une activité régulière, et Entreprise pour un gros volume de transactions.",
];

const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: ITEMS.map((item, i) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: FAQ_ANSWERS_PLAIN[i] },
  })),
};

// ═══════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════════

export default function GuideDemarragePage() {
  const router = useRouter();

  function handleRegisterClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    trackFunnel("cta_register_click");
    trackMetaCustom("ClickStartTrial");
    router.push(buildRegisterUrl());
  }

  return (
    <main className="ky-marketing mx-auto w-full max-w-6xl px-5 pb-20 pt-9 sm:px-8 lg:pt-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Article",
                headline: onboardingGuide.title,
                description: onboardingGuide.summary,
                datePublished: onboardingGuide.dateISO,
                dateModified: onboardingGuide.dateISO,
                inLanguage: "fr",
                author: { "@type": "Organization", name: "Équipe Kyrivo" },
                publisher: { "@type": "Organization", name: "Kyrivo", url: "https://kyrivo.fr" },
                mainEntityOfPage: `https://kyrivo.fr${onboardingGuide.href}`,
              },
              { "@type": "FAQPage", mainEntity: faqStructuredData.mainEntity },
            ],
          }),
        }}
      />

      <nav aria-label="Fil d’Ariane" className="mb-7 text-sm text-neutral-400">
        <Link href="/nouveautes" className="transition-colors hover:text-amber-300">Nouveautés</Link>
        <span aria-hidden="true" className="mx-2 text-neutral-600">/</span>
        <span aria-current="page" className="text-neutral-200">Guide de démarrage</span>
      </nav>

      <header className="relative mb-10 overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.11] via-neutral-900/80 to-neutral-950 p-6 sm:p-9 lg:p-12">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-amber-500/[0.07] blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-md border border-amber-500/35 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300">
            {onboardingGuide.category}
          </span>
          <time dateTime={onboardingGuide.dateISO} className="text-neutral-300">{onboardingGuide.dateLabel}</time>
          <span aria-hidden="true" className="text-neutral-600">·</span>
          <span className="text-neutral-400">7 étapes illustrées</span>
        </div>
        <p className="relative mt-7 text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Prendre en main Kyrivo</p>
        <h1 className="relative mt-3 max-w-4xl text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
          {onboardingGuide.title}
        </h1>
        <p className="relative mt-5 max-w-3xl text-base leading-8 text-neutral-300 sm:text-lg">
          {onboardingGuide.summary} Suis les étapes dans l&apos;ordre ou accède directement au sujet qui t&apos;intéresse.
        </p>
        <a href="#etapes" className="relative mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-neutral-950 transition-colors hover:bg-amber-400">
          Explorer le tutoriel
          <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" /></svg>
        </a>
      </header>

      <div id="etapes" className="grid scroll-mt-10 items-start gap-8 lg:grid-cols-[245px_minmax(0,1fr)] lg:gap-10">
        <nav aria-label="Sommaire du tutoriel" className="rounded-2xl border border-neutral-800 bg-neutral-900/55 p-5 lg:sticky lg:top-8">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-neutral-400">Dans ce tutoriel</p>
          <ol className="space-y-1">
            {ITEMS.map((item, index) => (
              <li key={SECTION_IDS[index]}>
                <a href={`#${SECTION_IDS[index]}`} className="flex items-start gap-3 rounded-lg px-2 py-2.5 text-sm leading-5 text-neutral-300 transition-colors hover:bg-amber-500/10 hover:text-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400">
                  <span className="shrink-0 font-mono text-xs text-amber-400">{String(index + 1).padStart(2, "0")}</span>
                  <span>{item.question.replace(/^\d+\.\s*/, "")}</span>
                </a>
              </li>
            ))}
          </ol>
          <Link href="/nouveautes" className="mt-5 inline-flex items-center gap-2 border-t border-neutral-800 pt-5 text-sm font-medium text-amber-300 hover:text-amber-200">
            ← Toutes les nouveautés
          </Link>
        </nav>

        <article aria-label="Étapes du guide" className="min-w-0 space-y-6">
          {ITEMS.map((item, index) => <GuideSection key={SECTION_IDS[index]} item={item} index={index} />)}
        </article>
      </div>

      {/* ─── CTA bas de page ────────────────────────────── */}
      <div
        className="mt-14 rounded-2xl border border-amber-500/20 px-6 py-9 text-center sm:py-11"
        style={{
          background:
            "linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(23,23,23,0.3) 100%)",
        }}
      >
        <p className="text-sm font-semibold text-white mb-1">
          Prêt à démarrer ?
        </p>
        <p className="text-sm text-neutral-400 mb-5">
          Essaie Kyrivo gratuitement pendant 7 jours, sans carte bancaire.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button href="/register" onClick={handleRegisterClick}>
            Essayer gratuitement
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Button>
          <Button href="/abonnements" variant="secondary">
            Voir les tarifs
          </Button>
        </div>
      </div>

    </main>
  );
}
