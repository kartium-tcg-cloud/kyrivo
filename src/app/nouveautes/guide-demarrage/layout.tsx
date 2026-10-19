import type { Metadata } from 'next'
import { onboardingGuide } from '@/lib/news'

export const metadata: Metadata = {
  title: `${onboardingGuide.title} — Tutoriels Kyrivo`,
  description: onboardingGuide.summary,
  alternates: {
    canonical: `https://kyrivo.fr${onboardingGuide.href}`,
  },
  openGraph: {
    title: onboardingGuide.title,
    description: onboardingGuide.summary,
    type: 'article',
    url: `https://kyrivo.fr${onboardingGuide.href}`,
    publishedTime: onboardingGuide.dateISO,
    images: ['/brand/kyrivo-hero-marketing-2400.png'],
  },
}

export default function GuideDemarrageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
