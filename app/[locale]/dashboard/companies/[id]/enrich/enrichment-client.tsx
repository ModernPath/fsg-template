'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface Props {
  companyId: string;
  companyName: string;
  locale: string;
}

export default function EnrichmentClient({ companyId, companyName, locale }: Props) {
  const t = useTranslations('enrichment');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartEnrichment = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🚀 Starting enrichment for company:', companyId);
      
      const res = await fetch(`/api/companies/${companyId}/enrich`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modules: null, // null = all modules
          force: false,
          priority: 'normal',
        }),
      });

      console.log('📡 Enrichment API response status:', res.status);

      if (!res.ok) {
        const data = await res.json();
        console.error('❌ Enrichment API error:', data);
        throw new Error(data.error || 'Failed to start enrichment');
      }

      const result = await res.json();
      console.log('✅ Enrichment started:', result);

      // Redirect to enriched data page
      router.push(`/${locale}/dashboard/companies/${companyId}/enriched`);
    } catch (err) {
      console.error('❌ Enrichment client error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl space-y-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/dashboard/companies`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{companyName}</h1>
          <p className="text-muted-foreground">{t('title')}</p>
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t('cardTitle')}
          </CardTitle>
          <CardDescription>{t('cardDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Module Overview */}
          <div className="space-y-4">
            <h3 className="font-semibold">{t('modulesTitle')}</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {/* Base Modules */}
              <div className="rounded-lg border p-4">
                <h4 className="mb-2 font-medium text-primary">{t('baseModules')}</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>✓ {t('modules.basicInfo')}</li>
                  <li>✓ {t('modules.financial')}</li>
                  <li>✓ {t('modules.industry')}</li>
                  <li>✓ {t('modules.competitive')}</li>
                  <li>✓ {t('modules.growth')}</li>
                  <li>✓ {t('modules.health')}</li>
                  <li>✓ {t('modules.personnel')}</li>
                  <li>✓ {t('modules.market')}</li>
                  <li>✓ {t('modules.web')}</li>
                </ul>
              </div>

              {/* M&A Modules */}
              <div className="rounded-lg border p-4">
                <h4 className="mb-2 font-medium text-primary">{t('maModules')}</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>✓ {t('modules.maHistory')}</li>
                  <li>✓ {t('modules.valuation')}</li>
                  <li>✓ {t('modules.customers')}</li>
                  <li>✓ {t('modules.operations')}</li>
                  <li>✓ {t('modules.advantages')}</li>
                  <li>✓ {t('modules.risks')}</li>
                  <li>✓ {t('modules.integration')}</li>
                  <li>✓ {t('modules.exit')}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Timeline Estimate */}
          <div className="rounded-lg border bg-muted p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <Loader2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">{t('timelineTitle')}</h4>
                <p className="text-sm text-muted-foreground">{t('timelineDescription')}</p>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-center pt-4">
            <Button 
              size="lg" 
              onClick={handleStartEnrichment}
              disabled={loading}
              className="min-w-[200px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('starting')}
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {t('startButton')}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

