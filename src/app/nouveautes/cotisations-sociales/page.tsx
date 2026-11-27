import type { Metadata } from "next";
import Link from "next/link";
import { newsCategoryStyles } from "@/lib/news";

const CANONICAL = "https://kyrivo.fr/nouveautes/cotisations-sociales";
const DATE_ISO = "2026-11-27";

export const metadata: Metadata = {
  title: "Cotisations sociales et liste des ventes simplifiée — Kyrivo",
  description: "Suivez vos cotisations sociales estimées, votre chiffre d'affaires après cotisations et vos marges, puis identifiez vos articles vendus dans la liste des ventes.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Kyrivo : cotisations sociales facultatives et ventes plus lisibles",
    description: "Un taux de cotisations paramétrable, sans toucher à la TVA, et des articles visibles dans la liste des ventes.",
    url: CANONICAL,
    type: "article",
    publishedTime: DATE_ISO,
  },
};

export default function SocialContributionsNewsPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "Cotisations sociales et suivi des ventes : Kyrivo se simplifie",
    datePublished: DATE_ISO,
    dateModified: DATE_ISO,
    inLanguage: "fr",
    author: { "@type": "Organization", name: "Équipe Kyrivo" },
    publisher: { "@type": "Organization", name: "Kartium TCG", url: "https://kyrivo.fr" },
    mainEntityOfPage: CANONICAL,
  };
  return (
    <main className="ky-marketing mx-auto w-full max-w-5xl px-5 pb-20 pt-9 sm:px-8 lg:pt-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <nav aria-label="Fil d'Ariane" className="mb-8 text-sm text-neutral-400">
        <Link href="/nouveautes" className="hover:text-blue-300">Nouveautés</Link>
        <span aria-hidden="true" className="mx-2 text-neutral-600">/</span>
        <span aria-current="page" className="text-neutral-200">Cotisations sociales et ventes</span>
      </nav>
      <article className="space-y-9">
        <header className="border-b border-neutral-800 pb-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-lg border px-3 py-1 text-xs font-bold ${newsCategoryStyles["Mises à jour"].badge}`}>Mises à jour</span>
            <time dateTime={DATE_ISO} className="text-sm text-neutral-400">27 novembre 2026</time>
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">Cotisations sociales et suivi des ventes : Kyrivo se simplifie</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-neutral-300">
            À la suite de vos retours, Kyrivo permet d'estimer des cotisations sociales indépendamment de la TVA
            et d'identifier les articles vendus dès l'ouverture de la liste des ventes.
          </p>
        </header>
        <section className="ky-panel rounded-xl border border-neutral-800 p-5 sm:p-7">
          <h2 className="text-xl font-semibold text-white">Un taux facultatif, maîtrisé par l'utilisateur</h2>
          <p className="mt-3 text-sm leading-7 text-neutral-300">
            Dans <Link href="/preferences" className="text-blue-300 underline underline-offset-4">Préférences</Link>,
            vous pouvez laisser le taux de cotisations vide ou indiquer un pourcentage proposé par défaut aux nouvelles ventes.
            Chaque vente peut ensuite utiliser son propre taux, conservé dans l'historique.
            La TVA par défaut et la TVA de chaque article restent indépendantes.
          </p>
          <p className="mt-3 text-sm leading-7 text-neutral-300">
            Les anciennes ventes ne reçoivent aucun taux automatiquement. Les estimations ne modifient ni les factures,
            ni les prix TTC, ni le montant de TVA.
          </p>
        </section>
        <section className="ky-panel rounded-xl border border-neutral-800 p-5 sm:p-7">
          <h2 className="text-xl font-semibold text-white">Chiffre d'affaires et marge après cotisations</h2>
          <p className="mt-3 text-sm leading-7 text-neutral-300">
            Dans <Link href="/ventes" className="text-blue-300 underline underline-offset-4">Ventes</Link> et le tableau de bord,
            retrouvez le chiffre d'affaires hors TVA, le montant des cotisations estimées et le chiffre d'affaires après cotisations.
            Une estimation de la marge après cotisations est également disponible, sous réserve que les coûts d'achat soient renseignés.
            Les nouveaux indicateurs figurent aussi dans l'export Excel des ventes.
          </p>
          <div className="mt-5 rounded-lg border border-blue-500/25 bg-blue-500/[0.05] p-4 text-sm text-neutral-300">
            Exemple : 100 € de chiffre d'affaires HT, avec un taux saisi de 12,3 %, représentent 12,30 € de cotisations estimées
            et 87,70 € de CA HT après cotisations. Le taux de 12,3 % est un exemple, jamais imposé par Kyrivo.
          </div>
        </section>
        <section className="ky-panel rounded-xl border border-neutral-800 p-5 sm:p-7">
          <h2 className="text-xl font-semibold text-white">Retrouvez immédiatement les produits vendus</h2>
          <p className="mt-3 text-sm leading-7 text-neutral-300">
            La liste des ventes affiche maintenant le nom et la référence du premier article sous le nom du client.
            Une vente comprenant plusieurs lignes indique le nombre d'articles supplémentaires :
            le détail reste accessible d'un clic, sans élargir inutilement le tableau sur mobile.
          </p>
        </section>
        <aside className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-5 text-sm leading-7 text-neutral-300">
          <strong className="text-amber-200">Important :</strong> les cotisations sont des estimations basées sur les ventes enregistrées,
          pas sur les encaissements vérifiés. Kyrivo ne constitue pas un outil de déclaration URSSAF et ne remplace pas les justificatifs
          ou les conseils d'un professionnel.
        </aside>
        <footer className="flex flex-wrap gap-3 border-t border-neutral-800 pt-7">
          <Link href="/nouveautes" className="ky-button-secondary rounded-lg border border-neutral-700 px-5 py-3 text-sm font-semibold">Toutes les nouveautés</Link>
          <Link href="/ventes" className="ky-button-primary rounded-lg bg-amber-500 px-5 py-3 text-sm font-semibold text-neutral-950">Découvrir mes ventes</Link>
        </footer>
      </article>
    </main>
  );
}
