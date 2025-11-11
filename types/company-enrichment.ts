/**
 * Company Enrichment Types
 * 
 * Type definitions for BizExit company enrichment system
 * Ensures type safety across the entire enrichment ecosystem
 */

// ============================================================================
// DATA QUALITY TYPES
// ============================================================================

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type DataSourceType = 'OFFICIAL' | 'PUBLIC' | 'AI_EXTRACTED' | 'USER_PROVIDED';

export interface DataSource {
  url: string;
  name: string;
  verified: boolean;
  accessedAt: Date;
  dataType: DataSourceType;
}

export interface DataQuality {
  verified: boolean; // YTJ-vahvistettu tai muusta virallisesta lähteestä
  aiGenerated: boolean; // AI-generoitu (VAIN tekstit, EI numerot)
  needsVerification: boolean; // Vaatii käyttäjän vahvistuksen
  confidence: ConfidenceLevel;
  missingFields: string[]; // Puuttuvat kentät (ei keksitä!)
  sources: DataSource[]; // Kaikki käytetyt lähteet
  verificationTimestamp?: Date; // Milloin vahvistettu
  verifiedBy?: string; // Kuka vahvisti (user_id)
}

// ============================================================================
// COMPANY BASIC INFO
// ============================================================================

export interface CompanyBasicInfo {
  name: string;
  businessId: string;
  industry?: string;
  companyForm?: string; // Oy, Oyj, Ay, etc.
  registrationDate?: string;
  address?: string;
  website?: string;
  employees?: number | null;
  description?: string;
  products?: string[];
  marketPosition?: string;
  recentNews?: string[];
  dataQuality: DataQuality;
}

// ============================================================================
// FINANCIAL DATA
// ============================================================================

/**
 * CRITICAL: Financial data MUST come from verified sources
 * - NEVER AI-generated
 * - Always include source URL
 * - If data not found → set to null (don't fabricate)
 */
export interface YearlyFinancialData {
  year: number;
  revenue: number | null; // ONLY from Finder.fi, Asiakastieto.fi, or user upload
  operatingProfit: number | null; // ONLY from verified sources
  netProfit: number | null; // ONLY from verified sources
  totalAssets: number | null; // ONLY from verified sources
  equity: number | null; // ONLY from verified sources
  totalLiabilities: number | null; // ONLY from verified sources
  source: DataSource; // REQUIRED: Must track exact source
  confidence: ConfidenceLevel;
  dataQuality: {
    verified: boolean; // True only if from official source
    extractedByAI: boolean; // True if AI extracted from document/website
    needsVerification: boolean; // True if extracted (not official)
  };
}

export type Currency = 'EUR' | 'SEK' | 'NOK' | 'DKK';

export interface CompanyFinancialData {
  yearly: YearlyFinancialData[];
  currency: Currency;
  lastUpdated: Date;
  sourcesUsed: string[];
  yearsFound: number;
}

// ============================================================================
// ENRICHED DATA
// ============================================================================

export interface EnrichedCompanyData {
  basicInfo: CompanyBasicInfo;
  financialData: CompanyFinancialData;
  searchQueriesUsed: string[];
  sourcesFound: string[];
  confidence: number; // 0-100
  extractedAt: Date;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface EnrichmentRequest {
  businessId: string;
  companyName?: string;
  country?: string;
  industry?: string;
  website?: string;
  locale?: string;
}

export interface EnrichmentWarning {
  type: 
    | 'NEEDS_VERIFICATION'        // User must verify extracted data
    | 'AI_GENERATED_TEXT'          // AI generated description (OK)
    | 'NO_FINANCIAL_DATA'          // Financial data not found (NOT fabricated)
    | 'LOW_CONFIDENCE'             // Low confidence in extraction
    | 'MISSING_CRITICAL_DATA'      // Critical field missing (marked as null)
    | 'UNVERIFIED_SOURCE';         // Source not from official registry
  message: string;
  fields?: string[];
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
}

export interface EnrichmentResponse {
  success: boolean;
  data?: EnrichedCompanyData;
  warnings: EnrichmentWarning[];
  metadata: {
    enrichedAt: Date;
    dataQuality: DataQuality;
    financialYears: number;
    confidence: number;
  };
  error?: string;
  details?: string;
}

// ============================================================================
// YTJ API TYPES
// ============================================================================

export interface YTJAddress {
  street?: string;
  postCode?: string;
  city?: string;
  country?: string;
}

export interface YTJCompanyData {
  businessId: string;
  name: string;
  companyForm?: string;
  registrationDate?: string;
  address?: YTJAddress;
  industry?: string;
  status?: string;
  businessLine?: string;
}

export interface YTJResponse {
  success: boolean;
  data: YTJCompanyData[];
  totalResults: number;
  error?: string;
}

// ============================================================================
// STATE MANAGEMENT TYPES
// ============================================================================

export interface EnrichmentState {
  loading: boolean;
  data: EnrichedCompanyData | null;
  warnings: EnrichmentWarning[];
  error: string | null;
  lastUpdated: Date | null;
}

export interface EnrichmentActions {
  enrich: (request: EnrichmentRequest) => Promise<void>;
  verifyField: (fieldName: string) => void;
  verifyAll: () => void;
  reset: () => void;
}

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

export interface UseCompanyEnrichmentReturn extends EnrichmentState, EnrichmentActions {
  canSave: boolean; // Can user save data?
  needsUserAction: boolean; // Does user need to verify?
}

