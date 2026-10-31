import type { Metadata } from "next";
import Link from "next/link";
import { newsCategoryStyles } from "@/lib/news";

const CANONICAL = "https://kyrivo.fr/nouveautes/import-vinted";
const DATE_ISO = "2026-10-25";

export const metadata: Metadata = {
  title: "Import Vinted bêta : guide pour vos achats et ventes",
  description:
    "Découvrez l'import Vinted de Kyrivo en version bêta : quels emails copier-coller pour vos achats et ventes, comment vérifier les opérations et signaler un bug.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "L'import Vinted arrive sur Kyrivo — Guide de la bêta",
    description: "Un nouvel outil pour préremplir vos achats et ventes Vinted à partir des emails de transaction. Tutoriel, limites de la bêta et contact.",
    url: CANONICAL,
    type: "article",
    publishedTime: DATE_ISO,
    images: ["/brand/kyrivo-hero-marketing-2400.png"],
  },
};

const steps = [
  {
    number: "01",
    title: "Retrouvez l'email de votre transaction",
    body: "Dans votre boîte de réception, ouvrez le mail Vinted correspondant à votre achat ou à votre vente. Utilisez bien le bon type de message indiqué ci-dessous.",
  },
  {
    number: "02",
    title: "Copiez-collez le contenu complet",
    body: "Copiez tout le texte de l'email (et pas seulement son objet), puis collez-le dans le champ sur la page d'import. Vous pouvez aussi charger un email enregistré au format .eml, .txt, .html ou .md. Pour plusieurs mails collés, séparez-les par une ligne contenant uniquement ---.",
  },
  {
    number: "03",
    title: "Ouvrez chaque transaction détectée",
    body: "Kyrivo reconnaît les achats et les ventes et prépare une liste à examiner. Ouvrez une opération pour accéder au formulaire habituel, avec les informations extraites préremplies.",
  },
  {
    number: "04",
    title: "Vérifiez, corrigez et enregistrez",
    body: "Relisez la date, le nom de l'article, les prix, la TVA et les frais avant de valider. Pour une vente, indiquez si les articles sont présents dans votre stock Kyrivo, puis sélectionnez les articles et les quantités si nécessaire. Chaque transaction doit être enregistrée manuellement.",
  },
];

