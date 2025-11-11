import { Metadata } from 'next'
import { generateLocalizedMetadata } from '@/utils/metadata'
import TeamPage from './TeamPage'

interface Props {
  params: {
    locale: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  
  return generateLocalizedMetadata({
    title: 'Tiimi ja asiantuntijat - Kokeneet rahoitusasiantuntijat | Trusty Finance',
    description: 'Tutustu Trusty Finance -tiimiin: Timo Romakkaniemi, Alexander Laroma ja Pertti Heinänen. Vahva rahoitusosaaminen ja teknologinen asiantuntemus.',
    locale: locale,
    path: '/about/team'
  })
}

export default async function TeamPageRoute({ params }: Props) {
  return <TeamPage />
}
