// Layout racine de l'application Kyrivo
// Structure : sidebar fixe à gauche + zone de contenu scrollable à droite
// Fond noir cohérent sur l'ensemble

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import MetaPixel from "@/components/MetaPixel";
import CookieConsent from "@/components/CookieConsent";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://kyrivo.fr"),
  title: {
    default: "Kyrivo — Logiciel de gestion achat-revente, stock, TVA et marges",
    template: "%s | Kyrivo",
  },
  description:
    "Gérez vos achats, ventes, stock, marges, TVA et factures avec Kyrivo. Un outil simple pour revendeurs Vinted, brocante, TCG, collection et petits e-commerçants.",
  keywords: [
    "Kyrivo",
    "logiciel achat revente",
    "logiciel gestion achat revente",
    "logiciel gestion revendeur",
    "gestion stock revendeur",
    "gestion achats ventes stock",
    "gestion stock cartes Pokémon",
    "logiciel revendeur Vinted",
    "gestion TCG",
    "suivi marge achat revente",
    "TVA sur marge achat revente",
    "logiciel facturation revendeur",
    "alternative Excel achat revente",
    "gestion stock brocante",
    "revendeur France Belgique",
  ],
  authors: [{ name: "Kartium TCG" }],
  creator: "Kartium TCG",
  publisher: "Kartium TCG",

  openGraph: {
    type: "website",
    locale: "fr_FR",
    alternateLocale: ["fr_BE"],
    url: "https://kyrivo.fr",
    siteName: "Kyrivo",
    title: "Kyrivo — Logiciel de gestion achat-revente, stock, TVA et marges",
    description:
      "Gérez vos achats, ventes, stock, marges, TVA et factures avec Kyrivo. Un outil simple pour revendeurs Vinted, brocante, TCG, collection et petits e-commerçants.",
    images: [
      {
        url: "/brand/kyrivo-hero-marketing-2400.png",
        width: 2400,
        height: 1260,
        alt: "Kyrivo — Outil de gestion pour revendeurs : achats, ventes, stock, marges et TVA",
        type: "image/png",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Kyrivo — Logiciel de gestion achat-revente, stock, TVA et marges",
    description:
      "Gérez vos achats, ventes, stock, marges, TVA et factures avec Kyrivo. Un outil simple pour revendeurs Vinted, brocante, TCG, collection et petits e-commerçants.",
    images: ["/brand/kyrivo-hero-marketing-2400.png"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },

  icons: {
    icon: [
      { url: "/brand/kyrivo-favicon.svg", type: "image/svg+xml" },
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/brand/kyrivo-favicon.svg",
    apple: [
      { url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body>
        <MetaPixel />
        {/* ── Barre d'annonce/support ── */}
        <div className="fixed top-0 left-0 right-0 z-[60] flex h-8 items-center justify-center border-b border-neutral-800/40 bg-neutral-950/98 px-4 backdrop-blur-sm">
          <p className="text-center text-[11px] text-neutral-500">
            <span className="hidden sm:inline">Besoin d&apos;aide ? Contactez-nous : </span>
            <span className="sm:hidden">Assistance : </span>
            <a
              href="mailto:contact@kartium-tcg.com"
              className="font-medium text-amber-400/70 transition-colors hover:text-amber-400"
            >
              contact@kartium-tcg.com
            </a>
          </p>
        </div>
  <Sidebar />
  <main className="min-h-screen pt-24 lg:pt-8 lg:pl-64 overflow-x-hidden">
    {children}
  </main>
  <Toaster
  position="top-right"
  richColors
  theme="dark"
/>
        <CookieConsent />
</body>
    </html>
  );
}