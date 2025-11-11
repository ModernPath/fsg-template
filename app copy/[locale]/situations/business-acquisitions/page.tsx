import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { generateLocalizedMetadata } from '@/utils/metadata'
import BusinessAcquisitionsPage from './BusinessAcquisitionsPage'

interface Props {
  params: Promise<{
    locale: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations('BusinessAcquisitions')
  
  return generateLocalizedMetadata({
    title: t('meta.title'),
    description: t('meta.description'),
    locale: locale,
    path: '/situations/business-acquisitions'
  })
}

export default async function Page({ params }: Props) {
  const { locale } = await params
  return <BusinessAcquisitionsPage params={{ locale }} />
}
