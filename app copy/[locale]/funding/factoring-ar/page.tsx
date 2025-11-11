import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { generateLocalizedMetadata } from '@/utils/metadata'
import FactoringPage from './FactoringPage'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{
    locale: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations('Factoring')
  
  return await generateLocalizedMetadata(locale, 'Factoring', {
    title: 'Factoring & Laskurahoitus – Vapauta laskusaatavat välittömästi käyttöön | FSG Trusty Finance',
    description: 'Factoring-rahoituksella saat laskusaatavistasi rahat heti. Ei lainaa, vaan saatavien myyntiä. Sopii B2B-yrityksille pitkillä maksuajoilla.',
    type: 'article',
    canonicalUrl: '/funding/factoring-ar',
    image: '/images/og/factoring-og.png'
  })
}

export default async function Page({ params }: Props) {
  const { locale } = await params
  return <FactoringPage params={{ locale }} />
}