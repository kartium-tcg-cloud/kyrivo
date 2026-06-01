// src/app/cookies/page.tsx

import { Metadata } from "next"
import LegalPage, {
  LegalSection,
  LegalSubSection,
  InfoCard,
  LegalList,
} from "@/components/legal/LegalPage"

export const metadata: Metadata = {
  title: "Politique relative aux cookies — Kyrivo",
  description: "Informations sur les cookies utilisés par Kyrivo et comment les gérer.",
}

export default function CookiesPage() {
  return (
    <LegalPage
      title="Politique relative aux cookies"
      subtitle="Informations sur les cookies et technologies similaires utilisés par Kyrivo."
      lastUpdated="juin 2026"
    >
      <div>

        <LegalSection title="1. Qu'est-ce qu'un cookie ?">
          <p>
            Un cookie est un petit fichier texte déposé sur votre appareil lors de la visite d&apos;un site ou de l&apos;utilisation d&apos;une application web.
            Il permet notamment de maintenir une session de connexion active.
          </p>
        </LegalSection>

        <LegalSection title="2. Cookies utilisés par Kyrivo">

          <LegalSubSection title="2.1 Cookies d'authentification Supabase (indispensables)">
            <p>
              Ces cookies sont utilisés par <strong className="text-neutral-100">Supabase Auth</strong> pour gérer votre connexion.
              Sans eux, il est impossible de se connecter et d&apos;utiliser le service.
            </p>
            <InfoCard>
              <p><strong className="text-neutral-100">Origine :</strong> Supabase Inc.</p>
              <p><strong className="text-neutral-100">Finalité :</strong> Maintien de la session utilisateur authentifiée</p>
              <p><strong className="text-neutral-100">Durée :</strong> Jeton d&apos;accès : 1 heure — Jeton de renouvellement : 7 jours</p>
              <p><strong className="text-neutral-100">Base légale :</strong> Strictement nécessaires — pas de consentement requis</p>
            </InfoCard>
            <p className="text-neutral-400 text-sm mt-2">
              Ces cookies incluent notamment les jetons d&apos;authentification stockés dans le navigateur (localStorage ou cookies httpOnly selon la configuration Supabase).
            </p>
          </LegalSubSection>

          <LegalSubSection title="2.2 Cookies liés au paiement Stripe">
            <p>
              Lors du processus de paiement, <strong className="text-neutral-100">Stripe</strong> peut déposer des cookies nécessaires à la sécurisation des transactions.
            </p>
            <InfoCard>
              <p><strong className="text-neutral-100">Origine :</strong> Stripe, Inc.</p>
              <p><strong className="text-neutral-100">Finalité :</strong> Sécurisation du paiement, prévention de la fraude</p>
              <p><strong className="text-neutral-100">Base légale :</strong> Exécution du contrat (paiement de l&apos;abonnement)</p>
            </InfoCard>
            <p className="text-neutral-400 text-sm mt-2">
              Ces cookies ne sont actifs que lors du processus de paiement.
            </p>
          </LegalSubSection>

          <LegalSubSection title="2.3 Cookies d'analyse">
            <InfoCard>
              <p className="text-sm">
                Kyrivo <strong className="text-neutral-100">n&apos;utilise pas d&apos;outil d&apos;analyse de trafic</strong> (Google Analytics, Plausible, etc.).
                Aucun cookie de statistiques n&apos;est déposé.
              </p>
            </InfoCard>
          </LegalSubSection>

          <LegalSubSection title="2.4 Cookies publicitaires — Meta Pixel">
            <p>
              Kyrivo utilise le <strong className="text-neutral-100">Meta Pixel</strong> (fourni par Meta Platforms Ireland Ltd) pour mesurer l&apos;efficacité de ses campagnes publicitaires sur Facebook et Instagram.
              Ce cookie n&apos;est déposé <strong className="text-neutral-100">qu&apos;après votre consentement explicite</strong> via le bandeau qui s&apos;affiche lors de votre première visite.
            </p>
            <InfoCard>
              <p><strong className="text-neutral-100">Origine :</strong> Meta Platforms Ireland Ltd</p>
              <p><strong className="text-neutral-100">Finalité :</strong> Mesure des conversions publicitaires, optimisation des campagnes, audiences personnalisées</p>
              <p><strong className="text-neutral-100">Données collectées :</strong> Pages visitées, actions effectuées (inscription, visite page tarifs), adresse IP anonymisée</p>
              <p><strong className="text-neutral-100">Durée :</strong> Jusqu&apos;à 90 jours</p>
              <p><strong className="text-neutral-100">Base légale :</strong> Consentement (article 6.1.a RGPD)</p>
              <p><strong className="text-neutral-100">Transfert hors UE :</strong> Oui — vers les serveurs de Meta aux États-Unis, encadré par les clauses contractuelles types</p>
            </InfoCard>
            <p className="text-neutral-400 text-sm mt-2">
              Vous pouvez retirer votre consentement à tout moment en supprimant les données de ce site dans les paramètres de votre navigateur ou en contactant{" "}
              <a href="mailto:contact@kartium-tcg.com" className="text-amber-400 hover:text-amber-300 transition-colors">
                contact@kartium-tcg.com
              </a>.
            </p>
          </LegalSubSection>

        </LegalSection>

        <LegalSection title="3. Pourquoi les cookies d'authentification sont obligatoires">
          <p>
            Kyrivo est un SaaS (service en ligne) qui nécessite une connexion utilisateur authentifiée pour fonctionner.
            Les cookies de session Supabase sont <strong className="text-neutral-100">strictement indispensables</strong> à cette authentification.
          </p>
          <p>
            Conformément à la réglementation applicable (directive ePrivacy et RGPD), les cookies strictement nécessaires au fonctionnement d&apos;un service demandé par l&apos;utilisateur ne requièrent pas de consentement préalable.
          </p>
          <p>
            Si vous refusez ces cookies via les paramètres de votre navigateur, il vous sera impossible de vous connecter à Kyrivo.
          </p>
        </LegalSection>

        <LegalSection title="4. Gestion des cookies via votre navigateur">
          <p>
            Vous pouvez à tout moment configurer votre navigateur pour refuser ou supprimer les cookies.
          </p>
          <LegalList items={[
            "Google Chrome : Paramètres → Confidentialité et sécurité → Cookies et autres données des sites",
            "Mozilla Firefox : Paramètres → Vie privée et sécurité → Cookies et données du site",
            "Safari : Préférences → Confidentialité → Gérer les données du site web",
            "Microsoft Edge : Paramètres → Cookies et autorisations des sites",
          ]} />
          <p className="text-neutral-400 text-sm mt-3">
            Notez que la suppression des cookies de session vous déconnectera de Kyrivo.
          </p>
        </LegalSection>

        <LegalSection title="5. Contact">
          <InfoCard>
            <p>Pour toute question relative à cette politique de cookies :</p>
            <p>
              <strong className="text-neutral-100">Email :</strong>{" "}
              <a href="mailto:contact@kartium-tcg.com" className="text-amber-400 hover:text-amber-300 transition-colors">
                contact@kartium-tcg.com
              </a>
            </p>
          </InfoCard>
        </LegalSection>

      </div>
    </LegalPage>
  )
}
