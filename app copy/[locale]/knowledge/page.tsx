import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { generateLocalizedMetadata } from '@/utils/metadata'
import KnowledgeBankPage from './KnowledgeBankPage'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{
    locale: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  
  return generateLocalizedMetadata({
    title: 'Tietopankki - Yritysrahoituksen opas ja työkalut | Trusty Finance',
    description: 'Kattava tietopankki yritysrahoituksesta: oppaat, laskurit, sanasto ja UKK. Opi yrityksen rahoitusvaihtoehdoista ja tee parempia rahoituspäätöksiä.',
    locale: locale,
    path: '/knowledge'
  })
}

export default function KnowledgePage({ params }: Props) {
  return <KnowledgeBankPage />
}
