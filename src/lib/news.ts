import { latestRelease } from "@/lib/releases";

export const newsCategories = ["Mises à jour", "Actualité", "Conseils", "Tutoriels"] as const;

export type NewsCategory = (typeof newsCategories)[number];

/** Palette sémantique unique : mêmes couleurs dans les filtres, cartes et pages. */
export const newsCategoryStyles: Record<NewsCategory, {
  badge: string;
  selectedFilter: string;
  marker: string;
  cardAccent: string;
  cardHover: string;
}> = {
  "Mises à jour": {
    badge: "border-blue-500/40 bg-blue-500/15 text-blue-200",
    selectedFilter: "border-blue-400/70 bg-blue-500/20 text-blue-100 hover:bg-blue-500/30",
    marker: "border-blue-300 bg-blue-400",
    cardAccent: "border-l-blue-400/80",
    cardHover: "hover:border-blue-500/45",
  },
  "Actualité": {
    badge: "border-cyan-500/40 bg-cyan-500/15 text-cyan-200",
    selectedFilter: "border-cyan-400/70 bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/30",
    marker: "border-cyan-300 bg-cyan-400",
    cardAccent: "border-l-cyan-400/80",
    cardHover: "hover:border-cyan-500/45",
  },
  "Conseils": {
    badge: "border-emerald-500/40 bg-emerald-500/15 text-emerald-200",
    selectedFilter: "border-emerald-400/70 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30",
    marker: "border-emerald-300 bg-emerald-400",
    cardAccent: "border-l-emerald-400/80",
    cardHover: "hover:border-emerald-500/45",
  },
  "Tutoriels": {
    badge: "border-amber-500/40 bg-amber-500/15 text-amber-200",
    selectedFilter: "border-amber-400/70 bg-amber-500/20 text-amber-100 hover:bg-amber-500/30",
    marker: "border-amber-300 bg-amber-400",
    cardAccent: "border-l-amber-400/80",
    cardHover: "hover:border-amber-500/45",
  },
};

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
