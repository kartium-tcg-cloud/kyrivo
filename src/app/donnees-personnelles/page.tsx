// src/app/donnees-personnelles/page.tsx

import { Metadata } from "next"
import LegalPage, {
  LegalSection,
  InfoCard,
  LegalList,
} from "@/components/legal/LegalPage"

export const metadata: Metadata = {
  title: "Traitement des données personnelles — Kyrivo",
  description: "Résumé clair sur le traitement de vos données personnelles par Kyrivo.",
}

export default function DonneesPersonnellesPage() {
  return (
    <LegalPage
      title="Traitement des données personnelles"
      subtitle="Un résumé clair, sans jargon juridique, sur les données que Kyrivo traite et vos droits."
      lastUpdated="mai 2026"
    >
      <div>

        <LegalSection title="Qui est responsable de vos données ?">
          <InfoCard>
            <p><strong className="text-neutral-100">Pierre Higny</strong> — exploitant de Kyrivo</p>
            <p className="text-neutral-400">Monteux 6, 4990 Lierneux, Belgique</p>
            <p>
              Contact :{" "}
              <a href="mailto:contact@kartium-tcg.com" className="text-amber-400 hover:text-amber-300 transition-colors">
                contact@kartium-tcg.com
              </a>
            </p>
          </InfoCard>
        </LegalSection>

        <LegalSection title="Quelles données Kyrivo traite ?">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                icon: "👤",
                title: "Votre compte",
                detail: "Votre adresse email. Éventuellement votre nom et le nom de votre société si vous les renseignez.",
              },
              {
                icon: "📦",
                title: "Vos données métier",
                detail: "Les achats, ventes, articles et contacts que vous encodez vous-même. Ces données vous appartiennent.",
              },
              {
                icon: "💳",
                title: "Votre abonnement",
                detail: "Le type d'abonnement actif et les dates. Les données de carte bancaire sont traitées par Stripe — Kyrivo ne les voit jamais.",
              },
              {
                icon: "🔐",
                title: "Votre session",
                detail: "Des jetons d'authentification pour vous garder connecté de façon sécurisée (valables 1h, renouvelables 7 jours).",
              },
            ].map(({ icon, title, detail }) => (
              <div key={title} className="bg-[#111111] border border-[#1e1e1e] rounded-xl p-4 flex gap-3">
                <span className="text-xl flex-shrink-0 mt-0.5">{icon}</span>
                <div>
                  <p className="text-sm font-semibold text-white mb-1">{title}</p>
                  <p className="text-xs text-neutral-400 leading-relaxed">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </LegalSection>

        <LegalSection title="Pourquoi ces données sont traitées ?">
          <LegalList items={[
            "Pour créer et gérer votre compte utilisateur.",
            "Pour faire fonctionner les modules achats, ventes, stock et facturation.",
            "Pour gérer votre abonnement et traiter les paiements.",
            "Pour assurer la sécurité du service.",
            "Pour respecter les obligations légales (conservation comptable : 7 ans).",
          ]} />
          <p className="text-neutral-400 text-sm mt-3">
            Kyrivo n&apos;utilise pas vos données à des fins publicitaires et ne les revend à aucun tiers.
          </p>
        </LegalSection>

        <LegalSection title="Qui a accès à vos données ?">
          <LegalList items={[
            <><strong className="text-neutral-100">Vous</strong> — accès complet à toutes vos données via l&apos;application.</>,
            <><strong className="text-neutral-100">Pierre Higny</strong> — accès limité à des fins d&apos;administration et de support technique.</>,
            <><strong className="text-neutral-100">Supabase</strong> — hébergeur de la base de données (sous contrat de sous-traitance).</>,
            <><strong className="text-neutral-100">Vercel</strong> — hébergeur de l&apos;application (logs techniques uniquement).</>,
            <><strong className="text-neutral-100">Stripe</strong> — uniquement pour le traitement des paiements.</>,
          ]} />
          <p className="text-neutral-400 text-sm mt-3">
            Aucun autre tiers n&apos;a accès à vos données métier.
          </p>
        </LegalSection>

        <LegalSection title="Vos données bancaires">
          <InfoCard>
            <p className="text-sm font-medium text-neutral-100">
              Kyrivo ne stocke aucune donnée bancaire.
            </p>
            <p className="text-sm text-neutral-400 mt-1">
              Les informations de carte de crédit ou tout autre moyen de paiement sont traités directement par{" "}
              <strong className="text-neutral-200">Stripe</strong> sur leurs serveurs sécurisés (certification PCI-DSS).
              Kyrivo n&apos;a jamais accès à ces informations.
            </p>
          </InfoCard>
        </LegalSection>

        <LegalSection title="Vos droits sur vos données">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { droit: "Consulter vos données", action: "Demander une copie de toutes les données que nous détenons sur vous." },
              { droit: "Corriger vos données", action: "Faire rectifier des informations inexactes." },
              { droit: "Supprimer vos données", action: "Demander l'effacement de votre compte et de vos données (sous réserve des obligations légales)." },
              { droit: "Exporter vos données", action: "Recevoir vos données dans un format lisible (portabilité)." },
              { droit: "Limiter le traitement", action: "Demander la suspension temporaire d'un traitement en cas de contestation." },
              { droit: "Faire une réclamation", action: "Contacter l'Autorité de protection des données belge (APD) si vous estimez vos droits non respectés." },
            ].map(({ droit, action }) => (
              <div key={droit} className="bg-[#111111] border border-[#1e1e1e] rounded-xl p-4">
                <p className="text-sm font-semibold text-amber-400/90 mb-1">{droit}</p>
                <p className="text-xs text-neutral-400 leading-relaxed">{action}</p>
              </div>
            ))}
          </div>
        </LegalSection>

        <LegalSection title="Comment demander la suppression ou l'export de vos données ?">
          <p>
            Envoyez un email à{" "}
            <a href="mailto:contact@kartium-tcg.com" className="text-amber-400 hover:text-amber-300 transition-colors font-medium">
              contact@kartium-tcg.com
            </a>{" "}
            en précisant :
          </p>
          <LegalList items={[
            "L'adresse email de votre compte Kyrivo.",
            "La nature de votre demande (suppression, export, rectification…).",
            "Une preuve d'identité si nécessaire pour vérification.",
          ]} />
          <p className="text-neutral-400 text-sm mt-3">
            Vous recevrez une réponse dans un délai maximum de <strong className="text-neutral-300">30 jours</strong>.
          </p>
        </LegalSection>

        <LegalSection title="Pour aller plus loin">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "Politique de confidentialité complète", href: "/politique-confidentialite", desc: "Version détaillée avec bases légales RGPD et sous-traitants.", external: false },
              { label: "Politique relative aux cookies", href: "/cookies", desc: "Détail des cookies utilisés par Kyrivo.", external: false },
              { label: "Conditions générales", href: "/conditions-generales", desc: "Règles d'utilisation du service et abonnements.", external: false },
              { label: "Autorité de protection des données (APD)", href: "https://www.autoriteprotectiondonnees.be", desc: "L'autorité belge de contrôle du RGPD.", external: true },
            ].map(({ label, href, desc, external }) => (
              <a
                key={href}
                href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                className="bg-[#111111] border border-[#1e1e1e] hover:border-amber-500/30 rounded-xl p-4 transition-colors group block"
              >
                <p className="text-sm font-medium text-neutral-200 group-hover:text-amber-400 transition-colors mb-1">
                  {label}
                  {external && <span className="ml-1 text-neutral-600 text-xs">↗</span>}
                </p>
                <p className="text-xs text-neutral-500 leading-relaxed">{desc}</p>
              </a>
            ))}
          </div>
        </LegalSection>

      </div>
    </LegalPage>
  )
}
