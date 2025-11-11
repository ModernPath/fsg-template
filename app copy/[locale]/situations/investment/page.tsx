import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { generateLocalizedMetadata } from '@/utils/metadata'
import InvestmentFundingPage from './InvestmentFundingPage'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{
    locale: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations('InvestmentFunding')
  
  return await generateLocalizedMetadata(locale, 'InvestmentFunding', {
    title: t('meta.title'),
    description: t('meta.description'),
    type: 'article',
    canonicalUrl: '/situations/investment',
    image: '/images/og/investment-funding-og.png'
  })
}

export default async function Page({ params }: Props) {
  const { locale } = await params
  return <InvestmentFundingPage params={{ locale }} />
}
