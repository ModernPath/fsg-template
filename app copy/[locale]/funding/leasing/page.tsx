import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { generateLocalizedMetadata } from '@/utils/metadata'
import LeasingPage from './LeasingPage'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{
    locale: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations('Leasing')
  
  return await generateLocalizedMetadata(locale, 'Leasing', {
    title: 'Leasing-rahoitus – Hanki kalustoa ilman suurta alkupääomaa | FSG Trusty Finance',
    description: 'Leasing-rahoituksella saat käyttöösi autot, koneet ja laitteet ilman isoa alkuinvestointia. Joustava loppuratkaisu ja veroedut.',
    type: 'article',
    canonicalUrl: '/funding/leasing',
    image: '/images/og/leasing-og.png'
  })
}

export default async function Page({ params }: Props) {
  const { locale } = await params
  return <LeasingPage params={{ locale }} />
}