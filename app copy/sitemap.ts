import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://trustyfinance.fi'
  const locales = ['fi', 'en', 'sv']
  const currentDate = new Date()

  // Main pages
  const mainPages = [
    '',
    '/funding',
    '/solutions',
    '/situations',
    '/knowledge',
    '/about',
    '/blog',
    '/contact'
  ]

  // Funding sub-pages
  const fundingPages = [
    '/funding/business-loan',
    '/funding/credit-line',
    '/funding/factoring-ar',
    '/funding/leasing'
  ]

  // Solutions sub-pages
  const solutionPages = [
    '/solutions/retail',
    '/solutions/manufacturing',
    '/solutions/technology',
    '/solutions/construction',
    '/solutions/health',
    '/solutions/logistics'
  ]

  // Situations sub-pages
  const situationPages = [
    '/situations/growth',
    '/situations/working-capital',
    '/situations/investment',
    '/situations/cash-flow'
  ]

  // Knowledge sub-pages
  const knowledgePages = [
    '/knowledge/guide',
    '/knowledge/calculators',
    '/knowledge/glossary',
    '/knowledge/faq'
  ]

  // About sub-pages
  const aboutPages = [
    '/about/team',
    '/about/why-trusty',
    '/about/customer-stories'
  ]

  // Combine all pages
  const allPages = [
    ...mainPages,
    ...fundingPages,
    ...solutionPages,
    ...situationPages,
    ...knowledgePages,
    ...aboutPages
  ]

  // Generate sitemap entries for all locales and pages
  const sitemapEntries: MetadataRoute.Sitemap = []

  locales.forEach(locale => {
    allPages.forEach(page => {
      const url = page === '' ? `${baseUrl}/${locale}` : `${baseUrl}/${locale}${page}`
      
      // Determine priority and change frequency based on page type
      let priority = 0.5
      let changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly'

      if (page === '/') {
        priority = 1.0
        changeFrequency = 'weekly'
      } else if (page === '/funding' || page === '/solutions' || page === '/situations' || page === '/knowledge') {
        priority = 0.8
        changeFrequency = 'weekly'
      } else if (page.startsWith('/funding/') || page.startsWith('/solutions/')) {
        priority = 0.7
        changeFrequency = 'monthly'
      } else if (page.startsWith('/situations/') || page.startsWith('/knowledge/')) {
        priority = 0.6
        changeFrequency = 'monthly'
      } else if (page.startsWith('/about/')) {
        priority = 0.5
        changeFrequency = 'yearly'
      } else if (page === '/about' || page === '/contact') {
        priority = 0.7
        changeFrequency = 'monthly'
      } else if (page === '/blog') {
        priority = 0.7
        changeFrequency = 'weekly'
      }

      sitemapEntries.push({
        url,
        lastModified: currentDate,
        changeFrequency,
        priority
      })
    })
  })

  // Blogi-sivut on jo mukana localizedPages-listassa, joten ei tarvita erikseen

  return sitemapEntries
}
