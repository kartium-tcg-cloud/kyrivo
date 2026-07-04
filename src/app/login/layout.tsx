import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Connexion à Kyrivo',
  description:
    'Connectez-vous à Kyrivo pour gérer vos achats, ventes, stock, marges et TVA.',
  alternates: {
    canonical: 'https://kyrivo.fr/login',
  },
  // Une page de connexion n'a aucune valeur de résultat de recherche —
  // cohérent avec son absence du sitemap.
  robots: {
    index: false,
    follow: true,
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
