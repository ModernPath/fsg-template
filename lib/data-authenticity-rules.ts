/**
 * DATA AUTHENTICITY RULES
 * 
 * CRITICAL: NO FAKE DATA, ESPECIALLY FINANCIAL DATA
 * 
 * Rules:
 * 1. Financial data ONLY from verified sources (Finder.fi, Asiakastieto.fi, YTJ)
 * 2. AI NEVER generates numerical financial data
 * 3. AI can only:
 *    - Analyze existing data
 *    - Generate descriptive text (summaries, recommendations)
 *    - Extract data from documents
 * 4. If data not found → mark as missing, don't fabricate
 * 5. Always track data source and verification status
 * 
 * AI Usage:
 * ✅ ALLOWED:
 *    - Analyze trends from existing data
 *    - Generate business descriptions
 *    - Recommend actions based on real data
 *    - Extract data from PDFs/documents
 *    - Summarize existing information
 * 
 * ❌ FORBIDDEN:
 *    - Generate revenue numbers
 *    - Fabricate profit/loss figures
 *    - Invent employee counts
 *    - Create fake financial metrics
 *    - Estimate missing financial data
 */

export interface DataSource {
  url: string;
  name: string;
  verified: boolean;
  accessedAt: Date;
  dataType: 'OFFICIAL' | 'PUBLIC' | 'AI_EXTRACTED' | 'USER_PROVIDED';
}

export interface VerifiedData<T> {
  value: T;
  source: DataSource;
  verified: boolean;
  confidence: 'VERIFIED' | 'EXTRACTED' | 'UNVERIFIED';
}

/**
 * Data types that MUST be from verified sources
 */
export const CRITICAL_DATA_FIELDS = [
  'revenue',
  'operatingProfit',
  'netProfit',
  'totalAssets',
  'equity',
  'totalLiabilities',
  'employees',
  'registrationDate',
  'businessId',
] as const;

/**
 * Data types that CAN be AI-generated
 */
export const AI_GENERATABLE_FIELDS = [
  'description',
  'marketPosition',
  'products',
  'analysis',
  'recommendations',
  'summary',
] as const;

/**
 * Validate that critical data has proper sources
 */
export function validateDataSource(
  fieldName: string,
  value: any,
  source?: DataSource
): boolean {
  // Critical fields MUST have verified sources
  if (CRITICAL_DATA_FIELDS.includes(fieldName as any)) {
    if (!source) {
      throw new Error(
        `CRITICAL: Field "${fieldName}" requires verified source. Found: ${value} with no source.`
      );
    }

    if (!source.verified) {
      throw new Error(
        `CRITICAL: Field "${fieldName}" requires verified source. Source "${source.name}" is not verified.`
      );
    }

    if (source.dataType === 'AI_EXTRACTED' && !source.url) {
      throw new Error(
        `CRITICAL: Field "${fieldName}" cannot be AI-generated. Value: ${value}`
      );
    }
  }

  return true;
}

/**
 * Mark data as missing instead of fabricating
 */
export function markAsMissing<T>(fieldName: string, reason: string): VerifiedData<T | null> {
  console.warn(`⚠️ Missing data: ${fieldName} - ${reason}`);
  
  return {
    value: null,
    source: {
      url: '',
      name: 'NOT_FOUND',
      verified: false,
      accessedAt: new Date(),
      dataType: 'PUBLIC',
    },
    verified: false,
    confidence: 'UNVERIFIED',
  };
}

/**
 * Wrap verified data with source tracking
 */
export function verifyData<T>(
  value: T,
  source: DataSource,
  fieldName: string
): VerifiedData<T> {
  // Validate source
  validateDataSource(fieldName, value, source);

  return {
    value,
    source,
    verified: source.verified,
    confidence: source.dataType === 'OFFICIAL' ? 'VERIFIED' : 'EXTRACTED',
  };
}

/**
 * Check if AI can generate this field
 */
export function canAIGenerate(fieldName: string): boolean {
  return AI_GENERATABLE_FIELDS.includes(fieldName as any);
}

/**
 * Validate entire data object
 */
export function validateDataObject(data: Record<string, any>, sources: Record<string, DataSource>): void {
  for (const fieldName of CRITICAL_DATA_FIELDS) {
    if (data[fieldName] !== null && data[fieldName] !== undefined) {
      validateDataSource(fieldName, data[fieldName], sources[fieldName]);
    }
  }
}

