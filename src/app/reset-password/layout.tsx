import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Réinitialiser le mot de passe',
  description: 'Choisissez un nouveau mot de passe pour votre compte Kyrivo.',
  alternates: {
    canonical: 'https://kyrivo.fr/reset-password',
  },
}

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
