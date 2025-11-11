'use client'; // Make this a Client Component

import Image from 'next/image';
import { useTranslations } from 'next-intl'; // Import useTranslations
import { Button } from '@/app/components/Button';
import { Link } from '@/app/i18n/navigation';
import { IconCode, IconBrain, IconDatabase, IconGlobe, IconRocket, IconShield, IconChart, IconMoney, IconCalculator, CheckIcon } from '@/app/components/Icons';
import sukellusImage from '@/public/images/other/sukellus.jpeg';
import tiimiVakavanaImage from '@/public/images/other/tiimi_vakavana.jpeg';
import fsgLogo from '@/public/images/trusty-finance-logo-optimized.webp';
import timoImage from '@/public/images/tiimi/timo_tiimi.jpg';
import alexanderImage from '@/public/images/tiimi/alexander_tiimi.jpg';
import perttiImage from '@/public/images/tiimi/pertti_tiimi.jpeg';
import ContactForm from '@/components/contact/ContactForm';

// Pre-calculate blur data URL for better performance
const blurDataURL = 'data:image/webp;base64,UklGRlIAAABXRUJQVlA4IEYAAAAwAQCdASoBAAEADsD+JaQAA3AA/uaKSAB4AAAAVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AA/uaKSAB4AA=='

interface Props {
  params: {
    locale: string;
  };
}

export default function AboutPageContent({ params }: Props) {
  const { locale } = params;
  const t = useTranslations('About'); // Use the hook

  return (
    <main className="bg-background text-foreground min-h-screen">
      {/* Hero Section */}
      <section className="relative py-12 bg-background overflow-hidden">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h1 className="text-6xl md:text-7xl font-bold mb-8">
                <span className="">
                  {t('hero.title')}
                </span>
              </h1>
              <p className="text-2xl text-gold-primary mb-6">
                {t('hero.description')}
              </p>
              <p className="text-xl text-foreground/80 mb-10">
                Autamme yrityksiä tekemään älykkäämpiä taloudellisia päätöksiä FSG Trusty Finance -analyysin avulla.
              </p>
              <Button
                size="lg"
                href="/onboarding"
                variant="primary"
                className="h-14 px-10 text-lg bg-gold-primary hover:bg-gold-highlight text-black rounded-xl shadow-lg"
              >
                {t('about.cta')}
              </Button>
            </div>

            <div className="w-full md:w-1/2 mt-8 md:mt-0 flex justify-center">
              <Image
                src={sukellusImage}
                alt="FSG Trusty Finance sukellus"
                className="object-contain w-full max-w-[600px] max-h-[600px] h-auto"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="relative py-12 bg-background border-t border-gray-dark overflow-hidden">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="">
                Missiomme | Visiomme
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-start">
            {/* Mission */}
            <div className="p-6 border-2 border-gold-primary/50 rounded-xl bg-background/50 shadow-[0_0_15px_rgba(212,175,55,0.15)]">
              <div className="flex items-center mb-6">
                <div className="bg-gold-primary/10 p-3 rounded-lg mr-4">
                  <IconRocket className="w-6 h-6 text-gold-primary" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">
                  {t('mission.title')}
                </h2>
              </div>
              <p className="text-xl leading-relaxed mb-8">
                {t('mission.description')}
              </p>
            </div>

            {/* Vision */}
            <div className="p-6 border-2 border-gold-primary/50 rounded-xl bg-background/50 shadow-[0_0_15px_rgba(212,175,55,0.15)]">
              <div className="flex items-center mb-6">
                <div className="bg-gold-primary/10 p-3 rounded-lg mr-4">
                  <IconBrain className="w-6 h-6 text-gold-primary" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">
                  {t('vision.title')}
                </h2>
              </div>
              <p className="text-xl leading-relaxed mb-8">
                {t('vision.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="relative py-12 bg-background border-t border-gray-dark overflow-hidden">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              {t('team.title')}
            </h2>
            <p className="text-xl">
              {t('team.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="rounded-xl overflow-hidden shadow-lg">
              <Image
                src={tiimiVakavanaImage}
                alt={t('team.groupAlt')}
                className="w-full h-auto"
              />
            </div>
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold mb-3">{t('team.expertise.strong')}</h3>
              <p className="text-lg">
                {t('team.expertise.description')}
              </p>
              
              <h3 className="text-2xl font-semibold mb-3">{t('team.tech.title')}</h3>
              <p className="text-lg">
                {t('team.tech.description')}
              </p>
              
              <h3 className="text-2xl font-semibold mb-3">{t('team.international.title')}</h3>
              <p className="text-lg">
                {t('team.international.description')}
              </p>
              
              <p className="text-lg">
                {t('team.conclusion')}
                </p>
              </div>
          </div>
        </div>
      </section>

      {/* Founders Section */}
      <section className="relative py-12 bg-background border-t border-gray-dark overflow-hidden">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              {t('founders.title')}
            </h2>
            <p className="text-xl">
              {t('founders.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Timo Romakkaniemi */}
            <div className="text-center">
              <div className="relative w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden border-4 border-gold-primary/50">
                <Image
                  src={timoImage}
                  alt="Timo Romakkaniemi"
                  className="w-full h-full object-cover"
                  fill
                />
              </div>
              <h3 className="text-2xl font-semibold mb-3">
                Timo Romakkaniemi
              </h3>
              <p className="text-lg mb-4">
                {t('founders.timo.role')}
              </p>
              <p className="text-base leading-relaxed">
                {t('founders.timo.description')}
              </p>
            </div>

            {/* Alexander Laroma */}
            <div className="text-center">
              <div className="relative w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden border-4 border-gold-primary/50">
                <Image
                  src={alexanderImage}
                  alt="Alexander Laroma"
                  className="w-full h-full object-cover"
                  fill
                />
              </div>
              <h3 className="text-2xl font-semibold mb-3">
                Alexander Laroma
              </h3>
              <p className="text-lg mb-4">
                {t('founders.alexander.role')}
              </p>
              <p className="text-base leading-relaxed">
                {t('founders.alexander.description')}
              </p>
            </div>

            {/* Pertti Heinänen */}
            <div className="text-center">
              <div className="relative w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden border-4 border-gold-primary/50">
                <Image
                  src={perttiImage}
                  alt="Pertti Heinänen"
                  className="w-full h-full object-cover"
                  fill
                />
              </div>
              <h3 className="text-2xl font-semibold mb-3">
                Pertti Heinänen
              </h3>
              <p className="text-lg mb-4">
                {t('founders.pertti.role')}
              </p>
              <p className="text-base leading-relaxed">
                {t('founders.pertti.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="relative py-12 bg-background border-t border-gray-dark overflow-hidden">
        <div className="container mx-auto px-8 max-w-[1440px] relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              {t('contact.title')}
            </h2>
            <p className="text-xl">
              {t('contact.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="rounded-xl overflow-hidden shadow-lg">
              <Image
                src={tiimiVakavanaImage}
                alt={t('team.groupAlt')}
                className="w-full h-auto"
              />
            </div>
            <div className="space-y-6">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
} 