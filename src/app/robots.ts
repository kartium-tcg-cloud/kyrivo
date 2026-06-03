import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/achats',
          '/ventes',
          '/factures',
          '/preferences',
          '/contacts',
          '/items/',
          '/api/',
        ],
      },
    ],
    sitemap: 'https://kyrivo.kartium-tcg.com/sitemap.xml',
  }
}
