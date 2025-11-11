import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { generateLocalizedMetadata } from '@/utils/metadata'
import GrowthFundingPage from './GrowthFundingPage'

export const dynamic = 'force-dynamic'

interface Props {
  params: {
    locale: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations('GrowthFunding')
  
  return await generateLocalizedMetadata(locale, 'GrowthFunding', {
    title: t('meta.title'),
    description: t('meta.description'),
    type: 'article',
    canonicalUrl: '/situations/growth',
    image: '/images/og/growth-funding-og.png'
  })
}

export default async function Page({ params }: Props) {
  const { locale } = await params
  return <GrowthFundingPage params={{ locale }} />
}
