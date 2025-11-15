/**
 * Company Enrichment Type Definitions
 * 
 * Complete type system for 17 enrichment modules:
 * - Modules 1-9: Trusty Finance Base
 * - Modules 10-17: BizExit M&A Extensions
 */

// =============================================================================
// Common Types
// =============================================================================

export type Currency = 'EUR' | 'USD' | 'SEK' | 'NOK' | 'DKK' | 'GBP';
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type DataSourceType = 'API' | 'WEB_SCRAPE' | 'AI_GENERATED' | 'USER_PROVIDED';

export interface DataQuality {
  verified: boolean;
  aiGenerated: boolean;
  needsVerification: boolean;
  confidence: ConfidenceLevel;
  missingFields: string[];
}

export interface DataSource {
  name: string;
  type: DataSourceType;
  url?: string;
  timestamp: Date;
}

// =============================================================================
// MODULE 1: Company Basic Information
// =============================================================================

export interface CompanyBasicInfo {
  name: string;
  businessId: string;
  industry?: string;
  companyForm?: string;
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

// =============================================================================
// MODULE 2: Financial Data (Multi-year)
// =============================================================================

export interface YearlyFinancialData {
  year: number;
  // Income Statement
  revenue: number | null;
  operatingProfit: number | null;
  netProfit: number | null;
  ebitda: number | null;
  // Balance Sheet
  totalAssets: number | null;
  equity: number | null;
  totalLiabilities: number | null;
  // Metrics
  profitMargin: number | null;        // %
  equityRatio: number | null;         // %
  returnOnEquity: number | null;      // %
  // Meta
  source: string;
  confidence: ConfidenceLevel;
}

export interface CompanyFinancialData {
  yearly: YearlyFinancialData[];
  currency: Currency;
  lastUpdated: Date;
  sourcesUsed: string[];
  yearsFound: number;
  confidence: ConfidenceLevel;
}

// =============================================================================
// MODULE 3: Industry Analysis
// =============================================================================

export interface IndustryAnalysis {
  industry: string;
  industryInfo: string;
  industryTrends: string[];
  marketSize: string;
  growthRate: string;
  keyDrivers: string[];
}

// =============================================================================
// MODULE 4: Competitive Analysis
// =============================================================================

export interface CompetitorInfo {
  name: string;
  description: string;
  marketPosition: string;
  estimatedRevenue?: string;
}

export interface CompetitiveAnalysis {
  competitiveLandscape: string;
  keyCompetitors: CompetitorInfo[];
  marketShare?: string;
  strengths: string[];
  weaknesses: string[];
}

// =============================================================================
// MODULE 5: Growth Analysis
// =============================================================================

export interface GrowthAnalysis {
  growthOpportunities: string[];
  businessModel: string;
  revenueStreams: string[];
  expansionPotential: string;
}

// =============================================================================
// MODULE 6: Financial Health
// =============================================================================

export interface FinancialHealth {
  rating: string;                     // A-E or similar
  creditScore: string;
  stability: string;
  cashFlow: string;
  paymentBehavior?: string;
}

// =============================================================================
// MODULE 7: Personnel Information
// =============================================================================

export interface PersonnelInfo {
  count: number | null;
  trend: string;
  keyManagement: string[];
  boardMembers?: string[];
  source: string;
}

// =============================================================================
// MODULE 8: Market Intelligence
// =============================================================================

export interface SocialMediaMetrics {
  linkedinFollowers?: number;
  facebookLikes?: number;
  twitterFollowers?: number;
}

export interface MarketIntelligence {
  recentNews: string[];
  pressReleases: string[];
  awards: string[];
  partnerships: string[];
  socialMedia?: SocialMediaMetrics;
}

// =============================================================================
// MODULE 9: Web Presence
// =============================================================================

export interface WebPresence {
  website: string | null;
  websiteQuality: string;
  seoRanking?: number;
  contentQuality: string;
  customerTestimonials: string[];
}

// =============================================================================
// MODULE 10: M&A History & Ownership
// =============================================================================

export interface Acquisition {
  year: number;
  target: string;
  value: string;
  description: string;
}

export interface Divestiture {
  year: number;
  asset: string;
  buyer: string;
  value: string;
}

export interface FundingRound {
  date: string;
  type: string;               // Seed, Series A, etc.
  amount: string;
  investors: string[];
}

export interface Ownership {
  mainOwners: string[];
  ownershipStructure: string;
  publiclyTraded: boolean;
}

export interface MandAHistory {
  previousAcquisitions: Acquisition[];
  previousDivestitures: Divestiture[];
  fundingRounds: FundingRound[];
  ownership: Ownership;
}

// =============================================================================
// MODULE 11: Valuation Data
// =============================================================================

export interface ValuationEstimate {
  low: number;
  mid: number;
  high: number;
  method: string;             // DCF, Multiples, Asset-based
  confidence: string;
}

export interface IndustryMultiples {
  evToRevenue: number;        // EV/Revenue
  evToEbitda: number;         // EV/EBITDA
  priceToEarnings: number;    // P/E
  source: string;
}

export interface ComparableTransaction {
  date: string;
  target: string;
  buyer: string;
  value: string;
  multiple: string;
}

export interface AssetValue {
  tangibleAssets: number;
  intangibleAssets: number;
  total: number;
}

export interface ValuationData {
  estimatedValue: ValuationEstimate;
  industryMultiples: IndustryMultiples;
  comparableTransactions: ComparableTransaction[];
  assetValue: AssetValue;
}

// =============================================================================
// MODULE 12: Customer Intelligence
// =============================================================================

export interface CustomerIntelligence {
  customerConcentration: string;
  customerRetentionRate: string;
  averageCustomerLifetime: string;
  customerGrowthRate: string;
  contractTypes: string[];
  recurringRevenue: string;
}

// =============================================================================
// MODULE 13: Operational Efficiency
// =============================================================================

export interface OperationalEfficiency {
  revenuePerEmployee: number;
  profitPerEmployee: number;
  assetTurnover: number;
  inventoryTurnover: number | null;
  workingCapitalCycle: number;      // Days
  automationLevel: string;
}

// =============================================================================
// MODULE 14: Competitive Advantages
// =============================================================================

export interface Patents {
  count: number;
  key: string[];
}

export interface CompetitiveAdvantages {
  uniqueSellingPoints: string[];
  barriersToEntry: string[];
  networkEffects: string;
  switchingCosts: string;
  brandStrength: string;
  proprietaryTechnology: string[];
  patents: Patents;
  licenses: string[];
}

// =============================================================================
// MODULE 15: Risk Assessment
// =============================================================================

export interface RiskItem {
  risk: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  mitigation: string;
}

export interface RiskAssessment {
  keyRisks: RiskItem[];
  legalIssues: string[];
  environmentalLiabilities: string[];
  pendingLitigation: string[];
  regulatoryRisks: string[];
  customerConcentrationRisk: string;
  supplierDependency: string;
  keyPersonRisk: string;
}

// =============================================================================
// MODULE 16: Integration Potential
// =============================================================================

export interface Synergies {
  revenueSynergies: string[];
  costSynergies: string[];
  estimatedSynergyValue: string;
}

export interface IntegrationPotential {
  synergies: Synergies;
  culturalFit: string;
  integrationComplexity: 'HIGH' | 'MEDIUM' | 'LOW';
  technologyCompatibility: string;
  organizationalAlignment: string;
  geographicOverlap: string;
}

// =============================================================================
// MODULE 17: Exit Attractiveness
// =============================================================================

export interface ExitAttractiveness {
  idealBuyerProfile: string[];
  strategicValue: string;
  financialValue: string;
  urgencyToSell: string;
  sellerMotivation: string;
  timing: string;
  marketConditions: string;
}

// =============================================================================
// Complete Enriched Data
// =============================================================================

export interface EnrichedCompanyData {
  // Modules 1-9: Trusty Finance Base
  basicInfo: CompanyBasicInfo;
  financialData: CompanyFinancialData;
  industryAnalysis: IndustryAnalysis;
  competitiveAnalysis: CompetitiveAnalysis;
  growthAnalysis: GrowthAnalysis;
  financialHealth: FinancialHealth;
  personnelInfo: PersonnelInfo;
  marketIntelligence: MarketIntelligence;
  webPresence: WebPresence;
  
