// src/app/politique-confidentialite/page.tsx

import { Metadata } from "next"
import LegalPage, {
  LegalSection,
  LegalSubSection,
  InfoCard,
  LegalList,
} from "@/components/legal/LegalPage"

export const metadata: Metadata = {
  title: "Politique de confidentialité — Kyrivo",
  description: "Comment Kyrivo collecte, utilise et protège vos données personnelles. Conformité RGPD.",
}

export default function PolitiqueConfidentialitePage() {
  return (
    <LegalPage
      title="Politique de confidentialité"
      subtitle="Comment Kyrivo traite vos données personnelles. Conformément au Règlement Général sur la Protection des Données (RGPD – UE 2016/679)."
      lastUpdated="mai 2026"
    >
      <div>

        {/* ── 1. RESPONSABLE DU TRAITEMENT ─────────────────── */}
        <LegalSection title="1. Responsable du traitement">
          <InfoCard>
            <p><strong className="text-neutral-100">Responsable du traitement :</strong> Pierre Higny</p>
            <p><strong className="text-neutral-100">Statut :</strong> Personne physique, exploitant de Kyrivo</p>
            <p><strong className="text-neutral-100">Adresse :</strong> Monteux 6, 4990 Lierneux, Belgique</p>
            <p>
              <strong className="text-neutral-100">Email :</strong>{" "}
              <a href="mailto:contact@kartium-tcg.com" className="text-amber-400 hover:text-amber-300 transition-colors">
                contact@kartium-tcg.com
              </a>
            </p>
          </InfoCard>
        </LegalSection>

        {/* ── 2. DONNÉES COLLECTÉES ────────────────────────── */}
        <LegalSection title="2. Données collectées">

          <LegalSubSection title="2.1 Données de compte">
            <LegalList items={[
              "Adresse email (identifiant de connexion)",
              "Nom et prénom (si renseigné)",
              "Nom de société (si renseigné)",
              "Date et heure de création du compte",
              "Type d'abonnement souscrit et dates de validité",
            ]} />
          </LegalSubSection>

          <LegalSubSection title="2.2 Données métier encodées par l'utilisateur">
            <p>Ces données sont saisies volontairement par l&apos;utilisateur :</p>
            <LegalList items={[
              "Lignes d'achats (prix, quantités, références, dates)",
              "Lignes de ventes (prix, marges, dates)",
              "Données de stock et d'inventaire",
              "Contacts (fournisseurs, clients) si renseignés",
              "Factures créées dans l'application",
            ]} />
            <p className="text-neutral-400 text-sm mt-2">
              Ces données appartiennent exclusivement à l&apos;utilisateur. Elles ne sont utilisées à aucune autre fin que le fonctionnement du service.
            </p>
          </LegalSubSection>

          <LegalSubSection title="2.3 Données de paiement">
            <p>
              Les transactions sont gérées par <strong className="text-neutral-100">Stripe</strong>.
              Kyrivo <strong className="text-neutral-100">ne stocke aucune donnée bancaire</strong> (carte, IBAN, etc.) sur ses propres serveurs.
              Stripe agit en qualité de sous-traitant indépendant et applique sa propre politique de sécurité (certification PCI-DSS).
            </p>
          </LegalSubSection>

          <LegalSubSection title="2.4 Données techniques et de session">
            <LegalList items={[
              "Tokens d'authentification (gérés par Supabase Auth, durée de vie : 1 heure pour le jeton d'accès, 7 jours pour le jeton de renouvellement)",
              "Compteurs d'utilisation (nombre de lignes consommées, quota restant)",
              "Journaux de connexion à des fins de sécurité",
            ]} />
          </LegalSubSection>

        </LegalSection>

        {/* ── 3. FINALITÉS ────────────────────────────────── */}
        <LegalSection title="3. Finalités du traitement">
          <div className="space-y-2.5 mt-1">
            {[
              { finalite: "Création et gestion des comptes utilisateurs", base: "Exécution du contrat" },
              { finalite: "Fourniture des fonctionnalités de l'application", base: "Exécution du contrat" },
              { finalite: "Gestion des abonnements et de la facturation", base: "Exécution du contrat" },
              { finalite: "Traitement des paiements via Stripe", base: "Exécution du contrat" },
              { finalite: "Sécurité, prévention des fraudes, journaux d'accès", base: "Intérêt légitime" },
              { finalite: "Emails transactionnels liés au compte (vérification, réinitialisation)", base: "Exécution du contrat" },
              { finalite: "Respect des obligations légales et comptables", base: "Obligation légale" },
            ].map(({ finalite, base }) => (
              <div key={finalite} className="bg-[#111111] border border-[#1e1e1e] rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                <p className="text-sm text-neutral-300 flex-1">{finalite}</p>
                <span className="text-[11px] font-medium text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-0.5 whitespace-nowrap self-start">
                  {base}
                </span>
              </div>
            ))}
          </div>
          <p className="text-neutral-400 text-sm mt-3">
            Kyrivo n&apos;utilise pas vos données à des fins publicitaires ou de marketing et ne les revend à aucun tiers.
          </p>
        </LegalSection>

        {/* ── 4. SOUS-TRAITANTS ────────────────────────────── */}
        <LegalSection title="4. Sous-traitants et transferts de données">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
            {[
              {
                name: "Supabase",
                role: "Base de données, authentification, emails d'authentification",
                info: "Supabase Inc. (USA). Infrastructure AWS — région variable (potentiellement EU ou USA). Transferts hors UE encadrés par les Clauses Contractuelles Types.",
              },
              {
                name: "Vercel",
                role: "Hébergement de l'application web, CDN",
                info: "Vercel Inc. (USA). Traite les logs techniques d'accès. Politique de confidentialité : vercel.com/legal/privacy-policy.",
              },
              {
                name: "Stripe",
                role: "Traitement sécurisé des paiements",
                info: "Stripe, Inc. (USA) / Stripe Payments Europe Ltd. Ne partage pas les données de carte avec Kyrivo. Certifié PCI-DSS.",
              },
            ].map(({ name, role, info }) => (
              <div key={name} className="bg-[#111111] border border-[#1e1e1e] rounded-xl p-4">
                <p className="text-sm font-semibold text-white mb-1">{name}</p>
                <p className="text-xs text-amber-400/80 mb-1.5">{role}</p>
                <p className="text-xs text-neutral-500 leading-relaxed">{info}</p>
              </div>
            ))}
          </div>
          <p className="text-neutral-400 text-sm mt-3">
            Ces sous-traitants sont soumis à des obligations contractuelles de confidentialité.
            Les transferts de données vers des pays tiers (USA) sont encadrés par les Clauses Contractuelles Types (CCT) de la Commission européenne, conformément à l&apos;article 46 du RGPD.
          </p>
        </LegalSection>

        {/* ── 5. DURÉE DE CONSERVATION ─────────────────────── */}
        <LegalSection title="5. Durée de conservation">
          <div className="space-y-2">
            {[
              {
                type: "Données de compte actif",
                duree: "Durée de l'abonnement actif",
                detail: "Conservées tant que le compte est actif.",
              },
              {
                type: "Données métier (achats, ventes, stock, factures)",
                duree: "Durée du compte actif + 30 jours après résiliation",
                detail: "Supprimées définitivement 30 jours après la clôture du compte, sauf demande anticipée.",
              },
              {
                type: "Données de facturation et de paiement",
                duree: "7 ans",
                detail: "Obligation légale belge (Code TVA, art. 60 et législation comptable). Ces données peuvent être limitées à un minimum nécessaire.",
              },
              {
                type: "Journaux de sécurité et de connexion",
                duree: "12 mois",
                detail: "Conformément au principe de minimisation des données du RGPD.",
              },
              {
                type: "Tokens de session",
                duree: "1 heure (accès) / 7 jours (renouvellement)",
                detail: "Gérés automatiquement par Supabase Auth.",
              },
            ].map(({ type, duree, detail }) => (
              <div key={type} className="bg-[#111111] border border-[#1e1e1e] rounded-xl px-4 py-3">
                <p className="text-sm text-neutral-200 font-medium">{type}</p>
                <p className="text-xs text-amber-400/80 mt-0.5">{duree}</p>
                {detail && <p className="text-xs text-neutral-500 mt-0.5">{detail}</p>}
              </div>
            ))}
          </div>
        </LegalSection>

        {/* ── 6. DROITS RGPD ────────────────────────────────── */}
        <LegalSection title="6. Vos droits (RGPD)">
          <p>Conformément au RGPD, vous disposez des droits suivants :</p>
          <LegalList items={[
            <><strong className="text-neutral-100">Accès</strong> — obtenir une copie des données vous concernant.</>,
            <><strong className="text-neutral-100">Rectification</strong> — corriger des données inexactes ou incomplètes.</>,
            <><strong className="text-neutral-100">Effacement</strong> — demander la suppression de vos données, sous réserve des obligations légales de conservation.</>,
            <><strong className="text-neutral-100">Opposition</strong> — vous opposer à un traitement fondé sur l&apos;intérêt légitime.</>,
            <><strong className="text-neutral-100">Limitation</strong> — demander la suspension temporaire d&apos;un traitement en cas de contestation.</>,
            <><strong className="text-neutral-100">Portabilité</strong> — recevoir vos données dans un format structuré et lisible par machine.</>,
            <><strong className="text-neutral-100">Réclamation</strong> — introduire une plainte auprès de l&apos;Autorité de protection des données belge (APD) : <span className="text-neutral-400">autoriteprotectiondonnees.be</span>.</>,
          ]} />
          <InfoCard>
            <p>
              <strong className="text-neutral-100">Pour exercer vos droits :</strong>{" "}
              <a href="mailto:contact@kartium-tcg.com" className="text-amber-400 hover:text-amber-300 transition-colors">
                contact@kartium-tcg.com
              </a>
            </p>
            <p className="text-neutral-400 text-sm mt-1">
              Réponse dans un délai maximum de 30 jours. Une preuve d&apos;identité pourra être demandée.
            </p>
          </InfoCard>
        </LegalSection>

        {/* ── 7. SÉCURITÉ ──────────────────────────────────── */}
        <LegalSection title="7. Sécurité des données">
          <p>
            Pierre Higny met en œuvre des mesures techniques et organisationnelles pour protéger les données contre tout accès non autorisé, perte ou altération.
            Ces mesures incluent notamment :
          </p>
          <LegalList items={[
            "Chiffrement des communications (HTTPS/TLS)",
            "Authentification sécurisée via Supabase Auth",
            "Accès à la base de données limité et contrôlé",
            "Données bancaires non stockées par Kyrivo (traitées exclusivement par Stripe)",
            "Infrastructure hébergée chez des prestataires reconnus (Vercel, Supabase)",
          ]} />
          <p className="text-neutral-400 text-sm mt-3">
            Aucune mesure de sécurité ne peut cependant garantir une protection absolue.
            En cas de violation de données susceptible d&apos;engendrer un risque pour vos droits et libertés,
            Pierre Higny s&apos;engage à vous en informer dans les délais prévus par le RGPD.
          </p>
        </LegalSection>

        {/* ── 8. MODIFICATIONS ─────────────────────────────── */}
        <LegalSection title="8. Modifications de la présente politique">
          <p>
            Cette politique peut être mise à jour pour refléter des évolutions du service ou de la réglementation.
            Toute modification substantielle sera communiquée par email ou notification dans l&apos;application.
          </p>
        </LegalSection>

      </div>
    </LegalPage>
  )
}
