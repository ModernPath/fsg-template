import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { generateLocalizedMetadata } from '@/utils/metadata'
import HealthSolutionsPage from './HealthSolutionsPage'

export const dynamic = 'force-dynamic'

interface Props {
  params: {
    locale: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations('HealthSolutions')
  
  return await generateLocalizedMetadata(locale, 'HealthSolutions', {
    title: t('meta.title'),
    description: t('meta.description'),
    type: 'article',
    canonicalUrl: '/solutions/health',
    image: '/images/og/health-solutions-og.png'
  })
}

export default async function Page({ params }: Props) {
  const { locale } = await params
  return <HealthSolutionsPage params={{ locale }} />
}