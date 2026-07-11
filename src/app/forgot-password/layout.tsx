import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mot de passe oublié',
  description:
    'Réinitialisez votre mot de passe Kyrivo en quelques instants via un lien envoyé par email.',
  alternates: {
    canonical: 'https://kyrivo.fr/forgot-password',
  },
  // Page utilitaire sans valeur de résultat de recherche — même traitement que /login.
  robots: {
    index: false,
    follow: true,
  },
}

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
