import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { generateLocalizedMetadata } from '@/utils/metadata'
import FinancingGuidePage from './FinancingGuidePage'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{
    locale: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  
  return generateLocalizedMetadata({
    title: 'Rahoitusopas yrityksille - Kattava opas yritysrahoitukseen | Trusty Finance',
    description: 'Kattava opas yritysrahoitukseen: rahoitustyypit, hakuprosessi, dokumentit ja käytännön vinkit. Opi tekemään oikeita rahoituspäätöksiä yrityksellesi.',
    locale: locale,
    path: '/knowledge/guide'
  })
}

export default function GuidePage({ params }: Props) {
  return <FinancingGuidePage />
}
