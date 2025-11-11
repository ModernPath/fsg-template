/**
 * 🔄 Company Enrichment Monitor
 * 
 * Real-time monitoring of company financial data enrichment
 * Uses Supabase Realtime to update UI automatically
 * 
 * USAGE:
 * ```tsx
 * <CompanyEnrichmentMonitor companyId={company.id} />
 * ```
 */

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

interface Company {
  id: string;
  name: string;
  enrichment_status: 'pending' | 'enriching' | 'enriched' | 'pending_documents' | 'failed';
  enrichment_method?: string | null;
  enrichment_confidence?: number | null;
  enrichment_layers_attempted?: string | null;
  enrichment_started_at?: string | null;
  enrichment_completed_at?: string | null;
  metadata?: {
    company_info?: {
      method?: string;
      confidence?: number;
      sources?: string[];
      last_updated?: string;
      language?: string;
    };
  } | null;
}

interface CompanyMetric {
  year: number;
  revenue?: number | null;
  profit?: number | null;
  net_result?: number | null;
  employees?: number | null;
  currency: string;
  data_source?: string | null;
  confidence_score?: number | null;
}

interface Props {
  companyId: string;
}

export default function CompanyEnrichmentMonitor({ companyId }: Props) {
  const [company, setCompany] = useState<Company | null>(null);
  const [metrics, setMetrics] = useState<CompanyMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // 1. Load initial data
    async function loadInitialData() {
      try {
        // Load company
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyId)
          .single();

        if (companyError) throw companyError;
        setCompany(companyData);

        // Load metrics
        const { data: metricsData, error: metricsError } = await supabase
          .from('company_metrics')
          .select('*')
          .eq('company_id', companyId)
          .order('year', { ascending: false });

        if (metricsError) throw metricsError;
        setMetrics(metricsData || []);

        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setLoading(false);
      }
    }

    loadInitialData();

    // 2. Subscribe to company updates (enrichment_status changes)
    const companyChannel = supabase
      .channel(`company-${companyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'companies',
          filter: `id=eq.${companyId}`,
        },
        (payload) => {
          console.log('🔄 Company updated:', payload.new);
          setCompany(payload.new as Company);
        }
      )
      .subscribe();

    // 3. Subscribe to metrics updates (new financial data)
    const metricsChannel = supabase
      .channel(`metrics-${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT or UPDATE
          schema: 'public',
          table: 'company_metrics',
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          console.log('📊 Metrics updated:', payload.new);
          
          const newMetric = payload.new as CompanyMetric;
          
          setMetrics((prev) => {
            // Check if metric for this year already exists
            const existingIndex = prev.findIndex((m) => m.year === newMetric.year);
            
            if (existingIndex >= 0) {
              // Update existing
              const updated = [...prev];
              updated[existingIndex] = newMetric;
              return updated.sort((a, b) => b.year - a.year);
            } else {
              // Add new
              return [newMetric, ...prev].sort((a, b) => b.year - a.year);
            }
          });
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      companyChannel.unsubscribe();
      metricsChannel.unsubscribe();
    };
  }, [companyId]);

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">❌ Error: {error}</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg">
        <p className="text-gray-600">Company not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enrichment Status */}
      <div className="p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Company Background Enrichment</h3>

        {company.enrichment_status === 'pending' && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <div>
                <p className="font-medium text-blue-900">⏳ Queued for enrichment</p>
                <p className="text-sm text-blue-700 mt-1">
                  Company background information will be loaded shortly...
                </p>
              </div>
            </div>
          </div>
        )}

        {company.enrichment_status === 'enriching' && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="animate-pulse rounded-full h-5 w-5 bg-yellow-500"></div>
              <div>
                <p className="font-medium text-yellow-900">🔄 Loading company information...</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Fetching overview, products, market position from public sources
                </p>
                {company.metadata?.company_info?.language && (
                  <p className="text-xs text-yellow-600 mt-1">
                    Language: {company.metadata.company_info.language.toUpperCase()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {(company.enrichment_status === 'enriched' || company.enrichment_status === 'pending_documents') && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <div>
              <p className="font-medium text-green-900">✅ Company background information loaded!</p>
              <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                {company.metadata?.company_info?.method && (
                  <div>
                    <p className="text-green-700">Method:</p>
                    <p className="font-medium text-green-900">{company.metadata.company_info.method}</p>
                  </div>
                )}
                {company.metadata?.company_info?.confidence && (
                  <div>
                    <p className="text-green-700">Confidence:</p>
                    <p className="font-medium text-green-900">{company.metadata.company_info.confidence}%</p>
                  </div>
                )}
                {company.metadata?.company_info?.language && (
                  <div>
                    <p className="text-green-700">Language:</p>
                    <p className="font-medium text-green-900">{company.metadata.company_info.language.toUpperCase()}</p>
                  </div>
                )}
                {company.metadata?.company_info?.sources && (
                  <div>
                    <p className="text-green-700">Sources:</p>
                    <p className="font-medium text-green-900">{company.metadata.company_info.sources.length} sources</p>
                  </div>
                )}
              </div>
              
              {company.enrichment_status === 'pending_documents' && (
                <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded">
                  <p className="text-sm font-medium text-orange-900">📄 Financial data required</p>
                  <p className="text-xs text-orange-700 mt-1">
                    Please upload your financial statement (tilinpäätös) to get accurate financial metrics and funding recommendations.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {company.enrichment_status === 'failed' && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <p className="font-medium text-red-900">❌ Could not load company information</p>
            <p className="text-sm text-red-700 mt-1">
              Unable to fetch company background automatically. Please add information manually.
            </p>
            {company.enrichment_layers_attempted && (
              <p className="text-xs text-red-600 mt-2">
                Attempted: {company.enrichment_layers_attempted}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Financial Metrics */}
      {metrics.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b">
            <h3 className="text-lg font-semibold">
              Financial Data ({metrics.length} {metrics.length === 1 ? 'year' : 'years'})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Year
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profit
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employees
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics.map((metric) => (
                  <tr key={metric.year} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {metric.year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {metric.revenue ? `${metric.revenue.toLocaleString()} ${metric.currency}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {metric.profit ? `${metric.profit.toLocaleString()} ${metric.currency}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {metric.employees?.toLocaleString() || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                      {metric.data_source}
                      {metric.confidence_score && (
                        <span className="ml-2 text-gray-400">({metric.confidence_score}%)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

