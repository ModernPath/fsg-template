import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { generateLocalizedMetadata } from '@/utils/metadata'
import SolutionsPage from '@/components/pages/solutions/index'
import { Link as NextLink } from '@/app/i18n/navigation'

export const dynamic = 'force-dynamic'

interface Props {
  params: {
    locale: string
  }
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations('Solutions')
  const metadata = await generateLocalizedMetadata(locale, 'Solutions', {
    title: t('meta.title'),
    description: t('meta.description'),
    type: 'website',
    canonicalUrl: '/solutions',
    image: '/images/og/solutions.webp'
  })
  return metadata
}

export default async function Page({ params }: Props) {
  const { locale } = await params
  return <SolutionsPage params={{ locale }} />
} 