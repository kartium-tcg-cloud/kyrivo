import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Achats',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AchatsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
