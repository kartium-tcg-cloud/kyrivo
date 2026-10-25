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
    slug: "import-vinted",
    href: "/nouveautes/import-vinted",
    category: "Actualité",
    title: "L'import Vinted arrive sur Kyrivo, en version bêta",
    summary: "Importez vos achats et ventes à partir des emails « Ton reçu pour la commande » et « Ton article s'est vendu ! ». Découvrez le fonctionnement de l'outil, encore en développement, et comment nous faire part de vos retours.",
    dateISO: "2026-10-25",
    dateLabel: "25 octobre 2026",
    eyebrow: "Nouvel outil · Bêta",
  },
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
