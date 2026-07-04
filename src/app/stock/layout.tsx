import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Stock',
  robots: {
    index: false,
    follow: false,
  },
}

export default function StockLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
