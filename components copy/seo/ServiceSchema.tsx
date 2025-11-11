'use client'

import { useEffect } from 'react'

interface ServiceSchemaProps {
  serviceName: string
  description: string
  serviceArea?: string
  serviceType: string | string[]
  priceRange?: string
  provider?: string
}

export default function ServiceSchema({ 
  serviceName, 
  description, 
  serviceArea = "Finland", 
  serviceType, 
  priceRange = "Hinnoittelu pyynnöstä",
  provider = "Trusty Finance"
}: ServiceSchemaProps) {
  useEffect(() => {
    const serviceTypeArray = Array.isArray(serviceType) ? serviceType : [serviceType]
    const url = typeof window !== 'undefined' ? window.location.href : ''
    
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'FinancialProduct',
      name: serviceName,
      description: description,
      url: url,
      category: serviceTypeArray,
      feesAndCommissionsSpecification: priceRange,
      areaServed: {
        '@type': 'Country',
        name: serviceArea
      },
      provider: {
        '@type': 'FinancialService',
        name: provider,
        url: 'https://trustyfinance.fi'
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
        validFrom: new Date().toISOString(),
        seller: {
          '@type': 'Organization',
          name: 'Trusty Finance'
        }
      },
      potentialAction: {
        '@type': 'ApplyAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://trustyfinance.fi/onboarding',
          inLanguage: 'fi'
        },
        object: {
          '@type': 'FinancialProduct',
          name: serviceName
        }
      }
    }

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(schema)
    script.id = `service-schema-${serviceName?.toLowerCase().replace(/\s+/g, '-') || 'default'}`
    
    // Remove existing schema if any
    const existing = document.getElementById(script.id)
    if (existing) {
      existing.remove()
    }
    
    document.head.appendChild(script)

    return () => {
      const script = document.getElementById(`service-schema-${serviceName.toLowerCase().replace(/\s+/g, '-')}`)
      if (script) {
        script.remove()
      }
    }
  }, [serviceName, description, serviceArea, serviceType, priceRange, provider])

  return null
}
