/**
 * useCompanyEnrichment Hook
 * 
 * React hook for company data enrichment
 * Provides clean API for UI components
 * 
 * Architecture: Custom React Hook Pattern
 * - Manages enrichment state
 * - Provides actions (enrich, verify, reset)
 * - Handles loading & error states
 * - Type-safe with proper interfaces
 * 
 * Usage:
 * ```tsx
 * const { 
 *   data, 
 *   loading, 
 *   warnings, 
 *   enrich, 
 *   canSave 
 * } = useCompanyEnrichment();
 * 
 * await enrich({ businessId: '1234567-8' });
 * ```
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { CompanyEnrichmentService } from '@/services/company-enrichment.service';
import type {
  EnrichmentRequest,
  EnrichedCompanyData,
  EnrichmentWarning,
  UseCompanyEnrichmentReturn,
} from '@/types/company-enrichment';

export function useCompanyEnrichment(): UseCompanyEnrichmentReturn {
  const { session } = useAuth();

  // State
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EnrichedCompanyData | null>(null);
  const [warnings, setWarnings] = useState<EnrichmentWarning[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [verifiedFields, setVerifiedFields] = useState<Set<string>>(new Set());

  /**
   * Enrich company data
   */
  const enrich = useCallback(
    async (request: EnrichmentRequest) => {
      if (!session?.access_token) {
        setError('Ei kirjautumista - kirjaudu sisään');
        return;
      }

      setLoading(true);
      setError(null);
      setWarnings([]);

      try {
        console.log('🔍 [Hook] Starting enrichment:', request);

        const response = await CompanyEnrichmentService.enrichCompany(
          request,
          session.access_token
        );

        if (response.success && response.data) {
          setData(response.data);
          setWarnings(response.warnings);
          setLastUpdated(new Date());
          console.log('✅ [Hook] Enrichment successful');
        } else {
          throw new Error(response.error || 'Enrichment failed');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Tuntematon virhe';
        console.error('❌ [Hook] Enrichment failed:', message);
        setError(message);
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [session?.access_token]
  );

  /**
   * Mark a field as verified by user
   */
  const verifyField = useCallback((fieldName: string) => {
    setVerifiedFields((prev) => {
      const updated = new Set(prev);
      updated.add(fieldName);
      return updated;
    });
  }, []);

  /**
   * Mark all fields as verified
   */
  const verifyAll = useCallback(() => {
    if (!data) return;

    const allFields = [
      'name',
      'industry',
      'companyForm',
      'address',
      'website',
      'employees',
      'description',
      ...data.basicInfo.dataQuality.missingFields,
    ];

    setVerifiedFields(new Set(allFields));

    // Update data quality
    if (data.basicInfo.dataQuality) {
      const updatedData = {
        ...data,
        basicInfo: {
          ...data.basicInfo,
          dataQuality: {
            ...data.basicInfo.dataQuality,
            needsVerification: false,
            verificationTimestamp: new Date(),
          },
        },
      };
      setData(updatedData);
    }
  }, [data]);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setData(null);
    setWarnings([]);
    setError(null);
    setLastUpdated(null);
    setVerifiedFields(new Set());
    setLoading(false);
  }, []);

  // Computed values
  const needsUserAction = data
    ? data.basicInfo.dataQuality.needsVerification ||
      warnings.some((w) => w.type === 'NEEDS_VERIFICATION' || w.type === 'AI_GENERATED')
    : false;

  const canSave = data
    ? CompanyEnrichmentService.isSafeToUse(data) ||
      verifiedFields.size >= data.basicInfo.dataQuality.missingFields.length
    : false;

  return {
    // State
    loading,
    data,
    warnings,
    error,
    lastUpdated,

    // Actions
    enrich,
    verifyField,
    verifyAll,
    reset,

    // Computed
    canSave,
    needsUserAction,
  };
}

/**
 * useYTJSearch Hook
 * 
 * Separate hook for YTJ company search
 */
export function useYTJSearch() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(
    async (query: string) => {
      if (!session?.access_token) {
        setError('Ei kirjautumista');
        return;
      }

      if (!query || query.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await CompanyEnrichmentService.searchYTJ(
          query,
          session.access_token
        );

        if (response.success) {
          setResults(response.data);
        } else {
          throw new Error(response.error || 'YTJ haku epäonnistui');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Tuntematon virhe';
        setError(message);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [session?.access_token]
  );

  const reset = useCallback(() => {
    setResults([]);
    setError(null);
    setLoading(false);
  }, []);

  return {
    loading,
    results,
    error,
    search,
    reset,
  };
}

