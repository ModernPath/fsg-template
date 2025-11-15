/**
 * Company Enrichment Trigger Page
 * 
 * Allows users to start/restart company enrichment
 * 
 * Route: /[locale]/companies/[id]/enrich
 */

import { getTranslations } from 'next-intl/server';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import EnrichmentClient from './enrichment-client';

interface PageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function CompanyEnrichPage({ params }: PageProps) {
  const { id, locale } = await params;
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/sign-in`);
  }

  // Verify company exists and user has access
  const { data: company, error } = await supabase
    .from('companies')
    .select('id, name')
    .eq('id', id)
    .single();

  if (error || !company) {
    redirect(`/${locale}/dashboard/companies`);
  }

  return <EnrichmentClient companyId={id} companyName={company.name} locale={locale} />;
}

