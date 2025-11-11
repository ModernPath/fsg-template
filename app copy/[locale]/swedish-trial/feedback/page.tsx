import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import SwedishTrialFeedbackPage from './SwedishTrialFeedbackPage';

interface Props {
  params: Promise<{
    locale: string;
  }>;
}

export default async function SwedishTrialFeedback({ params }: Props) {
  const { locale } = await params;
  
  // Redirect non-Swedish locales to home page
  if (locale !== 'sv') {
    redirect(`/${locale}`);
  }

  const t = await getTranslations('SwedishTrialFeedback');

  return <SwedishTrialFeedbackPage locale={locale} />;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations('SwedishTrialFeedback');

  return {
    title: t('meta.title', { default: 'Feedback - TrustyFinance Sverige Beta' }),
    description: t('meta.description', { 
      default: 'Hjälp oss att förbättra TrustyFinance för svenska företag. Dela dina tankar och förslag.' 
    }),
  };
}
