"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buildRegisterUrl, trackFunnel, trackMetaCustom } from "@/lib/analytics";

// ═══════════════════════════════════════════════════════════
// IMAGE AVEC FALLBACK
// ═══════════════════════════════════════════════════════════

function HelpImage({ src, alt }: { src: string; alt: string }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="mt-5 flex items-center justify-center rounded-xl border border-dashed border-neutral-700 bg-neutral-900/40 py-10">
        <span className="text-sm text-neutral-600">Capture d&apos;écran à venir</span>
      </div>
    );
  }

  return (
    <div className="mt-5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onError={() => setHasError(true)}
        className="w-full rounded-xl border border-neutral-800/60"
        loading="lazy"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
      />
      <div className="mt-2 text-right">
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
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
// ACCORDÉON — ENTRÉE UNIQUE
// ═══════════════════════════════════════════════════════════

type AccordionItem = {
  question: string;
  answer: React.ReactNode;
  screenshot?: { src: string; alt: string };
};

function AccordionEntry({
  item,
  isOpen,
  onToggle,
}: {
  item: AccordionItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`
        rounded-xl border overflow-hidden
        transition-colors duration-150
        ${isOpen ? "border-amber-500/30" : "border-neutral-800 hover:border-neutral-700"}
      `}
    >
      {/* Question — bouton cliquable */}
      <button
        type="button"
        onClick={onToggle}
        className={`
          w-full flex items-center justify-between gap-4
          px-5 py-4 text-left min-h-[56px]
          transition-colors duration-150
          ${isOpen ? "bg-amber-500/5" : "bg-neutral-900/40 hover:bg-neutral-900/60"}
        `}
        aria-expanded={isOpen}
      >
        <span
          className={`text-sm font-semibold leading-snug ${
            isOpen ? "text-amber-400" : "text-white"
          }`}
        >
          {item.question}
        </span>

        {/* Chevron */}
        <svg
          className={`
            flex-shrink-0 h-5 w-5
            transition-transform duration-200
            ${isOpen ? "rotate-180 text-amber-400" : "text-neutral-500"}
          `}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Réponse */}
      {isOpen && (
        <div className="px-5 pb-6 pt-4 bg-neutral-900/20 border-t border-neutral-800/50">
          <div className="text-sm text-neutral-300 leading-relaxed">
            {item.answer}
          </div>
          {item.screenshot && (
            <HelpImage src={item.screenshot.src} alt={item.screenshot.alt} />
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CONTENU DES 7 QUESTIONS
// ═══════════════════════════════════════════════════════════

const ITEMS: AccordionItem[] = [
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
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════════

export default function ModeEmploiPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const router = useRouter();

  const toggle = (i: number) =>
    setOpenIndex((prev) => (prev === i ? null : i));

  function handleRegisterClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    trackFunnel("cta_register_click");
    trackMetaCustom("ClickStartTrial");
    router.push(buildRegisterUrl());
  }

  return (
    <div className="relative px-4 sm:px-6 lg:px-10 py-10 lg:py-14 mx-auto max-w-3xl">

      {/* ─── En-tête ────────────────────────────────────── */}
      <div className="mb-10">
        <div className="flex w-fit items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 mb-5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          <span className="text-[11px] font-semibold text-amber-400 tracking-widest uppercase">
            Guide
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4 leading-tight">
          Mode d&apos;emploi Kyrivo — gérer achats, ventes, stock et marges
        </h1>

        <p className="text-base text-neutral-300 leading-relaxed max-w-2xl">
          Ce guide explique comment utiliser Kyrivo pour gérer une activité d&apos;achat-revente : configuration du compte, encodage des achats, encodage des ventes, suivi du stock, analyse des marges, exports Excel et génération de factures.
        </p>
      </div>

      {/* ─── Accordéon ──────────────────────────────────── */}
      <div className="space-y-2" role="list">
        {ITEMS.map((item, i) => (
          <div key={i} role="listitem">
            <AccordionEntry
              item={item}
              isOpen={openIndex === i}
              onToggle={() => toggle(i)}
            />
          </div>
        ))}
      </div>

      {/* ─── CTA bas de page ────────────────────────────── */}
      <div
        className="mt-14 rounded-2xl border border-amber-500/20 px-6 py-8 text-center"
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
          <Link
            href="/register"
            onClick={handleRegisterClick}
            className="
              inline-flex items-center justify-center gap-2
              rounded-lg px-5 py-2.5
              bg-amber-500 text-neutral-950
              text-sm font-semibold
              hover:bg-amber-400 active:scale-[0.98]
              transition-all duration-200
              shadow-lg shadow-amber-500/20
            "
          >
            Essayer gratuitement
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <Link
            href="/abonnements"
            className="
              inline-flex items-center justify-center gap-2
              rounded-lg px-5 py-2.5
              bg-neutral-900/60 text-neutral-200
              text-sm font-semibold
              border border-neutral-800
              hover:border-neutral-700 hover:bg-neutral-900
              transition-all duration-200
            "
          >
            Voir les tarifs
          </Link>
        </div>
      </div>

    </div>
  );
}
