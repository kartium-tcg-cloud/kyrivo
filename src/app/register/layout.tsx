import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Créer un compte Kyrivo',
  description:
    'Créez votre compte Kyrivo et démarrez votre essai gratuit pour suivre vos achats, ventes, stock et marges.',
  alternates: {
    canonical: 'https://kyrivo.fr/register',
  },
}

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
