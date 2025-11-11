import { Metadata } from 'next'
import { generateLocalizedMetadata } from '@/utils/metadata'
import CustomerStoriesPage from './CustomerStoriesPage'

interface Props {
  params: {
    locale: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  
  return generateLocalizedMetadata({
    title: 'Asiakastarinat - Onnistuneita rahoitusprojekteja | Trusty Finance',
    description: 'Lue todellisia tarinoita siitä, miten Trusty Finance on auttanut yrityksiä kasvamaan ja menestymään oikealla rahoituksella.',
    locale: locale,
    path: '/about/customer-stories'
  })
}

export default async function CustomerStoriesPageRoute({ params }: Props) {
  return <CustomerStoriesPage />
}
