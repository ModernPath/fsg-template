import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { generateLocalizedMetadata } from '@/utils/metadata'
import ContactForm from '@/components/contact/ContactForm'

interface Props {
  params: Promise<{
    locale: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Contact' })
  
  return generateLocalizedMetadata(locale, 'Contact', {
    title: t('meta.title'),
    description: t('meta.description'),
    type: 'website',
    canonicalUrl: '/contact',
    image: '/images/og/contact.webp'
  })
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Contact' })

  return (
    <main className="flex flex-col bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative py-24 bg-background overflow-hidden">
        <div className="container mx-auto px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-8 text-gold-primary">
              {t('title')}
            </h1>
            <p className="text-xl md:text-2xl text-foreground/80 leading-relaxed">
              {t('description')}
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-card rounded-2xl shadow-2xl p-8 border border-border">
              <h2 className="text-2xl font-bold mb-6 text-gold-primary">
                {t('form.title')}
              </h2>
              <p className="text-foreground/80 mb-8">
                {t('form.description')}
              </p>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
} 