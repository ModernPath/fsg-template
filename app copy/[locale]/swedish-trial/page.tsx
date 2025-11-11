import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import SwedishTrialLandingPage from './SwedishTrialLandingPage';

interface Props {
  params: Promise<{
    locale: string;
  }>;
}

export default async function SwedishTrialPage({ params }: Props) {
  const { locale } = await params;
  
  // Redirect non-Swedish locales to home page
  if (locale !== 'sv') {
    redirect(`/${locale}`);
  }

  const t = await getTranslations('SwedishTrial');

  return <SwedishTrialLandingPage locale={locale} />;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations('SwedishTrial');

  return {
    title: t('meta.title', { default: 'Testa TrustyFinance - Sveriges nya finansieringsplattform' }),
    description: t('meta.description', { 
      default: 'Bli en av de första att testa TrustyFinance i Sverige. Få AI-drivna finansieringsrekommendationer och hjälp oss forma framtidens företagsfinansiering.' 
    }),
    openGraph: {
      title: t('meta.title', { default: 'Testa TrustyFinance - Sveriges nya finansieringsplattform' }),
      description: t('meta.description', { 
        default: 'Bli en av de första att testa TrustyFinance i Sverige. Få AI-drivna finansieringsrekommendationer och hjälp oss forma framtidens företagsfinansiering.' 
      }),
    },
  };
}
