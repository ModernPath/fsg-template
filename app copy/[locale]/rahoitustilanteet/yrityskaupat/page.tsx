import { Metadata } from 'next'
import { generateLocalizedMetadata } from '@/utils/metadata'
import BusinessAcquisitionsPage from './BusinessAcquisitionsPage'
import { getTranslations } from 'next-intl/server'

interface Props {
  params: {
    locale: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'BusinessAcquisitions' })
  
  return generateLocalizedMetadata({
    title: t('meta.title'),
    description: t('meta.description'),
    locale: locale,
    path: '/rahoitustilanteet/yrityskaupat'
  })
}

export default function BusinessAcquisitionsPageRoute({ params }: Props) {
  return <BusinessAcquisitionsPage />
}
