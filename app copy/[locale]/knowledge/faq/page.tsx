import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { generateLocalizedMetadata } from '@/utils/metadata'
import FAQPage from './FAQPage'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{
    locale: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'FAQ' })
  
  return generateLocalizedMetadata({
    title: t('meta.title'),
    description: t('meta.description'),
    locale: locale,
    path: '/knowledge/faq'
  })
}

export default async function FAQPageRoute({ params }: Props) {
  return <FAQPage />
}
