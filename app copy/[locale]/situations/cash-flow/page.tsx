import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { generateLocalizedMetadata } from '@/utils/metadata'
import CashFlowPage from './CashFlowPage'

export const dynamic = 'force-dynamic'

interface Props {
  params: {
    locale: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations('CashFlow')
  
  return await generateLocalizedMetadata(locale, 'CashFlow', {
    title: 'Kassavirran tasaaminen – Sesonkivaihtelut, maksujärjestelyt ja likviditeetti | FSG Trusty Finance',
    description: 'Kassavirran haasteet: sesonkivaihtelut, maksuviiveet, odottamattomat kulut ja likviditeettikriisit. Löydä sopivat tasausratkaisut.',
    type: 'article',
    canonicalUrl: '/situations/cash-flow',
    image: '/images/og/cash-flow-og.png'
  })
}

export default async function Page({ params }: Props) {
  const { locale } = await params
  return <CashFlowPage params={{ locale }} />
}
