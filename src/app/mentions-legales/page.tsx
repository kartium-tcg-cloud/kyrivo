// src/app/mentions-legales/page.tsx

import { Metadata } from "next"
import LegalPage, {
  LegalSection,
  InfoCard,
} from "@/components/legal/LegalPage"

export const metadata: Metadata = {
  title: "Mentions légales — Kyrivo",
  description: "Informations légales relatives à l'éditeur et au fonctionnement du site Kyrivo.",
}

export default function MentionsLegalesPage() {
  return (
    <LegalPage
      title="Mentions légales"
      subtitle="Conformément à la législation belge et aux usages en vigueur pour les services en ligne."
      lastUpdated="mai 2026"
    >
      <div>

        <LegalSection title="1. Éditeur du site">
          <InfoCard>
            <p><strong className="text-neutral-100">Exploitant :</strong> Higny, Pierre</p>
            <p><strong className="text-neutral-100">Statut :</strong> Personne physique exerçant une activité indépendante</p>
            <p><strong className="text-neutral-100">Adresse :</strong> Monteux 6, 4990 Lierneux, Belgique</p>
            <p><strong className="text-neutral-100">Numéro BCE :</strong> 1035.062.749</p>
            <p>
              <strong className="text-neutral-100">Email :</strong>{" "}
              <a href="mailto:contact@kartium-tcg.com" className="text-amber-400 hover:text-amber-300 transition-colors">
                contact@kartium-tcg.com
              </a>
            </p>
          </InfoCard>
        </LegalSection>

        <LegalSection title="2. Responsable de publication">
          <p>
            Le responsable de la publication du site <strong className="text-neutral-100">kyrivo.fr</strong> est Pierre Higny, exploitant du service Kyrivo.
          </p>
          <InfoCard>
            <p>Pierre Higny — contact@kartium-tcg.com</p>
          </InfoCard>
        </LegalSection>

        <LegalSection title="3. Hébergement">
          <p>L&apos;application web Kyrivo est hébergée par :</p>
          <InfoCard>
            <p><strong className="text-neutral-100">Hébergeur :</strong> Vercel Inc.</p>
            <p><strong className="text-neutral-100">Adresse :</strong> 340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis</p>
            <p><strong className="text-neutral-100">Site :</strong> vercel.com</p>
          </InfoCard>
          <p className="text-neutral-400 text-sm mt-3">
            La base de données et les données utilisateurs sont gérées via <strong className="text-neutral-300">Supabase</strong> (Supabase Inc., San Francisco, USA), sur une infrastructure AWS dont la région géographique peut varier.
            Les données peuvent être hébergées dans l&apos;Union européenne ou aux États-Unis.
            Les transferts de données hors Union européenne sont encadrés par les Clauses Contractuelles Types de la Commission européenne.
          </p>
        </LegalSection>

        <LegalSection title="4. Propriété intellectuelle">
          <p>
            Le nom <strong className="text-neutral-100">Kyrivo</strong>, le logo, la charte graphique et les contenus originaux du site sont la propriété de Pierre Higny, protégés par le droit belge de la propriété intellectuelle.
          </p>
          <p>
            Toute reproduction, même partielle, sans autorisation préalable et écrite est interdite.
          </p>
          <p>
            Les données encodées par les utilisateurs dans l&apos;application (achats, ventes, stocks, contacts, factures) restent la propriété exclusive de l&apos;utilisateur. Pierre Higny n&apos;en revendique aucun droit.
          </p>
        </LegalSection>

        <LegalSection title="5. Limitation de responsabilité">
          <p>
            Kyrivo est un outil de gestion à destination des revendeurs. Les informations et calculs produits par l&apos;application <strong className="text-neutral-100">ne constituent en aucun cas un conseil fiscal, comptable ou juridique</strong>.
            L&apos;utilisateur reste seul responsable de ses obligations déclaratives, fiscales et légales.
          </p>
          <p>
            Le service est fourni <strong className="text-neutral-100">en l&apos;état</strong>, sans garantie de résultat, de disponibilité continue, d&apos;absence d&apos;erreurs ou de bug.
            Pierre Higny décline toute responsabilité pour les dysfonctionnements, interruptions, pertes de données ou accès non autorisés résultant de causes indépendantes de sa volonté, notamment les défaillances des infrastructures tierces (Vercel, Supabase, Stripe).
          </p>
          <p>
            Pierre Higny ne garantit pas que le service sera exempt d&apos;erreurs ou d&apos;interruptions. Des indisponibilités peuvent survenir sans préavis.
          </p>
        </LegalSection>

        <LegalSection title="6. Droit applicable et juridiction">
          <p>
            Les présentes mentions légales sont soumises au <strong className="text-neutral-100">droit belge</strong>.
          </p>
          <p>
            En cas de litige, les parties s&apos;efforceront de trouver une solution amiable.
            À défaut, les litiges relèveront de la compétence exclusive du{" "}
            <strong className="text-neutral-100">Tribunal de l&apos;entreprise de Liège, division Liège</strong>.
          </p>
        </LegalSection>

        <LegalSection title="7. Contact">
          <InfoCard>
            <p>Pour toute question relative aux présentes mentions légales :</p>
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
