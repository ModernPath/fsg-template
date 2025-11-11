import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { generateLocalizedMetadata } from '@/utils/metadata'
import ServicePage from '@/components/pages/service/index'
import { Link as NextLink } from '@/app/i18n/navigation'

export const dynamic = 'force-dynamic'

interface Props {
  params: {
    locale: string
  }
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations('Service')
  const metadata = await generateLocalizedMetadata(locale, 'Service', {
    title: t('meta.title'),
    description: t('meta.description'),
    type: 'website',
    canonicalUrl: '/service',
    image: '/images/og/service.webp'
  })
  return metadata
}

export default async function Page({ params }: Props) {
  const { locale } = await params
  return <ServicePage params={{ locale }} />
} 