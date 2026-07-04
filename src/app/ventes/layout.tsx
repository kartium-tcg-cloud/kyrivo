import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ventes',
  robots: {
    index: false,
    follow: false,
  },
}

export default function VentesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
