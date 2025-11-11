import { Metadata } from 'next'
import { generateLocalizedMetadata } from '@/utils/metadata'
import GrowthFinancingPage from './GrowthFinancingPage'

interface Props {
  params: {
    locale: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  
  return generateLocalizedMetadata({
    title: 'Kasvun rahoitus PK-yritykselle | 100k-5M€ päätös 24-48h',
    description: 'Rahoita yrityksesi kasvu ilman omistuksen laimentamista. Yrityslaina, limiitti tai factoring kasvuun. Kilpailutetut tarjoukset, ilmainen analyysi.',
    locale: locale,
    path: '/rahoitustilanteet/kasvun-rahoitus'
  })
}

export default function GrowthFinancingPageRoute({ params }: Props) {
  return <GrowthFinancingPage />
}
