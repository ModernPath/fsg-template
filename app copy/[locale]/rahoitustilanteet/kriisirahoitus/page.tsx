import { Metadata } from 'next'
import { generateLocalizedMetadata } from '@/utils/metadata'
import CrisisFinancingPage from './CrisisFinancingPage'

interface Props {
  params: {
    locale: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  
  return generateLocalizedMetadata({
    title: 'Kriisirahoitus PK-yritykselle | Nopea apu 24h | Trusty',
    description: 'Kriisirahoitus ja tervehdyttäminen yritykselle. Kassavirta-apu, velkajärjestely, saneerausrahoitus. Päätös 24h, summat 10k-1M€.',
    locale: locale,
    path: '/rahoitustilanteet/kriisirahoitus'
  })
}

export default function CrisisFinancingPageRoute({ params }: Props) {
  return <CrisisFinancingPage />
}
