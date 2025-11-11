'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const HeroSection = () => {
  const t = useTranslations('Home'); // Using 'Home' namespace as inferred from t('hero...')

  return (
    // Added a wrapping Fragment to fix the "JSX expressions must have one parent element" error
    <>
      <p className="text-base sm:text-lg text-center md:text-left">
        {t('hero.description')}
      </p>
      <div className="flex gap-6 justify-center md:justify-start">
        <Link href="/onboarding" passHref>
          <Button
            size="lg"
            variant="default"
            className="h-12 sm:h-14 px-8 sm:px-10 text-base sm:text-lg bg-gold-primary hover:bg-gold-highlight text-black rounded-lg shadow-md disabled:opacity-50 disabled:bg-gold-primary disabled:text-black"
          >
            {t('hero.cta')}
          </Button>
        </Link>
      </div>
    </>
  );
};

export default HeroSection; 