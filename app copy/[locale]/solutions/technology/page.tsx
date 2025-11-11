import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { generateLocalizedMetadata } from '@/utils/metadata'
import TechnologySolutionsPage from './TechnologySolutionsPage'

export const dynamic = 'force-dynamic'

interface Props {
  params: {
    locale: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations('TechnologySolutions')
  
  return await generateLocalizedMetadata(locale, 'TechnologySolutions', {
    title: t('meta.title'),
    description: t('meta.description'),
    type: 'article',
    canonicalUrl: '/solutions/technology',
    image: '/images/og/technology-solutions-og.png'
  })
}

export default async function Page({ params }: Props) {
  const { locale } = await params
  return <TechnologySolutionsPage params={{ locale }} />
}
