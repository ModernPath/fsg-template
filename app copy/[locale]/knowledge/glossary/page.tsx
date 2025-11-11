import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { generateLocalizedMetadata } from '@/utils/metadata'
import GlossaryPage from './GlossaryPage'

export const dynamic = 'force-dynamic'

interface Props {
  params: {
    locale: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  
  return generateLocalizedMetadata({
    title: 'Rahoitussanasto - Yritysrahoituksen termit selitettynä | Trusty Finance',
    description: 'Kattava rahoitussanasto yrityksille: rahoitustermit, tunnusluvut ja käsitteet selitettynä ymmärrettävästi. Opi yritysrahoituksen kieltä.',
    locale: locale,
    path: '/knowledge/glossary'
  })
}

export default function GlossaryPageRoute({ params }: Props) {
  return <GlossaryPage />
}
