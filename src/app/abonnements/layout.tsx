import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Kyrivo — Tarifs de l'outil de gestion pour revendeurs",
  description:
    "Découvrez les plans Kyrivo pour suivre achats, ventes, stock, marges, TVA et exports selon votre volume de revente.",
  alternates: {
    canonical: 'https://kyrivo.kartium-tcg.com/abonnements',
  },
}

export default function AbonnementsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
