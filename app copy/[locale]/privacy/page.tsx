import { getTranslations } from 'next-intl/server'
import { setupServerLocale } from '@/app/i18n/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{
    locale: string
  }>
}

interface CookieType {
  name: string
  description: string
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  await setupServerLocale(locale);
  const t = await getTranslations('PrivacyPolicy');

  // Helper function to safely get array translations
  const getArrayTranslation = (key: string): string[] => {
    try {
      const translation = t.raw(key)
      if (Array.isArray(translation)) {
        return translation
      }
      // Handle comma-separated string
      if (typeof translation === 'string') {
        return translation.split(',').map(item => item.trim())
      }
      console.warn(`Translation for key ${key} is not an array or string:`, translation)
      return []
    } catch (error) {
      console.error(`Error getting translation array for key: ${key}`, error)
      return []
    }
  }

  // Helper function to safely get cookie types translation
  const getCookieTypes = (): CookieType[] => {
    try {
      const types = t.raw('cookies.types')
      if (Array.isArray(types)) {
        const validTypes = types.filter(type => 
          typeof type === 'object' && 
          type !== null &&
          'name' in type && 
          'description' in type
        )
        if (validTypes.length !== types.length) {
          console.warn('Some cookie types are not in correct format:', types)
        }
        return validTypes as CookieType[]
      }
      // Handle string representation of objects
      if (typeof types === 'string') {
        try {
          const parsedTypes = types.split('],[').map(item => {
            const cleanItem = item.replace(/^\[|\]$/g, '')
            const [name, description] = cleanItem.split(',').map(s => s.trim())
            return { name, description }
          })
          return parsedTypes
        } catch (parseError) {
          console.warn('Failed to parse cookie types string:', types)
          return []
        }
      }
      console.warn('Cookie types translation is not in correct format:', types)
      return []
    } catch (error) {
      console.error('Error getting cookie types translation', error)
      return []
    }
  }

  const analyticsItems = getArrayTranslation('information.analytics.items')
  const sessionItems = getArrayTranslation('information.session.items')
  const usageItems = getArrayTranslation('usage.items')
  const rightsItems = getArrayTranslation('rights.items')
  const cookieTypes = getCookieTypes()

