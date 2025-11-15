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
import { cookies } from 'next/headers';
import EnrichmentClient from './enrichment-client';

interface PageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function CompanyEnrichPage({ params }: PageProps) {
  const { id, locale } = await params;
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  console.log('🔐 Enrich Page Auth Debug:', {
    hasUser: !!user,
    userId: user?.id,
    authError: authError?.message,
    path: `/fi/dashboard/companies/${id}/enrich`
  });

  if (!user || authError) {
    console.error('❌ No user or auth error, redirecting to sign-in');
    redirect(`/${locale}/auth/sign-in`);
    return null;
  }

  console.log('✅ User authenticated:', user.email);

  // Get user's profile and organization
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      id,
      user_organizations(
        organization_id,
        role,
        active
      )
    `)
    .eq('id', user.id)
    .single();

  const userOrgs = profile?.user_organizations?.[0];

  // Verify company exists and user has access
  const { data: company, error } = await supabase
    .from('companies')
    .select('id, name, organization_id')
    .eq('id', id)
    .single();

  console.log('🏢 Company Access Debug:', {
    companyId: id,
    companyName: company?.name,
    companyError: error?.message,
    userOrg: userOrgs?.organization_id,
    companyOrg: company?.organization_id,
    hasAccess: userOrgs?.organization_id === company?.organization_id
  });

  if (error) {
    console.error('❌ Company fetch error:', error);
    redirect(`/${locale}/dashboard/companies`);
    return null;
  }

  if (!company) {
    console.error('❌ Company not found');
    redirect(`/${locale}/dashboard/companies`);
    return null;
  }

  // Check if user has access to this company's organization
  if (userOrgs && company.organization_id !== userOrgs.organization_id) {
    console.error('❌ User does not have access to this company');
    redirect(`/${locale}/dashboard/companies`);
    return null;
  }

  console.log('✅ Access granted to company:', company.name);

  return <EnrichmentClient companyId={id} companyName={company.name} locale={locale} />;
}

