import { createClient } from '@/utils/supabase/server'
import { getTranslations } from 'next-intl/server'
import { setupServerLocale } from '@/app/i18n/server-utils'
import { Metadata } from 'next'
import { HeroSection } from '@/components/boat-trips/HeroSection'
import { FeaturesSection } from '@/components/boat-trips/FeaturesSection'
import { CharterFeaturesSection } from '@/components/boat-trips/CharterFeaturesSection'
import { TripsSection } from '@/components/boat-trips/TripsSection'
import { VideoGallerySection } from '@/components/boat-trips/VideoGallerySection'
import { ImageGallerySection } from '@/components/boat-trips/ImageGallerySection'
import { TestimonialsSection } from '@/components/boat-trips/TestimonialsSection'
import { BlogPreviewSection } from '@/components/boat-trips/BlogPreviewSection'
import { ContactSection } from '@/components/boat-trips/ContactSection'
import { AOSInit } from '@/components/boat-trips/AOSInit'
import { BoatTripsHeader } from '@/components/boat-trips/BoatTripsHeader'
import { BoatTripsFooter } from '@/components/boat-trips/BoatTripsFooter'
import { CaptainSection } from '@/components/boat-trips/CaptainSection'
import { BoatTripsChatbot } from '@/components/boat-trips/BoatTripsChatbot'

type Props = {
  params: Promise<{
    locale: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  await setupServerLocale(locale)
  const t = await getTranslations('BoatTrips')

  return {
    title: `${t('meta.title')} | Fuengirola`,
    description: t('meta.description'),
    openGraph: {
      title: t('meta.title'),
      description: t('meta.description'),
      type: 'website',
    },
  }
}

async function getBlogPosts(locale: string) {
  try {
    const supabase = await createClient()
    
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('locale', locale)
      .eq('is_published', true)
      .contains('subjects', ['boat-trips'])
      .order('created_at', { ascending: false })
      .limit(3)

    if (error) {
      console.error('Error fetching blog posts:', error)
      return []
    }

    return posts || []
  } catch (error) {
    console.error('Error in getBlogPosts:', error)
    return []
  }
}

export default async function FuengirolaBoatTripsPage({ params }: Props) {
  const { locale } = await params
  await setupServerLocale(locale)
  const posts = await getBlogPosts(locale)

  return (
    <>
      <AOSInit />
      <BoatTripsHeader locale={locale} />
      <main className="min-h-screen bg-white overflow-hidden">
        <HeroSection />
        <CaptainSection />
        <TripsSection />
        <CharterFeaturesSection />
        <VideoGallerySection />
        <ImageGallerySection />
        <FeaturesSection />
        <TestimonialsSection />
        <BlogPreviewSection posts={posts} locale={locale} />
        <ContactSection />
      </main>
      <BoatTripsFooter locale={locale} />
      <BoatTripsChatbot locale={locale} />
    </>
  )
}
