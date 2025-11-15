'use client';

/**
 * Company Enrichment Trigger Page
 * 
 * Allows users to start/restart company enrichment
 * 
 * Route: /[locale]/companies/[id]/enrich
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import EnrichmentClient from './enrichment-client';

export default function CompanyEnrichPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'fi';
  const id = params?.id as string;
  
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAccess() {
      try {
        console.log('🔐 Client-side auth check starting...');
        
        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        console.log('🔐 Auth result:', {
          hasUser: !!user,
          userId: user?.id,
          authError: authError?.message,
        });

        if (!user || authError) {
          console.error('❌ No user, redirecting to sign-in');
          router.push(`/${locale}/auth/sign-in`);
          return;
        }

        console.log('✅ User authenticated:', user.email);

        // Get user's organization
        const { data: userOrg } = await supabase
          .from('user_organizations')
          .select('organization_id')
          .eq('user_id', user.id)
          .eq('active', true)
          .single();

        // Verify company exists and user has access
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .select('id, name, organization_id')
          .eq('id', id)
          .single();

        console.log('🏢 Company check:', {
          companyId: id,
          companyName: company?.name,
          companyError: companyError?.message,
          userOrg: userOrg?.organization_id,
          companyOrg: company?.organization_id,
        });

        if (companyError || !company) {
          console.error('❌ Company not found');
          router.push(`/${locale}/dashboard/companies`);
          return;
        }

        // Check access
        if (userOrg && company.organization_id !== userOrg.organization_id) {
          console.error('❌ Access denied');
          router.push(`/${locale}/dashboard/companies`);
          return;
        }

        console.log('✅ Access granted to company:', company.name);
        setCompanyName(company.name);
        setLoading(false);
      } catch (err) {
        console.error('❌ Error in access check:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    }

    checkAccess();
  }, [id, locale, router, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return <EnrichmentClient companyId={id} companyName={companyName} locale={locale} />;
}

