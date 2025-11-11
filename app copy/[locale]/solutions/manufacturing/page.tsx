import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { generateLocalizedMetadata } from '@/utils/metadata'
import ManufacturingSolutionsPage from './ManufacturingSolutionsPage'

export const dynamic = 'force-dynamic'

interface Props {
  params: {
    locale: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations('ManufacturingSolutions')
  
  return await generateLocalizedMetadata(locale, 'ManufacturingSolutions', {
    title: t('meta.title'),
    description: t('meta.description'),
    type: 'article',
    canonicalUrl: '/solutions/manufacturing',
    image: '/images/og/manufacturing-solutions-og.png'
  })
}

export default async function Page({ params }: Props) {
  const { locale } = await params
  return <ManufacturingSolutionsPage params={{ locale }} />
}
