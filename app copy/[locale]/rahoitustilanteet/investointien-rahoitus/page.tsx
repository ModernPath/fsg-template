import { Metadata } from 'next'
import { generateLocalizedMetadata } from '@/utils/metadata'
import InvestmentFinancingPage from './InvestmentFinancingPage'

interface Props {
  params: {
    locale: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  
  return generateLocalizedMetadata({
    title: 'Investointien rahoitus | Koneet, Kiinteistöt, IT | Trusty',
    description: 'Rahoita PK-yrityksen investoinnit järkevästi. Leasing, yrityslaina tai osamaksu koneisiin ja laitteisiin. Päätös 48h, summat 50k-10M€.',
    locale: locale,
    path: '/rahoitustilanteet/investointien-rahoitus'
  })
}

export default function InvestmentFinancingPageRoute({ params }: Props) {
  return <InvestmentFinancingPage />
}
