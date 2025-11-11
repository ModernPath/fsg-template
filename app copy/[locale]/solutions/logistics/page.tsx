import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { generateLocalizedMetadata } from '@/utils/metadata'
import LogisticsSolutionsPage from './LogisticsSolutionsPage'

export const dynamic = 'force-dynamic'

interface Props {
  params: {
    locale: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations('LogisticsSolutions')
  
  return await generateLocalizedMetadata(locale, 'LogisticsSolutions', {
    title: t('meta.title'),
    description: t('meta.description'),
    type: 'article',
    canonicalUrl: '/solutions/logistics',
    image: '/images/og/logistics-solutions-og.png'
  })
}

export default async function Page({ params }: Props) {
  const { locale } = await params
  return <LogisticsSolutionsPage params={{ locale }} />
}
