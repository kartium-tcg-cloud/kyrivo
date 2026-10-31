"use client";

import Link from "next/link";
import { useState } from "react";
import { newsArticles, newsCategories, newsCategoryStyles, type NewsCategory } from "@/lib/news";

export default function NewsFeed() {
  const [selectedCategories, setSelectedCategories] = useState<NewsCategory[]>([...newsCategories]);

  function toggleCategory(category: NewsCategory) {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    );
  }

  const visibleArticles = newsArticles.filter((article) => selectedCategories.includes(article.category));

  return (
    <section aria-labelledby="articles-title">
      <div className="mb-8">
        <h2 id="filters-title" className="mb-3 text-sm font-semibold text-neutral-200">
          Filtrer les publications
        </h2>
        <div role="group" aria-labelledby="filters-title" className="flex flex-wrap gap-2.5">
          {newsCategories.map((category) => {
            const selected = selectedCategories.includes(category);
            const style = newsCategoryStyles[category];
            return (
              <button
                key={category}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleCategory(category)}
                className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 ${
                  selected
                    ? style.selectedFilter
                    : "border-neutral-700 bg-neutral-900/60 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200"
                }`}
              >
                <span aria-hidden="true" className={`flex h-4 w-4 items-center justify-center rounded border ${selected ? `${style.marker} text-neutral-950` : "border-neutral-500"}`}>
                  {selected && (
                    <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="m3 8 3 3 7-7" />
                    </svg>
                  )}
                </span>
                {category}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <h2 id="articles-title" className="text-xl font-semibold text-white">Les publications</h2>
        <p role="status" aria-live="polite" className="text-sm text-neutral-400">
          {visibleArticles.length} {visibleArticles.length === 1 ? "article" : "articles"}
        </p>
      </div>

      {visibleArticles.length > 0 ? (
        <div className="grid gap-4">
          {visibleArticles.map((article) => (
            <article key={article.slug} className={`ky-panel group overflow-hidden rounded-2xl border border-l-4 border-neutral-700/70 bg-neutral-900/45 transition-colors hover:bg-neutral-900/65 ${newsCategoryStyles[article.category].cardAccent} ${newsCategoryStyles[article.category].cardHover}`}>
              <Link href={article.href} className="block rounded-2xl p-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 sm:p-7" aria-label={`Lire : ${article.title}`}>
                <div className="mb-4 flex flex-wrap items-center gap-2.5">
                  <span className={`rounded-md border px-2.5 py-1 text-xs font-bold ${newsCategoryStyles[article.category].badge}`}>
                    {article.category}
                  </span>
                  {article.eyebrow && (
                    <span className="text-xs font-semibold text-neutral-300">{article.eyebrow}</span>
                  )}
                  <time dateTime={article.dateISO} className="text-xs text-neutral-400">
                    {article.dateLabel}
                  </time>
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-white transition-colors group-hover:text-amber-300 sm:text-2xl">
                  {article.title}
                </h3>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-300">{article.summary}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-amber-300 group-hover:text-amber-200">
                  Lire l’article
                  <svg aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
                  </svg>
                </span>
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-neutral-700 bg-neutral-900/35 px-5 py-10 text-center sm:px-8">
          <p className="text-base font-semibold text-white">Aucun article à afficher</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-400">
            Aucun article ne correspond aux catégories sélectionnées. Réactivez un filtre pour retrouver les publications.
          </p>
          <button type="button" onClick={() => setSelectedCategories([...newsCategories])} className="mt-5 rounded-xl border border-amber-500/45 px-4 py-2.5 text-sm font-semibold text-amber-300 transition-colors hover:bg-amber-500/10">
            Tout sélectionner
          </button>
        </div>
      )}
    </section>
  );
}