export default function VintedBetaNewsPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "L'import Vinted arrive sur Kyrivo, en version bêta",
    description: "Guide d'utilisation de l'import Vinted pour les achats et les ventes, à partir des emails de transaction.",
    datePublished: DATE_ISO,
    dateModified: DATE_ISO,
    inLanguage: "fr",
    author: { "@type": "Organization", name: "Équipe Kyrivo" },
    publisher: { "@type": "Organization", name: "Kartium TCG", url: "https://kyrivo.fr" },
    mainEntityOfPage: CANONICAL,
  };

  return (
    <main className="ky-marketing mx-auto w-full max-w-5xl px-5 pb-20 pt-9 sm:px-8 lg:pt-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <nav aria-label="Fil d’Ariane" className="mb-8 text-sm text-neutral-400">
        <Link className="hover:text-amber-300" href="/nouveautes">Nouveautés</Link>
        <span aria-hidden="true" className="mx-2 text-neutral-600">/</span>
        <span aria-current="page" className="text-neutral-200">Import Vinted</span>
      </nav>

      <article className="space-y-10">
        <header className="border-b border-neutral-800/90 pb-9">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className={`rounded-md border px-2.5 py-1 text-xs font-bold ${newsCategoryStyles["Actualité"].badge}`}>
              Actualité
            </span>
            <span className="rounded-md border border-amber-500/30 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-200">
              Bêta
            </span>
            <time dateTime={DATE_ISO} className="text-sm text-neutral-400">
              25 octobre 2026
            </time>
          </div>
          <h1 className="mt-5 max-w-4xl text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            L&apos;import Vinted arrive sur Kyrivo
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-neutral-300 sm:text-lg">
            Vous achetez ou vendez sur Vinted ? Kyrivo peut désormais préparer vos opérations à partir
            des emails envoyés par Vinted. L&apos;objectif : vous éviter de recopier chaque information
            à la main, tout en vous laissant vérifier et modifier les données avant de les enregistrer.
          </p>
          <p className="mt-3 text-sm font-medium text-amber-300">
            Ce nouvel outil est disponible en version bêta : il est encore en développement.
          </p>
        </header>

        <section aria-labelledby="emails-vinted">
          <h2 id="emails-vinted" className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Quels emails Vinted utiliser ?
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-300">
            Pour le moment, l&apos;import est conçu pour <strong className="text-white">deux types d&apos;emails précis</strong>.
            Retrouvez le message correspondant dans votre messagerie, ouvrez-le et copiez son contenu entier.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="ky-panel rounded-xl border border-blue-500/25 bg-neutral-900/40 p-5 sm:p-6">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-300">Pour les achats</div>
              <h3 className="mt-3 text-xl font-semibold text-white">« Ton reçu pour la commande »</h3>
              <p className="mt-3 text-sm leading-7 text-neutral-300">
                C&apos;est l&apos;email de reçu envoyé par Vinted après un achat. Kyrivo tente d&apos;en extraire
                le vendeur, les articles, le prix, la livraison, les frais Vinted et le montant total payé.
              </p>
            </div>
            <div className="ky-panel rounded-xl border border-emerald-500/25 bg-neutral-900/40 p-5 sm:p-6">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-300">Pour les ventes</div>
              <h3 className="mt-3 text-xl font-semibold text-white">« Ton article s&apos;est vendu ! »</h3>
              <p className="mt-3 text-sm leading-7 text-neutral-300">
                C&apos;est l&apos;email qui annonce la vente d&apos;un de vos articles. Kyrivo essaie
                d&apos;en récupérer le titre, l&apos;acheteur et le prix annoncé pour préparer votre vente.
              </p>
            </div>
          </div>
          <p className="mt-4 rounded-lg border border-neutral-800 bg-neutral-900/40 px-4 py-3 text-sm leading-6 text-neutral-300">
            Important : <strong className="text-white">ne copiez pas seulement l&apos;objet du mail</strong>.
            Sélectionnez le contenu du message complet pour que Kyrivo ait les informations nécessaires.
          </p>
        </section>

        <section aria-labelledby="guide-vinted">
          <h2 id="guide-vinted" className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Comment utiliser l&apos;outil ?
          </h2>
          <div className="mt-5 grid gap-3">
            {steps.map(step => (
              <div key={step.number} className="ky-panel flex flex-col gap-3 rounded-xl border border-neutral-800 bg-neutral-900/35 p-5 sm:flex-row sm:gap-5 sm:p-6">
                <span aria-hidden="true" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-500/25 bg-amber-500/10 text-xs font-bold text-amber-300">
                  {step.number}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-neutral-300">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
          <Link href="/import-vinted"
            className="ky-button-primary mt-6 inline-flex items-center justify-center rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-neutral-950 transition-colors hover:bg-amber-400">
            Accéder à l&apos;import Vinted
          </Link>
          <p className="mt-2 text-xs text-neutral-500">Connexion à un compte Kyrivo nécessaire pour enregistrer vos opérations.</p>
        </section>

        <section aria-labelledby="version-beta" className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-5 sm:p-7">
          <h2 id="version-beta" className="text-xl font-semibold text-white sm:text-2xl">
            Une première version, encore en développement
          </h2>
          <div className="mt-3 space-y-3 text-sm leading-7 text-neutral-300">
            <p>
              Les formats d&apos;emails peuvent varier : certains champs peuvent être incomplets ou mal reconnus.
              C&apos;est pourquoi rien n&apos;est ajouté automatiquement à vos achats ou ventes.
              <strong className="text-white"> Vérifiez chaque opération avant de l&apos;enregistrer.</strong>
            </p>
            <p>
              Pour les achats de plusieurs articles, contrôlez les prix répartis entre les lignes.
              Pour les ventes, la présence en stock et le régime de TVA restent à déterminer par l&apos;utilisateur.
              L&apos;email « Ton article s&apos;est vendu ! » annonce une vente, mais ne prouve pas à lui seul
              que le paiement final a été libéré.
            </p>
            <p>
              Pour l&apos;instant, les PDF et les captures d&apos;écran ne sont pas pris en charge.
              Les annulations et les remboursements continuent de se gérer manuellement dans Kyrivo.
              La connexion automatique au compte Vinted n&apos;est pas proposée.
            </p>
          </div>
        </section>

        <footer className="border-t border-neutral-800 pt-9">
          <h2 className="text-xl font-semibold text-white">Un bug, une difficulté ou une suggestion ?</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-300">
            Cette bêta va évoluer grâce aux retours des utilisateurs. Un montant mal identifié,
            un email qui ne fonctionne pas, une étape peu claire ou une idée d&apos;amélioration ?
            Tout retour est apprécié. Écrivez-nous à{" "}
            <a href="mailto:contact@kartium-tcg.com?subject=Retour%20import%20Vinted%20b%C3%AAta"
              className="font-semibold text-amber-300 underline underline-offset-4 hover:text-amber-200">
              contact@kartium-tcg.com
            </a>.
          </p>
          <p className="mt-2 text-xs leading-5 text-neutral-500">
            Si vous signalez un bug, indiquez la page concernée et ce qui s&apos;est produit.
            Évitez d&apos;envoyer des informations personnelles d&apos;acheteurs ou de vendeurs.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/nouveautes" className="ky-button-secondary inline-flex items-center rounded-xl border border-neutral-700 px-5 py-3 text-sm font-semibold text-neutral-200 hover:border-neutral-500">
              Toutes les nouveautés
            </Link>
            <Link href="/import-vinted" className="ky-button-primary inline-flex items-center rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-neutral-950 hover:bg-amber-400">
              Essayer l&apos;import Vinted
            </Link>
          </div>
        </footer>
      </article>
    </main>
  );
}
