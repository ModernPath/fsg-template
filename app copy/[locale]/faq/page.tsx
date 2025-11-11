import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { generateLocalizedMetadata } from '@/utils/metadata'
import FAQPage from '../knowledge/faq/FAQPage'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{
    locale: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'FAQ' })
  
  return generateLocalizedMetadata(locale, 'FAQ', {
    title: t('meta.title'),
    description: t('meta.description'),
    type: 'website',
    canonicalUrl: '/faq',
    image: '/images/og/faq-dark.webp'
  })
}

export default function FaqPage() {
  return <FAQPage />
} 