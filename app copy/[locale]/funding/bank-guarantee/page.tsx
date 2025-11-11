'use server';

import { getTranslations } from 'next-intl/server';
import { setupServerLocale } from '@/app/i18n/server-utils';

interface Props {
  params: {
    locale: string;
  };
}

export default async function BankGuaranteePage({ params }: Props) {
  const { locale } = params;
  await setupServerLocale(locale);
  const t = await getTranslations('Onboarding');
  const pageTitle = t('recommendationType.bank_guarantee', { default: 'Bank Guarantee' });

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4 text-gold-primary">{pageTitle}</h1>
      <p className="text-gray-light">
        {t('fundingPage.placeholder', { type: pageTitle, default: `Detailed information about ${pageTitle} will be added here.` })}
      </p>
      {/* Add specific content for Bank Guarantee here */}
    </main>
  );
} 