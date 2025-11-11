import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { generateLocalizedMetadata } from '@/utils/metadata'
import SituationsPage from '@/app/[locale]/situations/SituationsPage'

interface Props {
  params: {
    locale: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  
  return generateLocalizedMetadata({
    title: 'Rahoitustilanteet PK-yrityksille | Kasvu, Kassavirta, Kriisi',
    description: 'Tunnistamme yrityksesi rahoitustilanteen ja löydämme parhaat ratkaisut. Kasvun rahoitus, kassavirran optimointi, yrityskaupat. Ilmainen analyysi, päätös 24-48h.',
    locale: locale,
    path: '/rahoitustilanteet'
  })
}

export default function RahoitustilannePageRoute({ params }: Props) {
  return <SituationsPage />
}
