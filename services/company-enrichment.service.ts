/**
 * Company Enrichment Service
 * 
 * Service layer for company data enrichment
 * Handles all business logic and API communication
 * 
 * Architecture: Service Layer Pattern
 * - Separates business logic from UI
 * - Provides reusable API methods
 * - Handles error management
 * - Type-safe with proper interfaces
 */

import type {
  EnrichmentRequest,
  EnrichmentResponse,
  YTJResponse,
  EnrichedCompanyData,
} from '@/types/company-enrichment';

export class CompanyEnrichmentService {
  /**
   * Enrich company data using YTJ + AI
   * 
   * @param request - Enrichment request parameters
   * @param token - Supabase auth token
   * @returns Enriched company data with quality indicators
   */
  static async enrichCompany(
    request: EnrichmentRequest,
    token: string
  ): Promise<EnrichmentResponse> {
    try {
      console.log('🔍 [Service] Enriching company:', request.businessId);

      const response = await fetch('/api/companies/enrich', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Enrichment failed');
      }

      const data: EnrichmentResponse = await response.json();
      console.log('✅ [Service] Enrichment complete:', data.metadata);

      return data;
    } catch (error) {
      console.error('❌ [Service] Enrichment error:', error);
      throw error;
    }
  }

  /**
   * Search companies from YTJ registry
   * 
   * @param query - Search query (company name or business ID)
   * @param token - Supabase auth token
   * @returns List of matching companies
   */
  static async searchYTJ(
    query: string,
    token: string
  ): Promise<YTJResponse> {
    try {
      console.log('🔍 [Service] Searching YTJ:', query);

      const isBusinessId = /^\d{7}-\d$/.test(query);
      const params = new URLSearchParams(
        isBusinessId ? { businessId: query } : { q: query }
      );

      const response = await fetch(`/api/ytj/search?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'YTJ search failed');
      }

      const data: YTJResponse = await response.json();
      console.log('✅ [Service] YTJ search complete:', data.totalResults, 'results');

      return data;
    } catch (error) {
      console.error('❌ [Service] YTJ search error:', error);
      throw error;
    }
  }

  /**
   * Validate Finnish business ID format
   */
  static validateBusinessId(businessId: string): boolean {
    return /^\d{7}-\d$/.test(businessId);
  }

  /**
   * Format business ID (add dash if missing)
   */
  static formatBusinessId(input: string): string | null {
    // Remove all non-digits
    const digits = input.replace(/\D/g, '');

    // Check if we have 8 digits
    if (digits.length === 8) {
      return `${digits.substring(0, 7)}-${digits.substring(7)}`;
    }

    // Check if already formatted
    if (this.validateBusinessId(input)) {
      return input;
    }

    return null;
  }

  /**
   * Calculate completeness score for enriched data
   */
  static calculateCompleteness(data: EnrichedCompanyData): number {
    let score = 0;
    const maxScore = 100;

    // Basic info (50 points)
    if (data.basicInfo.name) score += 10;
    if (data.basicInfo.industry) score += 10;
    if (data.basicInfo.companyForm) score += 5;
    if (data.basicInfo.address) score += 5;
    if (data.basicInfo.website) score += 5;
    if (data.basicInfo.employees) score += 5;
    if (data.basicInfo.description) score += 5;
    if (data.basicInfo.products?.length) score += 5;

    // Financial data (50 points)
    const yearsWithData = data.financialData.yearly.length;
    if (yearsWithData >= 1) score += 15;
    if (yearsWithData >= 3) score += 20;
    if (yearsWithData >= 5) score += 15;

    return Math.min(Math.round((score / maxScore) * 100), 100);
  }

  /**
   * Determine if data is safe to use (verified or high confidence)
   */
  static isSafeToUse(data: EnrichedCompanyData): boolean {
    const { dataQuality } = data.basicInfo;

    // Verified data is always safe
    if (dataQuality.verified) return true;

    // High confidence with few missing fields is acceptable
    if (
      dataQuality.confidence === 'HIGH' &&
      dataQuality.missingFields.length <= 1 &&
      !dataQuality.needsVerification
    ) {
      return true;
    }

    // Otherwise, needs user verification
    return false;
  }

  /**
   * Get critical warnings that block saving
   */
  static getCriticalWarnings(data: EnrichedCompanyData): string[] {
    const warnings: string[] = [];
    const { dataQuality } = data.basicInfo;

    if (dataQuality.confidence === 'LOW') {
      warnings.push('Datan luotettavuus on matala - tarkista kaikki tiedot huolellisesti');
    }

    if (dataQuality.missingFields.length > 2) {
      warnings.push(`Useita puuttuvia kenttiä: ${dataQuality.missingFields.join(', ')}`);
    }

    if (!dataQuality.verified && dataQuality.aiGenerated) {
      warnings.push('AI-generoitu data vaatii käyttäjän vahvistuksen');
    }

    if (data.financialData.yearsFound === 0) {
      warnings.push('Taloustietoja ei löytynyt - lisää ne manuaalisesti');
    }

    return warnings;
  }
}

