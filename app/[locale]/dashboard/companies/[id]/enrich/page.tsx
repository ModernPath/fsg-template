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

  // Get user's organization first
  const { data: userOrgs } = await supabase
    .from('user_organizations')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('active', true)
    .maybeSingle();

  // Verify company exists and user has access
  const { data: company, error } = await supabase
    .from('companies')
    .select('id, name, organization_id')
    .eq('id', id)
    .single();

  console.log('Enrichment debug:', {
    companyId: id,
    company,
    error: error?.message,
    userOrg: userOrgs?.organization_id,
    companyOrg: company?.organization_id
  });

  if (error) {
    console.error('Company fetch error:', error);
    redirect(`/${locale}/dashboard/companies`);
  }

  if (!company) {
    console.error('Company not found');
    redirect(`/${locale}/dashboard/companies`);
  }

  // Check if user has access to this company's organization
  if (userOrgs && company.organization_id !== userOrgs.organization_id) {
    console.error('User does not have access to this company');
    redirect(`/${locale}/dashboard/companies`);
  }

  return <EnrichmentClient companyId={id} companyName={company.name} locale={locale} />;
}

