import { getTranslations, setRequestLocale } from 'next-intl/server'
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
  setRequestLocale(locale)
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

export default async function FuengirolaBoatTripsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  
  // Staattiset blogipostaukset (ei tietokantaa)
  const posts: any[] = []

  return (
    <>
      <AOSInit />
      <BoatTripsHeader />
      <main className="min-h-screen bg-white overflow-x-hidden">
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
