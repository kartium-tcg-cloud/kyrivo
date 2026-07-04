import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Détail contact',
  robots: {
    index: false,
    follow: false,
  },
}

export default function ContactDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
