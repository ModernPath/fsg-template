import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { generateLocalizedMetadata } from '@/utils/metadata'
import CalculatorsPage from './CalculatorsPage'

export const dynamic = 'force-dynamic'

interface Props {
  params: {
    locale: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations('Calculators')
  
  return generateLocalizedMetadata({
    title: t('meta.title'),
    description: t('meta.description'),
    locale: locale,
    path: '/knowledge/calculators'
  })
}

export default function CalculatorsPageRoute({ params }: Props) {
  return <CalculatorsPage />
}
