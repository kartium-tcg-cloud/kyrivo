import type { Metadata } from 'next'
import { Space_Grotesk } from 'next/font/google'

// Police d'accent réservée aux prix — chargée uniquement sur cette page.
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Kyrivo — Tarifs de l'outil de gestion pour revendeurs",
  description:
    "Découvrez les plans Kyrivo pour suivre achats, ventes, stock, marges, TVA et exports selon votre volume de revente.",
  alternates: {
    canonical: 'https://kyrivo.fr/abonnements',
  },
}

const productStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Kyrivo',
  description:
    'Logiciel de gestion des achats, ventes, stock, marges, TVA et factures pour revendeurs de biens physiques.',
  brand: { '@type': 'Brand', name: 'Kyrivo' },
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'EUR',
    lowPrice: '9.90',
    highPrice: '79.90',
    offerCount: 3,
    offers: [
      { '@type': 'Offer', name: 'Pro', price: '9.90', priceCurrency: 'EUR' },
      { '@type': 'Offer', name: 'Business', price: '24.90', priceCurrency: 'EUR' },
      { '@type': 'Offer', name: 'Entreprise', price: '79.90', priceCurrency: 'EUR' },
    ],
  },
}

export default function AbonnementsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={spaceGrotesk.variable}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productStructuredData) }}
      />
      {children}
    </div>
  )
}
