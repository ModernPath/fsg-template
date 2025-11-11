import { Metadata } from 'next'
import { generateLocalizedMetadata } from '@/utils/metadata'
import WhyTrustyPage from './WhyTrustyPage'

interface Props {
  params: {
    locale: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  
  return generateLocalizedMetadata({
    title: 'Miksi Trusty Finance - AI-pohjainen rahoitusneuvonta | Trusty Finance',
    description: 'Miksi yritykset valitsevat Trusty Financen: AI-pohjainen analyysi, henkilökohtainen neuvonta, läpinäkyvä prosessi ja tehokas palvelu.',
    locale: locale,
    path: '/about/why-trusty'
  })
}

export default async function WhyTrustyPageRoute({ params }: Props) {
  return <WhyTrustyPage />
}