  // Helper to render email links
  const renderEmailLink = (emailKey: string) => {
    const emailString = t(emailKey);
    const label = emailString.substring(0, emailString.indexOf(':') + 1);
    const value = emailString.substring(emailString.indexOf(':') + 2);
    if (!value) return <p>{emailString}</p>;
    return (
      <p>
        {label}{' '}
        <Link href={`mailto:${value}`} className="text-[#FFD700] hover:underline">
          {value}
        </Link>
      </p>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl text-[#F0E68C]">
      <h1 className="text-3xl font-bold mb-6 text-[#FFD700]">{t('title')}</h1>
      
      <div className="space-y-4">
        {/* Section 1: Registrar */}
        <div className="bg-[#111111] p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-3 text-[#FFD700]">{t('section1.heading')}</h2>
          <div className="space-y-1">
            <p>{t('section1.name')}</p>
            <p>{t('section1.businessId')}</p>
            <p>{t('section1.address')}</p>
            {renderEmailLink('section1.email')}
            <p>{t('section1.phone')}</p>
          </div>
        </div>

        {/* Section 2: Contact Person */}
        <div className="bg-[#111111] p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-3 text-[#FFD700]">{t('section2.heading')}</h2>
          <div className="space-y-1">
            <p>{t('section2.name')}</p>
            <p>{t('section2.role')}</p>
            {renderEmailLink('section2.email')}
            <p>{t('section2.phone')}</p>
          </div>
        </div>

        {/* Section 3: Register Names */}
        <div className="bg-[#111111] p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-3 text-[#FFD700]">{t('section3.heading')}</h2>
          <ul className="list-disc list-inside space-y-1">
            {getArrayTranslation('section3.registries').map((registry, index) => (
              <li key={index} className="text-xs">{registry}</li>
            ))}
          </ul>
        </div>

        {/* Section 4: Processing Purposes by Registry */}
        <div className="bg-[#111111] p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-3 text-[#FFD700]">{t('section4.heading')}</h2>
          <div className="space-y-3">
            {(() => {
              try {
                const registries = t.raw('section4.registries')
                if (Array.isArray(registries)) {
                  return registries.map((registry: any, index: number) => (
                    <div key={index}>
                      <h3 className="font-semibold text-[#FFD700] text-sm mb-1">{registry.name}</h3>
                      <ul className="list-disc list-inside space-y-0.5 ml-4">
                        {registry.purposes?.map((purpose: string, pIndex: number) => (
                          <li key={pIndex} className="text-xs">{purpose}</li>
                        ))}
                      </ul>
                    </div>
                  ))
                }
              } catch (error) {
                console.error('Error rendering section4:', error)
              }
              return null
            })()}
          </div>
        </div>

        {/* Section 5: Legal Bases */}
        <div className="bg-[#111111] p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-3 text-[#FFD700]">{t('section5.heading')}</h2>
          <p className="mb-3 text-sm">{t('section5.text')}</p>
          <div className="space-y-2">
            {(() => {
              try {
                const legalBases = t.raw('section5.legalBases')
                if (Array.isArray(legalBases)) {
                  return legalBases.map((basis: any, index: number) => (
                    <div key={index} className="ml-4">
                      <h3 className="font-semibold text-[#F0E68C] text-sm">{basis.title}</h3>
                      <p className="text-xs text-gray-400">{basis.description}</p>
                    </div>
                  ))
                }
              } catch (error) {
                console.error('Error rendering section5:', error)
              }
              return null
            })()}
          </div>
        </div>

        {/* Section 6: Data Content by Registry */}
        <div className="bg-[#111111] p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-3 text-[#FFD700]">{t('section6.heading')}</h2>
          <div className="space-y-3">
            {(() => {
              try {
                const registries = t.raw('section6.registries')
                if (Array.isArray(registries)) {
                  return registries.map((registry: any, index: number) => (
                    <div key={index}>
                      <h3 className="font-semibold text-[#FFD700] text-sm mb-1">{registry.name}</h3>
                      {registry.categories?.map((category: any, cIndex: number) => (
                        <div key={cIndex} className="ml-4 mb-1">
                          <h4 className="font-medium text-[#F0E68C] text-xs">{category.title}</h4>
                          <ul className="list-disc list-inside ml-4 space-y-0.5">
                            {category.items?.map((item: string, iIndex: number) => (
                              <li key={iIndex} className="text-xs text-gray-300">{item}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ))
                }
              } catch (error) {
                console.error('Error rendering section6:', error)
              }
              return null
            })()}
          </div>
        </div>

        {/* Section 7: Data Sources by Registry */}
        <div className="bg-[#111111] p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-3 text-[#FFD700]">{t('section7.heading')}</h2>
          <div className="space-y-3">
            {(() => {
              try {
                const registries = t.raw('section7.registries')
                if (Array.isArray(registries)) {
                  return registries.map((registry: any, index: number) => (
                    <div key={index}>
                      <h3 className="font-semibold text-[#FFD700] text-sm mb-1">{registry.name}</h3>
                      <ul className="list-disc list-inside space-y-0.5 ml-4">
                        {registry.sources?.map((source: string, sIndex: number) => (
                          <li key={sIndex} className="text-xs">{source}</li>
                        ))}
                      </ul>
                    </div>
                  ))
                }
              } catch (error) {
                console.error('Error rendering section7:', error)
              }
              return null
            })()}
          </div>
        </div>

        {/* Section 8: Disclosure and Recipients */}
        <div className="bg-[#111111] p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-3 text-[#FFD700]">{t('section8.heading')}</h2>
          <p className="mb-3 text-sm">{t('section8.text')}</p>
          <div className="space-y-2">
            {(() => {
              try {
                const recipients = t.raw('section8.recipients')
                if (Array.isArray(recipients)) {
                  return recipients.map((recipient: any, index: number) => (
                    <div key={index} className="ml-4">
                      <h3 className="font-semibold text-[#F0E68C] text-sm">{recipient.title}</h3>
                      <p className="text-xs text-gray-400">{recipient.description}</p>
                    </div>
                  ))
                }
              } catch (error) {
                console.error('Error rendering section8:', error)
              }
              return null
            })()}
          </div>
        </div>

        {/* Section 9: Data Retention Periods by Registry */}
        <div className="bg-[#111111] p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-3 text-[#FFD700]">{t('section9.heading')}</h2>
          <p className="mb-3 text-sm">{t('section9.text')}</p>
          <div className="space-y-3">
            {(() => {
              try {
                const registries = t.raw('section9.registries')
                if (Array.isArray(registries)) {
                  return registries.map((registry: any, index: number) => (
                    <div key={index}>
                      <h3 className="font-semibold text-[#FFD700] text-sm mb-1">{registry.name}</h3>
                      {registry.periods?.map((period: any, pIndex: number) => (
                        <div key={pIndex} className="ml-4 mb-1">
                          <p className="text-xs"><span className="text-[#F0E68C] font-medium">{period.title}:</span> {period.duration}</p>
                          <p className="text-xs text-gray-400 italic">{period.reason}</p>
                        </div>
                      ))}
                    </div>
                  ))
                }
              } catch (error) {
                console.error('Error rendering section9:', error)
              }
              return null
            })()}
          </div>
        </div>

        {/* Section 10: Data Security */}
        <div className="bg-[#111111] p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-3 text-[#FFD700]">{t('section10.heading')}</h2>
          <p className="mb-3 text-sm">{t('section10.text')}</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            {getArrayTranslation('section10.measures').map((measure, index) => (
              <li key={index} className="text-xs">{measure}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs italic text-gray-400">{t('section10.breachNotice')}</p>
        </div>

        {/* Section 11: Data Subject Rights */}
        <div className="bg-[#111111] p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-3 text-[#FFD700]">{t('section11.heading')}</h2>
          <p className="mb-3 text-sm">{t('section11.text')}</p>
          <div className="space-y-2">
            {(() => {
              try {
                const rights = t.raw('section11.rights')
                if (Array.isArray(rights)) {
                  return rights.map((right: any, index: number) => (
                    <div key={index} className="ml-4">
                      <h3 className="font-semibold text-[#F0E68C] text-sm">{right.title}</h3>
                      <p className="text-xs text-gray-400">{right.description}</p>
                    </div>
                  ))
                }
              } catch (error) {
                console.error('Error rendering section11:', error)
              }
              return null
            })()}
          </div>
        </div>

        {/* Section 12: Cookies */}
        <div className="bg-[#111111] p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-3 text-[#FFD700]">{t('section12.heading')}</h2>
          <p className="mb-2 text-sm">{t('section12.text')}</p>
          <p className="mb-3 text-xs italic">{t('section12.intro')}</p>
          <div className="space-y-2">
            {(() => {
              try {
                const cookieTypes = t.raw('section12.cookieTypes')
                if (Array.isArray(cookieTypes)) {
                  return cookieTypes.map((type: any, index: number) => (
                    <div key={index} className="ml-4">
                      <h3 className="font-semibold text-[#F0E68C] text-sm">{type.title}</h3>
                      <p className="text-xs text-gray-400">{type.description}</p>
                    </div>
                  ))
                }
              } catch (error) {
                console.error('Error rendering section12:', error)
              }
              return null
            })()}
          </div>
        </div>

        {/* Section 13: Automated Decision Making */}
        <div className="bg-[#111111] p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-3 text-[#FFD700]">{t('section13.heading')}</h2>
          <p className="text-sm">{t('section13.text')}</p>
        </div>

        {/* Section 14: Profiling */}
        <div className="bg-[#111111] p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-3 text-[#FFD700]">{t('section14.heading')}</h2>
          <p className="mb-3 text-sm">{t('section14.text')}</p>
          <div className="space-y-2">
            {(() => {
              try {
                const categories = t.raw('section14.categories')
                if (Array.isArray(categories)) {
                  return categories.map((category: any, index: number) => (
                    <div key={index} className="ml-4">
                      <h3 className="font-semibold text-[#F0E68C] text-sm">{category.title}</h3>
                      <p className="text-xs text-gray-400">{category.description}</p>
                    </div>
                  ))
                }
              } catch (error) {
                console.error('Error rendering section14:', error)
              }
              return null
            })()}
          </div>
        </div>

        {/* Section 15: Children's Data */}
        <div className="bg-[#111111] p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-3 text-[#FFD700]">{t('section15.heading')}</h2>
          <p className="text-sm">{t('section15.text')}</p>
        </div>

        {/* Section 16: Contact and Complaints */}
        <div className="bg-[#111111] p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-3 text-[#FFD700]">{t('section16.heading')}</h2>
          <p className="mb-3 text-sm">{t('section16.text')}</p>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-[#F0E68C] text-sm mb-1">Yhteystiedot</h3>
              <div className="space-y-0.5 text-xs">
                <p>{t('section16.contact.dpo')}</p>
                <p>{t('section16.contact.address')}</p>
                <p>
                  Sähköposti:{' '}
                  <Link href={`mailto:${t('section16.contact.email')}`} className="text-[#FFD700] hover:underline">
                    {t('section16.contact.email')}
                  </Link>
                  {' / '}
                  <Link href={`mailto:${t('section16.contact.generalEmail')}`} className="text-[#FFD700] hover:underline">
                    {t('section16.contact.generalEmail')}
                  </Link>
                </p>
                <p>Puhelin: {t('section16.contact.phone')}</p>
              </div>
            </div>
            
            <div>
              <p className="text-xs italic text-gray-400">{t('section16.responseTime')}</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-[#F0E68C] text-sm mb-1">{t('section16.authority.title')}</h3>
              <div className="space-y-0.5 text-xs">
                <p className="font-medium">{t('section16.authority.name')}</p>
                <p>{t('section16.authority.address')}</p>
                <p>{t('section16.authority.postal')}</p>
                <p>
                  Sähköposti:{' '}
                  <Link href={`mailto:${t('section16.authority.email')}`} className="text-[#FFD700] hover:underline">
                    {t('section16.authority.email')}
                  </Link>
                </p>
                <p>Puhelin: {t('section16.authority.phone')}</p>
                <p>
                  Verkkosivusto:{' '}
                  <Link href={`https://${t('section16.authority.website')}`} target="_blank" rel="noopener noreferrer" className="text-[#FFD700] hover:underline">
                    {t('section16.authority.website')}
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 17: Applicable Law */}
        <div className="bg-[#111111] p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-3 text-[#FFD700]">{t('section17.heading')}</h2>
          <div className="space-y-1.5 text-sm">
            <p>{t('section17.text')}</p>
            <p>{t('section17.jurisdiction')}</p>
            <p>{t('section17.gdpr')}</p>
          </div>
        </div>
      </div>
    </div>
  )
} 