// src/app/conditions-generales/page.tsx

import { Metadata } from "next"
import LegalPage, {
  LegalSection,
  LegalSubSection,
  InfoCard,
  LegalList,
} from "@/components/legal/LegalPage"

export const metadata: Metadata = {
  title: "Conditions générales — Kyrivo",
  description: "Conditions générales d'utilisation et de vente du service Kyrivo.",
}

export default function ConditionsGeneralesPage() {
  return (
    <LegalPage
      title="Conditions générales d'utilisation et de vente"
      subtitle="En créant un compte Kyrivo, vous acceptez les présentes conditions. Lisez-les attentivement."
      lastUpdated="mai 2026"
    >
      <div>

        {/* ── 1. OBJET ────────────────────────────────────── */}
        <LegalSection title="1. Objet et nature du service">
          <p>
            <strong className="text-neutral-100">Kyrivo</strong> est un logiciel de gestion en ligne (SaaS) destiné aux revendeurs de biens,
            accessible via <span className="text-neutral-200">kyrivo.kartium-tcg.com</span>.
            Il propose des fonctionnalités de suivi des achats, des ventes, du stock, de la facturation et du calcul de marges.
          </p>
          <p>
            Le service est édité par Pierre Higny, dont les coordonnées figurent dans les{" "}
            <a href="/mentions-legales" className="text-amber-400 hover:text-amber-300 transition-colors">Mentions légales</a>.
          </p>
          <InfoCard>
            <p className="font-medium text-neutral-100">Important — absence de conseil professionnel</p>
            <p className="text-neutral-400 mt-1">
              Kyrivo est un outil de gestion. Les données, calculs et résultats affichés par l&apos;application
              ne constituent en aucun cas un conseil fiscal, comptable, juridique ou financier.
              L&apos;utilisateur reste seul responsable de ses obligations déclaratives et fiscales.
              Il est fortement conseillé de faire vérifier ses déclarations par un professionnel compétent.
            </p>
          </InfoCard>
        </LegalSection>

        {/* ── 2. SERVICE FOURNI EN L'ÉTAT ─────────────────── */}
        <LegalSection title="2. Service fourni en l'état">
          <p>
            Kyrivo est fourni <strong className="text-neutral-100">en l&apos;état</strong>, sans garantie de résultat, de disponibilité continue, d&apos;exactitude des calculs,
            ni d&apos;absence d&apos;erreurs ou d&apos;interruptions.
          </p>
          <LegalList items={[
            "Le service peut subir des interruptions pour maintenance, incidents techniques ou causes indépendantes de la volonté de Pierre Higny.",
            "Des bugs ou comportements inattendus peuvent survenir ; ils seront corrigés dans les meilleurs délais, sans engagement de délai.",
            "Des pertes de données peuvent résulter de défaillances techniques indépendantes de Kyrivo (infrastructure Supabase, Vercel, etc.).",
            "Pierre Higny s'efforce de maintenir le service en ligne mais ne peut en garantir la disponibilité permanente.",
          ]} />
          <p>
            L&apos;utilisation du service implique l&apos;acceptation de ces limitations inhérentes à tout logiciel en ligne.
          </p>
        </LegalSection>

        {/* ── 3. CRÉATION DE COMPTE ───────────────────────── */}
        <LegalSection title="3. Création de compte et accès">
          <p>
            L&apos;accès aux fonctionnalités de Kyrivo nécessite la création d&apos;un compte avec une adresse email valide.
          </p>
          <LegalList items={[
            "L'utilisateur s'engage à fournir des informations exactes et à les maintenir à jour.",
            "Chaque compte est strictement personnel et ne peut être partagé ou cédé.",
            "L'utilisateur est responsable de la confidentialité de ses identifiants.",
            "Pierre Higny se réserve le droit de suspendre ou supprimer tout compte en cas d'utilisation contraire aux présentes conditions.",
          ]} />
        </LegalSection>

        {/* ── 4. ESSAI GRATUIT ────────────────────────────── */}
        <LegalSection title="4. Essai gratuit (Trial)">
          <p>
            Tout nouveau compte bénéficie automatiquement d&apos;une période d&apos;essai gratuite de{" "}
            <strong className="text-neutral-100">7 jours</strong> avec accès complet aux fonctionnalités de création.
          </p>
          <InfoCard>
            <p><strong className="text-neutral-100">Durée :</strong> 7 jours à compter de la création du compte</p>
            <p><strong className="text-neutral-100">Quota :</strong> 125 lignes d&apos;opérations</p>
            <p><strong className="text-neutral-100">Paiement :</strong> Aucune carte bancaire requise pour démarrer l&apos;essai</p>
          </InfoCard>
          <p>
            À l&apos;issue de la période d&apos;essai, sans souscription d&apos;un abonnement payant, le compte passe en mode gratuit (lecture seule uniquement).
          </p>
        </LegalSection>

        {/* ── 5. ABONNEMENTS ──────────────────────────────── */}
        <LegalSection title="5. Abonnements et quotas">
          <p>
            Kyrivo propose plusieurs formules d&apos;abonnement.
            Le quota de lignes se remet à zéro chaque mois calendaire, quelle que soit la formule.
            Les lignes non utilisées ne sont pas reportées.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {[
              {
                plan: "Free",
                subtitle: "Sans abonnement",
                quota: "Lecture seule",
                detail: "Consultation des données autorisée. Création d'achats et de ventes bloquée.",
              },
              {
                plan: "Trial",
                subtitle: "Essai 7 jours",
                quota: "125 lignes / mois",
                detail: "Accès complet pendant 7 jours. Activé automatiquement à l'inscription.",
              },
              {
                plan: "Pro",
                subtitle: "Abonnement payant",
                quota: "500 lignes / mois",
                detail: "Pour les revendeurs individuels actifs.",
              },
              {
                plan: "Business",
                subtitle: "Abonnement payant",
                quota: "5 000 lignes / mois",
                detail: "Pour les volumes plus importants.",
              },
              {
                plan: "Entreprise",
                subtitle: "Abonnement payant",
                quota: "50 000 lignes / mois",
                detail: "Pour les structures à fort volume d'opérations.",
              },
            ].map(({ plan, subtitle, quota, detail }) => (
              <div key={plan} className="bg-[#111111] border border-[#1e1e1e] rounded-xl p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-white">{plan}</span>
                  <span className="text-[11px] text-neutral-500">{subtitle}</span>
                </div>
                <p className="text-xs font-medium text-amber-400 mb-1.5">{quota}</p>
                <p className="text-xs text-neutral-400 leading-relaxed">{detail}</p>
              </div>
            ))}
          </div>

          <LegalSubSection title="5.1 Durée et renouvellement">
            <p>Les abonnements sont disponibles en formule mensuelle (1 mois) ou trimestrielle (3 mois).</p>
            <LegalList items={[
              "Les abonnements trimestriels sont prépayés pour 3 mois complets.",
              "Le quota de lignes reste mensuel même pour les abonnements trimestriels : il se renouvelle chaque mois calendaire.",
              "Les abonnements se renouvellent automatiquement sauf résiliation explicite avant la date d'échéance.",
            ]} />
          </LegalSubSection>

          <LegalSubSection title="5.2 Upgrade et downgrade">
            <LegalList items={[
              "L'upgrade (passage à une formule supérieure) est disponible à tout moment depuis la page Abonnements.",
              "Le downgrade (passage à une formule inférieure) n'est pas disponible en libre-service pour le moment. Contactez contact@kartium-tcg.com.",
            ]} />
          </LegalSubSection>

          <LegalSubSection title="5.3 Dépassement de quota">
            <p>
              Lorsque le quota mensuel est atteint, la création de nouvelles lignes est bloquée jusqu&apos;au début du mois suivant ou jusqu&apos;à upgrade.
              La consultation des données existantes reste accessible.
            </p>
          </LegalSubSection>
        </LegalSection>

        {/* ── 6. PAIEMENT ─────────────────────────────────── */}
        <LegalSection title="6. Paiement">
          <p>
            Les paiements sont traités via <strong className="text-neutral-100">Stripe</strong>.
            Kyrivo ne stocke aucune donnée bancaire sur ses serveurs.
          </p>
          <LegalList items={[
            "Les prix sont en euros (€), toutes taxes comprises.",
            "Le paiement est prélevé au moment de la souscription ou du renouvellement.",
            "En cas d'échec de paiement, l'accès aux fonctionnalités payantes peut être suspendu.",
            "Les tarifs peuvent évoluer. Les utilisateurs seront informés avant tout changement tarifaire.",
          ]} />
        </LegalSection>

        {/* ── 7. RESPONSABILITÉS ──────────────────────────── */}
        <LegalSection title="7. Responsabilités">
          <LegalSubSection title="7.1 Responsabilité de l'utilisateur">
            <LegalList items={[
              "L'utilisateur est seul responsable des données qu'il encode (exactitude, légalité, conformité fiscale).",
              "L'utilisateur s'engage à ne pas utiliser le service à des fins illicites.",
              "Les résultats produits par Kyrivo ne remplacent pas l'avis d'un expert-comptable ou conseiller fiscal.",
            ]} />
          </LegalSubSection>

          <LegalSubSection title="7.2 Responsabilité de Pierre Higny">
            <p>
              Pierre Higny s&apos;engage à mettre en œuvre les moyens raisonnables pour assurer le bon fonctionnement du service.
              Il ne peut toutefois être tenu responsable :
            </p>
            <LegalList items={[
              "Des erreurs, omissions ou inexactitudes dans les données encodées par l'utilisateur.",
              "Des interruptions, bugs, pertes de données ou dysfonctionnements liés aux infrastructures tierces (Supabase, Vercel, Stripe, réseau internet).",
              "Des conséquences fiscales, comptables ou juridiques découlant de l'utilisation des résultats de l'application.",
              "De tout préjudice indirect, immatériel ou consécutif résultant de l'utilisation ou de l'impossibilité d'utiliser le service.",
            ]} />
            <p className="mt-2">
              Dans les cas où la responsabilité de Pierre Higny serait engagée, elle serait limitée au montant des sommes effectivement versées par l&apos;utilisateur au cours des <strong className="text-neutral-200">3 derniers mois</strong>.
            </p>
          </LegalSubSection>
        </LegalSection>

        {/* ── 8. RÉSILIATION ──────────────────────────────── */}
        <LegalSection title="8. Résiliation et suppression du compte">
          <LegalSubSection title="8.1 Résiliation par l'utilisateur">
            <p>
              L&apos;utilisateur peut résilier son abonnement à tout moment depuis la page Abonnements ou en contactant{" "}
              <a href="mailto:contact@kartium-tcg.com" className="text-amber-400 hover:text-amber-300 transition-colors">
                contact@kartium-tcg.com
              </a>.
            </p>
            <p>
              La résiliation prend effet à la fin de la période en cours déjà payée.
              Aucun remboursement n&apos;est effectué pour la période restante, sauf disposition légale impérative contraire.
            </p>
          </LegalSubSection>

          <LegalSubSection title="8.2 Résiliation par Kyrivo">
            <p>Pierre Higny peut suspendre ou résilier un compte en cas de non-paiement, violation des présentes conditions ou usage frauduleux.</p>
          </LegalSubSection>

          <LegalSubSection title="8.3 Conservation des données après résiliation">
            <p>
              Après résiliation ou clôture d&apos;un compte, les données sont conservées pendant <strong className="text-neutral-200">30 jours</strong> avant suppression définitive,
              sauf demande anticipée de l&apos;utilisateur ou obligation légale de conservation plus longue.
            </p>
            <p>
              Pierre Higny ne peut garantir l&apos;absence de perte de données dans ce délai en cas de défaillance technique.
              Il est recommandé à l&apos;utilisateur d&apos;exporter ses données avant résiliation.
            </p>
          </LegalSubSection>
        </LegalSection>

        {/* ── 9. DROIT APPLICABLE ─────────────────────────── */}
        <LegalSection title="9. Droit applicable et juridiction">
          <p>
            Les présentes conditions sont soumises au <strong className="text-neutral-100">droit belge</strong>.
          </p>
          <p>
            En cas de litige, les parties s&apos;efforceront de trouver une solution amiable.
            À défaut, le litige sera soumis à la compétence exclusive du{" "}
            <strong className="text-neutral-100">Tribunal de l&apos;entreprise de Liège, division Liège</strong>.
          </p>
        </LegalSection>

        {/* ── 10. MODIFICATIONS ───────────────────────────── */}
        <LegalSection title="10. Modification des conditions">
          <p>
            Pierre Higny se réserve le droit de modifier les présentes conditions à tout moment.
            Les utilisateurs seront informés de toute modification substantielle par email ou notification dans l&apos;application.
            La poursuite de l&apos;utilisation du service après notification vaut acceptation des nouvelles conditions.
          </p>
        </LegalSection>

      </div>
    </LegalPage>
  )
}
