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
import CompanyEnrichedData from '@/components/companies/CompanyEnrichedData';
import EnrichmentProgress from '@/components/companies/EnrichmentProgress';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

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

  return (
    <div className="container mx-auto space-y-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4">
            <Link href={`/${locale}/dashboard/companies/${id}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{company.name}</h1>
              <p className="text-muted-foreground">{t('subtitle')}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/${locale}/dashboard/companies/${id}/enrich`}>
            <Button variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('refreshData')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Enrichment Progress (if in progress) */}
      <EnrichmentProgress 
        companyId={id} 
        onComplete={() => {
          // Reload page when enrichment completes
          window.location.reload();
        }}
      />

      {/* Enriched Data */}
      {hasEnrichedData ? (
        <CompanyEnrichedData companyId={id} />
      ) : (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="mx-auto max-w-md space-y-4">
            <h3 className="text-2xl font-semibold">{t('noData')}</h3>
            <p className="text-muted-foreground">{t('noDataDescription')}</p>
            <Link href={`/${locale}/dashboard/companies/${id}/enrich`}>
              <Button size="lg">
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('startEnrichment')}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

