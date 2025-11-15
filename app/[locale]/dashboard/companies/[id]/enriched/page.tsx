/**
 * Company Enriched Data Page
 * 
 * Displays enriched company data from all 17 modules
 * 
 * Route: /[locale]/companies/[id]/enriched
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import EnrichedDataClient from './enriched-client';

interface PageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'enrichment.enriched' });
  
  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
  };
}

export default async function CompanyEnrichedDataPage({ params }: PageProps) {
  const { id, locale } = await params;
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);
  const t = await getTranslations({ locale, namespace: 'enrichment.enriched' });

  // Verify authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // Get company details
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .single();

  if (companyError || !company) {
    notFound();
  }

  // Check if enrichment data exists
  const { data: enrichedData } = await supabase
    .from('company_enriched_data')
    .select('id')
    .eq('company_id', id)
    .single();

  const hasEnrichedData = !!enrichedData;

  // Use Client Component for interactive features
  return (
    <EnrichedDataClient 
      companyId={id}
      companyName={company.name}
      locale={locale}
      hasEnrichedData={hasEnrichedData}
    />
  );
}

