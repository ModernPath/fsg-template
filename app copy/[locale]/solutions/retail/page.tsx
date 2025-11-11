import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { generateLocalizedMetadata } from '@/utils/metadata'
import RetailSolutionsPage from './RetailSolutionsPage'

export const dynamic = 'force-dynamic'

interface Props {
  params: {
    locale: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations('RetailSolutions')
  
  return await generateLocalizedMetadata(locale, 'RetailSolutions', {
    title: t('meta.title'),
    description: t('meta.description'),
    type: 'article',
    canonicalUrl: '/solutions/retail',
    image: '/images/og/retail-solutions-og.png'
  })
}

export default async function Page({ params }: Props) {
  const { locale } = await params
  return <RetailSolutionsPage params={{ locale }} />
}
