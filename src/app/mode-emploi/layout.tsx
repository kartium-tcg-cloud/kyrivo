import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Mode d'emploi Kyrivo — Guide pour bien démarrer",
  description:
    "Apprenez à configurer Kyrivo, encoder vos achats et ventes, suivre votre stock, analyser vos marges, exporter vos données et générer vos factures.",
  alternates: {
    canonical: 'https://kyrivo.kartium-tcg.com/mode-emploi',
  },
  openGraph: {
    title: "Mode d'emploi Kyrivo — Guide pour bien démarrer",
    description:
      "Apprenez à configurer Kyrivo, encoder vos achats et ventes, suivre votre stock, analyser vos marges, exporter vos données et générer vos factures.",
    images: ['/brand/kyrivo-hero-marketing-2400.png'],
  },
}

export default function ModeEmploiLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
