import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { generateLocalizedMetadata } from '@/utils/metadata'
import WorkingCapitalPage from './WorkingCapitalPage'

export const dynamic = 'force-dynamic'

interface Props {
  params: {
    locale: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations('WorkingCapital')
  
  return await generateLocalizedMetadata(locale, 'WorkingCapital', {
    title: t('meta.title'),
    description: t('meta.description'),
    type: 'article',
    canonicalUrl: '/situations/working-capital',
    image: '/images/og/working-capital-og.png'
  })
}

export default async function Page({ params }: Props) {
  const { locale } = await params
  return <WorkingCapitalPage params={{ locale }} />
}
