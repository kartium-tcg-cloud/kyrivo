import type { Metadata } from 'next'
import { Space_Grotesk } from 'next/font/google'

// Police d'accent réservée aux chiffres clés (KPI) — chargée uniquement ici.
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Tableau de bord',
  robots: {
    index: false,
    follow: false,
  },
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className={spaceGrotesk.variable}>{children}</div>
}
