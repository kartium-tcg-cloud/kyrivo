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
  metadataBase: new URL("https://kyrivo.kartium-tcg.com"),
  title: {
    default: "Kyrivo — Gestion achats, ventes et stock pour revendeurs",
    template: "%s | Kyrivo",
  },
  description:
    "Suivez vos achats, ventes, stock, marges, TVA et exports sans fichier Excel compliqué. Kyrivo est un outil de gestion pour revendeurs de biens physiques en France et Belgique.",
  keywords: [
    "Kyrivo",
    "logiciel gestion revendeur",
    "outil gestion revente",
    "gestion achats ventes stock",
    "gestion stock cartes Pokémon",
    "logiciel revente Vinted",
    "gestion TCG",
    "suivi marges revente",
    "TVA sur marge",
    "alternative Excel revente",
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
    url: "https://kyrivo.kartium-tcg.com",
    siteName: "Kyrivo",
    title: "Kyrivo — Gestion achats, ventes et stock pour revendeurs",
    description:
      "Achats, ventes, stock, marges, TVA et exports dans un outil simple pour revendeurs de biens physiques.",
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
    title: "Kyrivo — Gestion achats, ventes et stock pour revendeurs",
    description:
      "Achats, ventes, stock, marges, TVA et exports dans un outil simple pour revendeurs de biens physiques.",
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