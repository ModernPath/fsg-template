import { Metadata } from 'next'
import { generateLocalizedMetadata } from '@/utils/metadata'
import BlogArticlePage from './BlogArticlePage'

interface Props {
  params: {
    locale: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  
  return generateLocalizedMetadata({
    title: 'Yritysrahoitus Suomessa 2025: Kattava opas yrittäjille | Trusty Finance',
    description: 'Kaikki mitä sinun tulee tietää yritysrahoituksesta Suomessa vuonna 2025. Lainat, tuet, factoring ja uudet rahoitusmuodot selkeästi selitettynä.',
    locale: locale,
    path: '/blog/yritysrahoitus-suomessa-2025'
  })
}

export default async function BlogArticlePageRoute({ params }: Props) {
  return <BlogArticlePage params={params} />
}
