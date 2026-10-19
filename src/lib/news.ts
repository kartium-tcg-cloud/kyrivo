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

export const onboardingGuide: NewsArticle = {
  slug: "guide-demarrage",
  href: "/nouveautes/guide-demarrage",
  category: "Tutoriels",
  title: "Bien démarrer avec Kyrivo : le guide complet",
  summary: "Configure ton compte, enregistre tes achats et tes ventes, suis ton stock et tes marges, puis découvre les exports et la facturation grâce à sept étapes illustrées.",
  dateISO: "2026-08-15",
  dateLabel: "15 août 2026",
  eyebrow: "Guide pas à pas",
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
  onboardingGuide,
];
