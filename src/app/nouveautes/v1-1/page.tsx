import type { Metadata } from "next";
import Link from "next/link";
import { latestRelease } from "@/lib/releases";

const release = latestRelease;
const CANONICAL = "https://kyrivo.fr/nouveautes/v1-1";

export const metadata: Metadata = {
  title: `Kyrivo v${release.version} — Nouveautés et corrections du ${release.dateLabel}`,
  description: release.summary,
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: `Kyrivo v${release.version} — ${release.title}`,
    description: release.summary,
    type: "article",
    url: CANONICAL,
    publishedTime: release.dateISO,
  },
};

export default function VersionOneOnePage() {
  const structuredArticle = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: `Kyrivo v${release.version} — ${release.title}`,
    description: release.summary,
    datePublished: release.dateISO,
    dateModified: release.dateISO,
    inLanguage: "fr",
    author: { "@type": "Organization", name: "Équipe Kyrivo" },
    publisher: { "@type": "Organization", name: "Kartium TCG", url: "https://kyrivo.fr" },
    mainEntityOfPage: CANONICAL,
  };

  return (
    <main className="ky-marketing mx-auto w-full max-w-5xl px-5 py-9 pb-20 sm:px-8 lg:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredArticle) }} />
      <nav aria-label="Fil d’Ariane" className="mb-7 text-sm text-neutral-400">
        <Link className="hover:text-amber-300" href="/nouveautes">Nouveautés</Link>
        <span aria-hidden="true" className="mx-2 text-neutral-600">/</span>
        <span aria-current="page" className="text-neutral-200">Version {release.version}</span>
      </nav>

      <article id="v1-1" className="space-y-10">
        <header className="border-b border-neutral-800/90 pb-9">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-neutral-950">
              Version {release.version}
            </span>
            <time dateTime={release.dateISO} className="text-sm text-neutral-300">
              {release.dateLabel}
            </time>
            <span className="text-xs text-neutral-500">Notes de version officielles</span>
          </div>
          <h1 className="mt-5 max-w-4xl text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            {release.title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-neutral-300 sm:text-lg">
            {release.summary}
          </p>
          <p className="mt-3 text-sm text-neutral-400">
            Cette version est disponible sur Kyrivo. Les nouveautés concernent l’affichage
            et le suivi des opérations, sans modification automatique des montants de vos factures.
          </p>
        </header>

        <nav aria-label="Sommaire de la version" className="ky-panel rounded-2xl p-5 sm:p-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-neutral-200">Dans cette mise à jour</h2>
          <ol className="grid gap-2 sm:grid-cols-3">
            {release.sections.map((section, index) => (
              <li key={section.id}>
                <a className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm text-amber-300 hover:bg-amber-500/10 hover:text-amber-200" href={`#${section.id}`}>
                  <span className="text-xs text-neutral-400">{String(index + 1).padStart(2, "0")}</span>
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {release.sections.map((section, index) => (
          <section id={section.id} key={section.id} aria-labelledby={`${section.id}-title`} className="scroll-mt-12">
            <div className="mb-5 flex items-start gap-4">
              <span aria-hidden="true" className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-xs font-bold text-amber-300">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 id={`${section.id}-title`} className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  {section.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-neutral-400">{section.intro}</p>
              </div>
            </div>
            <div className="space-y-3">
              {section.items.map((item) => (
                <div key={item.title} className="ky-panel rounded-xl border border-neutral-800 bg-neutral-900/35 px-5 py-5 sm:px-7 sm:py-6">
                  <h3 className="text-base font-semibold text-white sm:text-lg">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-neutral-300">{item.description}</p>
                </div>
              ))}
            </div>
          </section>
        ))}

        <aside className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-5 sm:p-7" aria-label="Précisions sur le fonctionnement">
          <h2 className="text-base font-semibold text-white">À retenir</h2>
          <p className="mt-2 text-sm leading-7 text-neutral-300">
            Les frais sont accessibles par défaut, mais leur saisie n’est pas obligatoire.
            Les estimations de marge dépendent des coûts effectivement renseignés.
            L’import automatisé Vinted reste indisponible à ce stade.
          </p>
        </aside>

        <footer className="border-t border-neutral-800 pt-9">
          <h2 className="text-xl font-semibold text-white">Un problème ou une suggestion ?</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-300">
            Vous remarquez un bug, une incohérence ou avez une idée d’amélioration ?
            Votre retour nous aide à rendre Kyrivo plus simple et plus fiable.
            Vous pouvez nous écrire à{" "}
            <a
              href="mailto:contact@kartium-tcg.com?subject=Retour%20sur%20Kyrivo%20v1.1"
              className="font-semibold text-amber-300 underline underline-offset-4 hover:text-amber-200"
            >
              contact@kartium-tcg.com
            </a>.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/nouveautes" className="ky-button-secondary inline-flex items-center rounded-xl border border-neutral-700 px-5 py-3 text-sm font-semibold">
              Toutes les nouveautés
            </Link>
            <Link href="/dashboard" className="ky-button-primary inline-flex items-center rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-neutral-950">
              Accéder à Kyrivo
            </Link>
          </div>
        </footer>
      </article>
    </main>
  );
}
