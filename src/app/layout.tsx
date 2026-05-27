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
  title: "Kyrivo",
  description: "Gestion comptable pour vendeurs TCG",
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
  <main className="pl-64 min-h-screen">{children}</main>
  <Toaster
  position="top-right"
  richColors
  theme="dark"
/>
</body>
    </html>
  );
}