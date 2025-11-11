import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { generateLocalizedMetadata } from '@/utils/metadata'
import CreditLinePage from './CreditLinePage'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{
    locale: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations('CreditLine')
  
  return await generateLocalizedMetadata(locale, 'CreditLine', {
    title: 'Yritysluottolimiitti – Joustava ratkaisu kassavirran vaihteluihin | FSG Trusty Finance',
    description: 'Yritysluottolimiitti sopii kassavirran tasaamiseen ja lyhytaikaisiin rahoitustarpeisiin. Maksat vain käyttämästäsi osasta.',
    type: 'article',
    canonicalUrl: '/funding/credit-line',
    image: '/images/og/credit-line-og.png'
  })
}

export default async function Page({ params }: Props) {
  const { locale } = await params
  return <CreditLinePage params={{ locale }} />
}