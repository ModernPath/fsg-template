import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { generateLocalizedMetadata } from '@/utils/metadata'
import ConstructionSolutionsPage from './ConstructionSolutionsPage'

export const dynamic = 'force-dynamic'

interface Props {
  params: {
    locale: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations('ConstructionSolutions')
  
  return await generateLocalizedMetadata(locale, 'ConstructionSolutions', {
    title: t('meta.title'),
    description: t('meta.description'),
    type: 'article',
    canonicalUrl: '/solutions/construction',
    image: '/images/og/construction-solutions-og.png'
  })
}

export default async function Page({ params }: Props) {
  const { locale } = await params
  return <ConstructionSolutionsPage params={{ locale }} />
}