  // Modules 10-17: BizExit M&A Extensions
  maHistory?: MandAHistory;
  valuationData?: ValuationData;
  customerIntelligence?: CustomerIntelligence;
  operationalEfficiency?: OperationalEfficiency;
  competitiveAdvantages?: CompetitiveAdvantages;
  riskAssessment?: RiskAssessment;
  integrationPotential?: IntegrationPotential;
  exitAttractiveness?: ExitAttractiveness;
  
  // Metadata
  metadata: {
    confidence: number;           // 0-100
    completeness: number;         // 0-100
    lastEnriched: Date;
    sourcesUsed: string[];
    processingTime: number;       // milliseconds
  };
}

// =============================================================================
// API Types
// =============================================================================

export interface EnrichmentRequest {
  businessId: string;
  companyName: string;
  country?: string;
  industry?: string;
  website?: string;
  locale?: string;
}

export interface EnrichmentResponse {
  success: boolean;
  data?: EnrichedCompanyData;
  error?: string;
  metadata?: {
    processingTime: number;
    confidence: number;
    completeness: number;
  };
}

export interface EnrichmentJobStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial';
  progress: {
    totalModules: number;
    completedModules: number;
    failedModules: string[];
    currentModule: string | null;
  };
  startedAt: string;
  estimatedCompletion?: string;
  duration?: number;
}

export interface YTJResponse {
  success: boolean;
  data?: Array<{
    name: string;
    businessId: string;
    registrationDate: string;
    companyForm: string;
    address?: {
      street: string;
      postCode: string;
      city: string;
    };
  }>;
  error?: string;
}

// =============================================================================
// Config Types
// =============================================================================

export interface EnrichmentConfig {
  modules?: string[];          // Specific modules to run (null = all)
  force?: boolean;             // Force refresh even if data exists
  priority?: 'high' | 'normal' | 'low';
  locale?: 'fi' | 'sv' | 'en';
}
