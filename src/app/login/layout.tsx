import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Connexion à Kyrivo',
  description:
    'Connectez-vous à Kyrivo pour gérer vos achats, ventes, stock, marges et TVA.',
  alternates: {
    canonical: 'https://kyrivo.fr/login',
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
