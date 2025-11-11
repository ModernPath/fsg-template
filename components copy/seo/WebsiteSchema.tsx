'use client'

import { useEffect } from 'react'

interface WebsiteSchemaProps {
  locale: string
}

export default function WebsiteSchema({ locale }: WebsiteSchemaProps) {
  useEffect(() => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Trusty Finance',
      url: `https://trustyfinance.fi/${locale}`,
      description: 'AI-pohjainen yritysrahoitusneuvonta Suomessa. Löydä paras rahoitusvaihtoehto yrityksellesi.',
      inLanguage: locale,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `https://trustyfinance.fi/${locale}/search?q={search_term_string}`
        },
        'query-input': 'required name=search_term_string'
      },
      publisher: {
        '@type': 'Organization',
        name: 'Trusty Finance',
        logo: {
          '@type': 'ImageObject',
          url: 'https://trustyfinance.fi/images/trusty-finance-logo-optimized.webp'
        }
      },
      mainEntity: {
        '@type': 'ItemList',
        name: 'Sivuston pääosiot',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            item: {
              '@type': 'WebPage',
              name: 'Rahoitusanalyysi',
              url: `https://trustyfinance.fi/${locale}/onboarding`
            }
          },
          {
            '@type': 'ListItem',
            position: 2,
            item: {
              '@type': 'WebPage',
              name: 'Rahoitusvaihtoehdot',
              url: `https://trustyfinance.fi/${locale}/funding`
            }
          },
          {
            '@type': 'ListItem',
            position: 3,
            item: {
              '@type': 'WebPage',
              name: 'Toimialakohtaiset ratkaisut',
              url: `https://trustyfinance.fi/${locale}/solutions`
            }
          },
          {
            '@type': 'ListItem',
            position: 4,
            item: {
              '@type': 'WebPage',
              name: 'Tietopankki',
              url: `https://trustyfinance.fi/${locale}/knowledge`
            }
          }
        ]
      }
    }

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(schema)
    script.id = 'website-schema'
    
    // Remove existing schema if any
    const existing = document.getElementById('website-schema')
    if (existing) {
      existing.remove()
    }
    
    document.head.appendChild(script)

    return () => {
      const script = document.getElementById('website-schema')
      if (script) {
        script.remove()
      }
    }
  }, [locale])

  return null
}
