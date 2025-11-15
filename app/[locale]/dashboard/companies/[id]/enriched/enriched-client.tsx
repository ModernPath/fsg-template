/**
 * Client Component Wrapper for Enriched Data Page
 * Handles client-side interactions like progress monitoring and page refresh
 */

'use client';

import { useRouter } from 'next/navigation';
import EnrichmentProgress from '@/components/companies/EnrichmentProgress';
import CompanyEnrichedData from '@/components/companies/CompanyEnrichedData';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface EnrichedDataClientProps {
  companyId: string;
  companyName: string;
  locale: string;
  hasEnrichedData: boolean;
}

export default function EnrichedDataClient({
  companyId,
  companyName,
  locale,
  hasEnrichedData,
}: EnrichedDataClientProps) {
  const router = useRouter();
  const t = useTranslations('enrichment.enriched');

  const handleEnrichmentComplete = () => {
    // Refresh the page to show newly enriched data
    router.refresh();
  };

  return (
    <div className="container mx-auto space-y-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4">
            <Link href={`/${locale}/dashboard/companies/${companyId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{companyName}</h1>
              <p className="text-muted-foreground">{t('subtitle')}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/${locale}/dashboard/companies/${companyId}/enrich`}>
            <Button variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('refreshData')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Enrichment Progress (if in progress) */}
      <EnrichmentProgress 
        companyId={companyId} 
        onComplete={handleEnrichmentComplete}
      />

      {/* Enriched Data */}
      {hasEnrichedData ? (
        <CompanyEnrichedData companyId={companyId} />
      ) : (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="mx-auto max-w-md space-y-4">
            <h3 className="text-2xl font-semibold">{t('noData')}</h3>
            <p className="text-muted-foreground">{t('noDataDescription')}</p>
            <Link href={`/${locale}/dashboard/companies/${companyId}/enrich`}>
              <Button>
                {t('startEnrichment')}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

