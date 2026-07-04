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
          '/stock',
          '/factures',
          '/preferences',
          '/contacts',
          '/items/',
          '/api/',
        ],
      },
    ],
    sitemap: 'https://kyrivo.fr/sitemap.xml',
  }
}
