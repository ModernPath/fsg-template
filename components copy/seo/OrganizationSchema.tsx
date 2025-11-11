'use client'

import { useEffect } from 'react'

interface OrganizationSchemaProps {
  locale: string
}

export default function OrganizationSchema({ locale }: OrganizationSchemaProps) {
  useEffect(() => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'FinancialService',
      name: 'Trusty Finance',
      alternateName: 'FSG Trusty Finance',
      description: 'AI-pohjainen yritysrahoitusneuvonta. Autamme yrityksiä löytämään parhaat rahoitusvaihtoehdot tekoälyn avulla.',
      url: `https://trustyfinance.fi/${locale}`,
      logo: 'https://trustyfinance.fi/images/trusty-finance-logo-optimized.webp',
      image: 'https://trustyfinance.fi/images/og/homepage-dark.webp',
      telephone: '+358 (0) 40 042 9736',
      email: 'info@trustyfinance.fi',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Nuottakuninkaantie 6 A 3',
        addressLocality: 'Espoo',
        postalCode: '02230',
        addressCountry: 'FI'
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 60.1695,
        longitude: 24.9354
      },
      areaServed: {
        '@type': 'Country',
        name: 'Finland'
      },
      serviceType: [
        'Business Financing',
        'Corporate Finance',
        'Financial Planning',
        'AI-powered Financial Analysis'
      ],
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Rahoituspalvelut',
        itemListElement: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Yrityslaina',
              description: 'Perinteiset yrityslainat kasvuun ja investointeihin'
            }
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Yritysluottolimiitti',
              description: 'Joustava luottolimiitti kassavirran hallintaan'
            }
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Factoring',
              description: 'Laskusaatavien rahoitus ja riskinhallinta'
            }
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Leasing-rahoitus',
              description: 'Kaluston ja ajoneuvojen rahoitus'
            }
          }
        ]
      },
      foundingDate: '2023',
      founder: [
        {
          '@type': 'Person',
          name: 'Timo Romakkaniemi',
          jobTitle: 'Toimitusjohtaja'
        },
        {
          '@type': 'Person',
          name: 'Alexander Laroma',
          jobTitle: 'Teknologiajohtaja'
        },
        {
          '@type': 'Person',
          name: 'Pertti Heinänen',
          jobTitle: 'Talousjohtaja'
        }
      ],
      sameAs: [
        'https://www.linkedin.com/company/trusty-finance',
        'https://twitter.com/trustyfinance',
        'https://www.facebook.com/trustyfinance'
      ],
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        bestRating: '5',
        worstRating: '1',
        ratingCount: '127'
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `https://trustyfinance.fi/${locale}/search?q={search_term_string}`
        },
        'query-input': 'required name=search_term_string'
      }
    }

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(schema)
    script.id = 'organization-schema'
    
    // Remove existing schema if any
    const existing = document.getElementById('organization-schema')
    if (existing) {
      existing.remove()
    }
    
    document.head.appendChild(script)

    return () => {
      const script = document.getElementById('organization-schema')
      if (script) {
        script.remove()
      }
    }
  }, [locale])

  return null
}
