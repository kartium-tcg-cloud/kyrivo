import type { Metadata } from "next";
import NewsFeed from "./NewsFeed";

export const metadata: Metadata = {
  title: "Nouveautés Kyrivo — Mises à jour, actualité et conseils",
  description:
    "Suivez les mises à jour de Kyrivo, l'actualité du service, nos conseils et tutoriels pour mieux gérer votre activité d'achat-revente.",
  alternates: { canonical: "https://kyrivo.fr/nouveautes" },
  openGraph: {
    title: "Nouveautés Kyrivo | Actualité et mises à jour",
    description: "Mises à jour, actualité, conseils et tutoriels : toutes les publications de Kyrivo au même endroit.",
    url: "https://kyrivo.fr/nouveautes",
    type: "website",
  },
};

export default function NewsPage() {
  return (
    <main className="ky-marketing mx-auto w-full max-w-5xl px-5 py-10 pb-20 sm:px-8 lg:py-16">
      <header className="mb-10 max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-amber-300">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          Le journal de Kyrivo
        </span>
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-5xl">Nouveautés</h1>
        <p className="mt-4 text-base leading-7 text-neutral-300 sm:text-lg">
          Découvrez les évolutions de Kyrivo, les actualités du service et des conseils
          pour mieux organiser votre activité d’achat-revente. Sélectionnez les catégories
          qui vous intéressent pour personnaliser la liste des articles.
        </p>
      </header>

      <NewsFeed />

      <footer className="mt-12 rounded-xl border border-neutral-800 bg-neutral-900/35 p-5 sm:p-7">
        <h2 className="text-base font-semibold text-white">Une idée de sujet ou une suggestion ?</h2>
        <p className="mt-2 text-sm leading-7 text-neutral-300">
          Une question, un sujet que vous aimeriez voir traité ou une amélioration à proposer ?
          Écrivez à{" "}
          <a className="font-semibold text-amber-300 underline underline-offset-4 hover:text-amber-200" href="mailto:contact@kartium-tcg.com">
            contact@kartium-tcg.com
          </a>.
        </p>
      </footer>
    </main>
  );
}
