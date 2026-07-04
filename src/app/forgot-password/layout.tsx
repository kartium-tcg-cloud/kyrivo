import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mot de passe oublié',
  description:
    'Réinitialisez votre mot de passe Kyrivo en quelques instants via un lien envoyé par email.',
  alternates: {
    canonical: 'https://kyrivo.fr/forgot-password',
  },
}

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
