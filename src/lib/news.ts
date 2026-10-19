import { latestRelease } from "@/lib/releases";

export const newsCategories = ["Mises à jour", "Actualité", "Conseils", "Tutoriels"] as const;

export type NewsCategory = (typeof newsCategories)[number];

export type NewsArticle = {
  slug: string;
  href: string;
  category: NewsCategory;
  title: string;
  summary: string;
  dateISO: string;
  dateLabel: string;
  eyebrow?: string;
};

/** Articles publics : ajouter une entrée ici pour qu'elle apparaisse dans Nouveautés. */
export const newsArticles: NewsArticle[] = [
  {
    slug: "v1-1",
    href: "/nouveautes/v1-1",
    category: "Mises à jour",
    title: latestRelease.title,
    summary: latestRelease.summary,
    dateISO: latestRelease.dateISO,
    dateLabel: latestRelease.dateLabel,
    eyebrow: `Version ${latestRelease.version}`,
  },
];
