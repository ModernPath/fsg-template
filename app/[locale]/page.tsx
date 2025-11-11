import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { generateLocalizedMetadata } from '@/utils/metadata'
import BizExitLanding from '@/components/pages/home/BizExitLanding'

export const dynamic = 'force-dynamic'

interface Props {
  params: {
    locale: string
  }
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations('bizexit')
  const metadata = await generateLocalizedMetadata(locale, 'bizexit', {
    title: 'BizExit - AI-Powered M&A Platform',
    description: t('hero.description'),
    type: 'website',
    canonicalUrl: '/',
    image: '/images/og/bizexit-home.webp'
  })
  return metadata
}

export default async function Page({ params }: Props) {
  const { locale } = await params
  return <BizExitLanding params={{ locale }} />
}
