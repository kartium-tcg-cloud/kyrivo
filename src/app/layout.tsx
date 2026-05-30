// Layout racine de l'application Kyrivo
// Structure : sidebar fixe à gauche + zone de contenu scrollable à droite
// Fond noir cohérent sur l'ensemble

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kyrivo — Gestion achats, ventes et stock pour revendeurs",
  description: "Kyrivo centralise vos achats, ventes et stock en un seul outil. TVA sur marge, facturation PDF et export comptable — pour revendeurs TCG, manga, figurines, sneakers, Lego et brocante, en France et en Belgique.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/favicon.svg",
    apple: "/apple-icon.png",
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
        {/* ── Barre d'annonce/support ── */}
        <div className="fixed top-0 left-0 right-0 z-[60] flex h-8 items-center justify-center border-b border-neutral-800/40 bg-neutral-950/98 px-4 backdrop-blur-sm">
          <p className="text-center text-[11px] text-neutral-500">
            <span className="hidden sm:inline">Un problème avec Kyrivo ? Contactez-nous : </span>
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
</body>
    </html>
  );
}