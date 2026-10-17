import type { Metadata } from "next";
import Link from "next/link";
import { latestRelease } from "@/lib/releases";

export const metadata: Metadata = {
  title: "Mises à jour de Kyrivo — Journal des versions",
  description:
    "Découvrez les évolutions de Kyrivo : nouveautés, corrections de bugs et améliorations apportées au logiciel de gestion achat-revente.",
  alternates: { canonical: "https://kyrivo.fr/mises-a-jour" },
  openGraph: {
    title: "Mises à jour Kyrivo | Journal des versions",
    description: "Suivez les nouveautés et corrections de Kyrivo, version après version.",
    url: "https://kyrivo.fr/mises-a-jour",
    type: "website",
  },
};

export default function ReleaseNotesPage() {
  const release = latestRelease;

  return (
    <main className="ky-marketing mx-auto w-full max-w-5xl px-5 py-10 pb-20 sm:px-8 lg:py-16">
      <header className="mb-10 max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-amber-300">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          Évolutions du produit
        </span>
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-5xl">
          Mises à jour de Kyrivo
        </h1>
        <p className="mt-4 text-base leading-7 text-neutral-300 sm:text-lg">
          Retrouvez ici les nouveautés, les corrections de bugs et les améliorations
          du logiciel. Chaque version est documentée pour vous permettre de suivre
          clairement l’évolution de Kyrivo.
        </p>
      </header>

      <section aria-labelledby="releases-title" className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="releases-title" className="text-lg font-semibold text-white">
            Historique des versions
          </h2>
          <span className="text-xs text-neutral-400">Dernière publication : {release.dateLabel}</span>
        </div>

        <article className="ky-panel overflow-hidden rounded-2xl border border-neutral-700/70 bg-neutral-900/45">
          <div className="border-b border-neutral-800/70 bg-gradient-to-r from-amber-500/[0.10] to-transparent px-5 py-5 sm:px-7 sm:py-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold tracking-wide text-neutral-950">
                Version {release.version}
              </span>
              <time dateTime={release.dateISO} className="text-sm text-neutral-300">
                {release.dateLabel}
              </time>
            </div>
            <h3 className="mt-4 max-w-3xl text-xl font-semibold tracking-tight text-white sm:text-2xl">
              <Link href="/mises-a-jour/v1-1" className="transition-colors hover:text-amber-300">
                {release.title}
              </Link>
            </h3>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-300">
              {release.summary}
            </p>
          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-7">
            {release.sections.map((section, index) => (
              <div key={section.id} className="rounded-xl border border-neutral-700/60 bg-neutral-950/35 p-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-400">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p className="text-sm font-semibold text-white">{section.title}</p>
                <p className="mt-1.5 text-xs leading-5 text-neutral-400">
                  {section.items.length} points documentés
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-neutral-800/80 px-5 py-5 sm:px-7">
            <Link
              href="/mises-a-jour/v1-1"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-neutral-950 transition-colors hover:bg-amber-400"
            >
              Lire l’article complet
              <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </Link>
          </div>
        </article>
      </section>

      <footer className="mt-12 rounded-xl border border-neutral-800 bg-neutral-900/35 p-5 sm:p-7">
        <h2 className="text-base font-semibold text-white">Une remarque ou une suggestion ?</h2>
        <p className="mt-2 text-sm leading-7 text-neutral-300">
          Un dysfonctionnement, une amélioration à proposer ou une question sur une mise à jour ?
          Écrivez à{" "}
          <a className="font-semibold text-amber-300 underline underline-offset-4 hover:text-amber-200" href="mailto:contact@kartium-tcg.com">
            contact@kartium-tcg.com
          </a>.
        </p>
      </footer>
    </main>
  );
}
