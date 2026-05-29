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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body>
  <Sidebar />
  <main className="min-h-screen pt-16 lg:pt-0 lg:pl-64 overflow-x-hidden">
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