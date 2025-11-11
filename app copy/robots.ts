import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/_next/',
          '/temp/',
          '/private/',
          '*.json',
          '/auth/'
        ]
      },
      {
        userAgent: 'GPTBot',
        disallow: '/'
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: '/'
      },
      {
        userAgent: 'CCBot',
        disallow: '/'
      },
      {
        userAgent: 'anthropic-ai',
        disallow: '/'
      }
    ],
    sitemap: 'https://trustyfinance.fi/sitemap.xml',
    host: 'https://trustyfinance.fi'
  }
}