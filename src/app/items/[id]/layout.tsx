import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Détail article',
  robots: {
    index: false,
    follow: false,
  },
}

export default function ItemDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
