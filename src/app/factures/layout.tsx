import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Factures',
  robots: {
    index: false,
    follow: false,
  },
}

export default function FacturesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
