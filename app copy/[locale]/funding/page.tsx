import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { generateLocalizedMetadata } from '@/utils/metadata'
import FundingOptionsPage from './FundingOptionsPage'

export const dynamic = 'force-dynamic'

interface Props {
  params: {
    locale: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations('FundingOptions')
  
  return await generateLocalizedMetadata(locale, 'FundingOptions', {
    title: t('meta.title'),
    description: t('meta.description'),
    type: 'website',
    canonicalUrl: '/funding',
    image: '/images/og/funding-options-og.png'
  })
}

export default async function Page({ params }: Props) {
  const { locale } = await params
  return <FundingOptionsPage params={{ locale }} />
}
