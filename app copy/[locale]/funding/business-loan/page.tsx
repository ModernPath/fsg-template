import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { generateLocalizedMetadata } from '@/utils/metadata'
import BusinessLoanPage from './BusinessLoanPage'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{
    locale: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations('BusinessLoan')
  
  return await generateLocalizedMetadata(locale, 'BusinessLoan', {
    title: t('meta.title'),
    description: t('meta.description'),
    type: 'article',
    canonicalUrl: '/funding/business-loan',
    image: '/images/og/business-loan-og.png'
  })
}

export default async function Page({ params }: Props) {
  const { locale } = await params
  return <BusinessLoanPage params={{ locale }} />
}