import { Metadata } from 'next'
import { generateLocalizedMetadata } from '@/utils/metadata'
import CashflowManagementPage from './CashflowManagementPage'

interface Props {
  params: {
    locale: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  
  return generateLocalizedMetadata({
    title: 'Kassavirran hallinta | Vapauta 40% käyttöpääomaa | Trusty',
    description: 'Optimoi PK-yrityksen kassavirta ja vapauta jopa 40% käyttöpääomasta. Factoring, yrityslimiitti, käyttöpääomalaina. Ilmainen analyysi, päätös 24h.',
    locale: locale,
    path: '/rahoitustilanteet/kassavirran-hallinta'
  })
}

export default function CashflowManagementPageRoute({ params }: Props) {
  return <CashflowManagementPage />
}
