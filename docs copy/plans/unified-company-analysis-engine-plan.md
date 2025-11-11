# Unified Company Analysis Engine - Implementation Plan

## Executive Summary

This document outlines the implementation plan for combining the current **Company Research** (web-based enrichment) and **Financial Analysis** (document-based calculation) systems into a single, comprehensive **Unified Company Analysis Engine**.

**Current State:**
- **Company Research**: Web-based enrichment via Gemini with Google Search Grounding (`UnifiedCompanyEnrichment`)
- **Financial Analysis**: Document-based calculation and ratio derivation (`financialAnalysisService`)
- **Problem**: Two separate systems with limited integration, data duplication, and inconsistent data sources

**Target State:**
- **Unified Engine**: Single comprehensive system that intelligently combines web research, public financial data, and document analysis
- **Smart Data Fusion**: Merges data from multiple sources with confidence scoring and conflict resolution
- **Unified API**: Single entry point for all company analysis operations
- **Consistent Data Model**: Unified financial metrics structure across all data sources

---

## Current Architecture Analysis

### System 1: Company Research & Enrichment

**Location:** `lib/financial-search/unified-company-enrichment.ts`

**Capabilities:**
- **Company Information Extraction:**
  - Overview, products, team, market position
  - Industry analysis, competitive landscape
  - Growth opportunities, business model
  - Uses Google Search Grounding (Gemini)

- **Financial Data Extraction:**
  - Multi-year financial data from public sources
  - Sources: finder.fi, asiakastieto.fi (Finnish companies)
  - Extracts: Revenue, Operating Profit, Net Profit, Assets, Equity, Liabilities
  - Unit conversion and validation

**Flow:**
```
Company Created (Step 2)
  ↓
Inngest Event: 'company/enrich.financial-data'
  ↓
UnifiedCompanyEnrichment.enrichCompany()
  ↓
Parallel Calls:
  - enrichCompanyInfo() → Company details
  - enrichFinancialData() → Financial metrics
  ↓
Save to:
  - companies table (description, products, market, metadata.enriched_data)
  - financial_metrics table (multi-year data)
```

**Data Sources:**
- Google Search (with grounding)
- finder.fi (Finnish business directory)
- asiakastieto.fi (Finnish credit information)
- Company websites

**Output:**
- Company profile data
- Multi-year financial metrics (raw values)
- Confidence scores
- Source attribution

---

### System 2: Financial Analysis & Calculation

**Location:** `lib/services/financialAnalysisService.ts`

**Capabilities:**
- **Document Processing:**
  - Extracts financial data from uploaded PDFs/documents
  - Uses Gemini AI for document analysis
  - Normalizes extracted data

- **Financial Metrics Calculation:**
  - Calculates derived ratios (ROE, Debt-to-Equity, Current Ratio, Quick Ratio)
  - Calculates EBITDA from components
  - Calculates revenue growth rates
  - Validates data consistency

- **Ratio Updates:**
  - `updateFinancialMetrics()` - Updates existing records with calculated ratios
  - Handles missing data gracefully
  - Validates calculations

**Flow:**
```
Document Uploaded (Step 3)
  ↓
Document Extraction (Gemini AI)
  ↓
POST /api/financial/analyze
  ↓
processFinancialDocument()
  ↓
calculateFinancialMetrics()
  ↓
Save to financial_metrics table
  ↓
updateFinancialMetrics() - Calculate ratios
```

**Data Sources:**
- Uploaded financial documents (PDFs, Excel, etc.)
- Document extraction via Gemini AI

**Output:**
- Financial metrics with calculated ratios
- Document-based data (higher priority than web-extracted)
- Validation flags

---

### Current Integration Points

**Limited Integration:**
1. Both systems write to `financial_metrics` table
2. Company enrichment calculates ratios via `updateFinancialMetrics()` after saving
3. Document analysis overwrites web-extracted data (no conflict resolution)
4. No unified view of all company data sources

**Issues:**
- **Data Conflicts:** Web-extracted vs document-extracted data can conflict
- **Priority Handling:** No clear priority system (document > web > manual)
- **Duplication:** Same metrics calculated multiple times
- **Incomplete Integration:** Company research and document analysis are separate workflows
- **No Data Fusion:** Missing intelligent merging of multiple data sources

---

## Target Architecture: Unified Company Analysis Engine

### Core Principles

1. **Single Source of Truth:** Unified data model for all company analysis
2. **Smart Data Fusion:** Intelligent merging with confidence scoring
3. **Priority-Based Resolution:** Document > Web Research > Manual Entry
4. **Comprehensive Analysis:** Company info + Financial data + Document analysis in one flow
5. **Incremental Enhancement:** Each data source enhances existing data, doesn't replace it

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│         Unified Company Analysis Engine                      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        1. Data Ingestion Layer                       │  │
│  │    - Web Research (Gemini + Google Search)          │  │
│  │    - Public Financial Sources (finder.fi, etc.)    │  │
│  │    - Document Extraction (PDF/Excel via Gemini)     │  │
│  │    - Manual Entry (User-provided data)              │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        2. Data Normalization & Validation            │  │
│  │    - Unit conversion (thousands → base units)        │  │
│  │    - Data validation (profit ≤ revenue, etc.)       │  │
│  │    - Source attribution                              │  │
│  │    - Confidence scoring                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        3. Smart Data Fusion Engine                   │  │
│  │    - Priority-based conflict resolution             │  │
│  │    - Confidence-weighted merging                     │  │
│  │    - Temporal data handling (latest vs historical)  │  │
│  │    - Gap filling (use best available data)          │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        4. Financial Calculation Engine               │  │
│  │    - Derived ratio calculation (ROE, D/E, etc.)     │  │
│  │    - Trend analysis (growth rates, trends)            │  │
│  │    - Benchmark comparison                            │  │
│  │    - Financial health scoring                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        5. Comprehensive Analysis Generation           │  │
│  │    - Company profile (info + financials)            │  │
│  │    - Multi-year financial trends                     │  │
│  │    - Risk assessment                                 │  │
│  │    - Growth potential analysis                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        6. Unified Data Storage                        │  │
│  │    - companies table (profile data)                  │  │
│  │    - financial_metrics table (unified structure)     │  │
│  │    - analysis_results table (comprehensive analysis) │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Foundation & Data Model Unification (Weeks 1-2)

**Objective:** Create unified data structures and core engine framework

#### Task 1.1: Unified Data Model
**Files to Create/Modify:**
- `types/unified-analysis.ts` - New unified type definitions
- `types/financial.ts` - Extend existing types

**Key Types:**
```typescript
// Data source priority (higher = more trusted)
enum DataSourcePriority {
  DOCUMENT = 100,      // Uploaded financial documents
  MANUAL = 50,        // User manual entry
  AI_EXTRACTED = 10,  // Web-scraped/AI-extracted
  ESTIMATED = 1       // Calculated/estimated values
}

// Data source type
enum DataSourceType {
  DOCUMENT = 'document',
  WEB_RESEARCH = 'web_research',
  PUBLIC_REGISTRY = 'public_registry',
  MANUAL_ENTRY = 'manual',
  CALCULATED = 'calculated'
}

// Unified financial metric with source tracking
interface UnifiedFinancialMetric {
  // Core data
  company_id: string;
  fiscal_year: number;
  fiscal_period: string;
  
  // Financial values (with source tracking)
  revenue: FinancialValue;
  operating_profit: FinancialValue;
  net_profit: FinancialValue;
  ebitda: FinancialValue;
  total_assets: FinancialValue;
  total_equity: FinancialValue;
  total_liabilities: FinancialValue;
  // ... all other metrics
  
  // Calculated ratios
  return_on_equity?: number;
  debt_to_equity_ratio?: number;
  current_ratio?: number;
  quick_ratio?: number;
  revenue_growth_rate?: number;
  // ... all calculated ratios
  
  // Metadata
  data_sources: DataSource[];
  confidence_score: number; // 0-100
  last_updated: string;
  calculated_at?: string;
}

// Financial value with source information
interface FinancialValue {
  value: number | null;
  source: DataSourceType;
  source_priority: DataSourcePriority;
  source_url?: string;
  confidence: number; // 0-100
  extracted_at: string;
  validated: boolean;
}

// Data source information
interface DataSource {
  type: DataSourceType;
  priority: DataSourcePriority;
  url?: string;
  document_id?: string;
  extraction_method?: string;
  confidence: number;
  extracted_at: string;
}
```

#### Task 1.2: Core Engine Framework
**Files to Create:**
- `lib/services/unified-company-analysis-engine.ts` - Main engine class

**Core Class Structure:**
```typescript
export class UnifiedCompanyAnalysisEngine {
  // Data ingestion
  async ingestWebResearch(companyId: string, businessId: string, companyName: string): Promise<IngestionResult>
  async ingestDocument(companyId: string, documentId: string, extractionData: any): Promise<IngestionResult>
  async ingestManualEntry(companyId: string, data: ManualFinancialData): Promise<IngestionResult>
  
  // Data fusion
  async fuseFinancialData(companyId: string, fiscalYear: number): Promise<UnifiedFinancialMetric>
  
  // Calculation
  async calculateRatios(companyId: string, fiscalYear: number): Promise<CalculatedRatios>
  
  // Comprehensive analysis
  async generateComprehensiveAnalysis(companyId: string): Promise<ComprehensiveAnalysis>
}
```

#### Task 1.3: Database Schema Updates
**Migration File:** `supabase/migrations/XXXXXX_unified_analysis_engine.sql`

**Changes:**
1. Add `data_sources` JSONB column to `financial_metrics` table
2. Add `source_priority` integer column
3. Add `confidence_score` integer column
4. Add `fused_data` JSONB column (stores unified/merged data)
5. Create `analysis_results` table (optional, for comprehensive analysis caching)

**Migration SQL:**
```sql
-- Add unified analysis columns to financial_metrics
ALTER TABLE financial_metrics
ADD COLUMN IF NOT EXISTS data_sources JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS source_priority INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS confidence_score INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS fused_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS last_fused_at TIMESTAMPTZ;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_financial_metrics_company_year 
ON financial_metrics(company_id, fiscal_year);

-- Optional: Create analysis_results table for comprehensive analysis caching
CREATE TABLE IF NOT EXISTS analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL, -- 'comprehensive', 'risk', 'growth', etc.
  results JSONB NOT NULL,
  confidence_score INTEGER DEFAULT 50,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analysis_results_company 
ON analysis_results(company_id, analysis_type, generated_at DESC);
```

**Deliverables:**
- ✅ Unified type definitions
- ✅ Core engine class structure
- ✅ Database migration
- ✅ Unit tests for data model

---

### Phase 2: Data Ingestion Unification (Weeks 3-4)

**Objective:** Integrate all data sources into unified ingestion pipeline

#### Task 2.1: Web Research Integration
**Files to Modify:**
- `lib/financial-search/unified-company-enrichment.ts` - Refactor to use new engine
- `lib/inngest/functions/company-enrichment.ts` - Update to use unified engine

**Changes:**
- Refactor `UnifiedCompanyEnrichment` to return data in unified format
- Add source attribution to all extracted data
- Add confidence scoring
- Integrate with unified engine ingestion methods

**Implementation:**
```typescript
// In unified-company-enrichment.ts
async enrichCompany(...): Promise<UnifiedCompanyData> {
  // Existing parallel calls
  const [companyInfo, financialData] = await Promise.allSettled([...]);
  
  // Transform to unified format
  return {
    companyInfo: {
      ...companyInfo,
      source: DataSourceType.WEB_RESEARCH,
      priority: DataSourcePriority.AI_EXTRACTED,
      confidence: calculateConfidence(companyInfo)
    },
    financialData: financialData.map(fd => ({
      ...fd,
      source: DataSourceType.WEB_RESEARCH,
      priority: DataSourcePriority.AI_EXTRACTED,
      confidence: calculateConfidence(fd),
      source_url: fd.source
    }))
  };
}
```

#### Task 2.2: Document Analysis Integration
**Files to Modify:**
- `lib/services/financialAnalysisService.ts` - Refactor to use unified engine
- `app/api/financial/analyze/route.ts` - Update to use unified ingestion

**Changes:**
- Refactor `calculateFinancialMetrics()` to return unified format
- Add document source attribution
- Integrate with unified engine ingestion

**Implementation:**
```typescript
// In financialAnalysisService.ts
async function calculateFinancialMetrics(
  documentData: Record<string, any>,
  companyId: string,
  fiscalYear: number,
  fiscalPeriod: string,
  createdBy: string,
  documentIds: string[]
): Promise<UnifiedFinancialMetric> {
  // Existing extraction logic...
  
  // Transform to unified format
  return {
    company_id: companyId,
    fiscal_year: fiscalYear,
    fiscal_period: fiscalPeriod,
    revenue: {
      value: revenueCurrent,
      source: DataSourceType.DOCUMENT,
      source_priority: DataSourcePriority.DOCUMENT,
      document_id: documentIds[0],
      confidence: 90, // High confidence for document extraction
      extracted_at: new Date().toISOString(),
      validated: true
    },
    // ... all other metrics
    data_sources: documentIds.map(id => ({
      type: DataSourceType.DOCUMENT,
      priority: DataSourcePriority.DOCUMENT,
      document_id: id,
      confidence: 90,
      extracted_at: new Date().toISOString()
    })),
    confidence_score: 90
  };
}
```

#### Task 2.3: Manual Entry Integration
**Files to Create:**
- `app/api/financial-metrics/manual-entry/route.ts` - New API endpoint

**Implementation:**
```typescript
// POST /api/financial-metrics/manual-entry
export async function POST(request: Request) {
  const { companyId, fiscalYear, fiscalPeriod, data } = await request.json();
  
  const engine = new UnifiedCompanyAnalysisEngine();
  const result = await engine.ingestManualEntry(companyId, {
    fiscal_year: fiscalYear,
    fiscal_period: fiscalPeriod,
    ...data
  });
  
  return NextResponse.json(result);
}
```

**Deliverables:**
- ✅ All data sources integrated into unified ingestion
- ✅ Source attribution on all data
- ✅ Confidence scoring implemented
- ✅ Updated API endpoints

---

### Phase 3: Smart Data Fusion Engine (Weeks 5-6)

**Objective:** Implement intelligent data merging with conflict resolution

#### Task 3.1: Priority-Based Conflict Resolution
**Files to Create:**
- `lib/services/data-fusion-engine.ts` - Core fusion logic

**Algorithm:**
```typescript
class DataFusionEngine {
  /**
   * Fuse multiple financial data sources for a given company/year
   * Priority: DOCUMENT > MANUAL > AI_EXTRACTED > ESTIMATED
   */
  async fuseFinancialData(
    companyId: string,
    fiscalYear: number,
    sources: FinancialValue[]
  ): Promise<UnifiedFinancialMetric> {
    // Group by metric type
    const metrics = this.groupByMetric(sources);
    
    // For each metric, select best value based on priority
    const fused: Record<string, FinancialValue> = {};
    
    for (const [metricName, values] of Object.entries(metrics)) {
      // Sort by priority (highest first)
      values.sort((a, b) => b.source_priority - a.source_priority);
      
      // Select highest priority value that is valid
      const bestValue = values.find(v => v.value !== null && v.validated);
      
      if (bestValue) {
        fused[metricName] = bestValue;
      } else {
        // Fallback: Use confidence-weighted average if multiple sources
        fused[metricName] = this.confidenceWeightedAverage(values);
      }
    }
    
    return {
      ...fused,
      data_sources: sources.map(s => ({
        type: s.source,
        priority: s.source_priority,
        confidence: s.confidence,
        extracted_at: s.extracted_at
      })),
      confidence_score: this.calculateOverallConfidence(sources)
    };
  }
  
  /**
   * Confidence-weighted average for gap filling
   */
  private confidenceWeightedAverage(values: FinancialValue[]): FinancialValue {
    const validValues = values.filter(v => v.value !== null);
    if (validValues.length === 0) {
      return { value: null, source: DataSourceType.CALCULATED, ... };
    }
    
    const totalWeight = validValues.reduce((sum, v) => 
      sum + (v.confidence * v.source_priority), 0
    );
    
    const weightedSum = validValues.reduce((sum, v) => 
      sum + (v.value! * v.confidence * v.source_priority), 0
    );
    
    return {
      value: weightedSum / totalWeight,
      source: DataSourceType.CALCULATED,
      source_priority: DataSourcePriority.ESTIMATED,
      confidence: Math.round(validValues.reduce((sum, v) => sum + v.confidence, 0) / validValues.length),
      validated: false
    };
  }
}
```

#### Task 3.2: Temporal Data Handling
**Implementation:**
- Handle multiple years of data
- Identify gaps and fill with best available data
- Track data freshness (prefer newer sources)

#### Task 3.3: Validation & Consistency Checks
**Implementation:**
- Cross-metric validation (profit ≤ revenue, etc.)
- Temporal consistency (growth rates make sense)
- Outlier detection

**Deliverables:**
- ✅ Data fusion engine implemented
- ✅ Conflict resolution algorithm
- ✅ Gap filling logic
- ✅ Validation rules

---

### Phase 4: Financial Calculation Enhancement (Week 7)

**Objective:** Enhance calculation engine with unified data support

#### Task 4.1: Unified Ratio Calculation
**Files to Modify:**
- `lib/services/financialAnalysisService.ts` - Update `updateFinancialMetrics()`

**Changes:**
- Use fused data instead of raw data
- Calculate ratios from best available sources
- Handle missing data gracefully
- Cache calculated ratios

#### Task 4.2: Trend Analysis
**Files to Create:**
- `lib/services/financial-trend-analysis.ts` - New trend analysis service

**Capabilities:**
- Multi-year trend calculation
- Growth rate analysis
- Volatility metrics
- Benchmark comparison

**Deliverables:**
- ✅ Enhanced ratio calculation
- ✅ Trend analysis service
- ✅ Benchmark comparison

---

### Phase 5: Comprehensive Analysis Generation (Week 8)

**Objective:** Generate unified comprehensive company analysis

#### Task 5.1: Analysis Aggregation
**Files to Create:**
- `lib/services/comprehensive-analysis-generator.ts`

**Capabilities:**
- Combine company info + financial data + trends
- Generate risk assessment
- Generate growth potential analysis
- Create executive summary

**Output Structure:**
```typescript
interface ComprehensiveAnalysis {
  company_id: string;
  generated_at: string;
  
  // Company Profile
  company_profile: {
    overview: string;
    products: string[];
    market: string;
    industry: string;
    team: PersonnelInfo;
    competitors: CompetitorInfo[];
  };
  
  // Financial Summary
  financial_summary: {
    latest_year: number;
    revenue: number;
    profit_margin: number;
    roe: number;
    debt_to_equity: number;
    current_ratio: number;
  };
  
  // Multi-year Trends
  trends: {
    revenue_growth: TrendAnalysis;
    profitability_trend: TrendAnalysis;
    liquidity_trend: TrendAnalysis;
    leverage_trend: TrendAnalysis;
  };
  
  // Risk Assessment
  risk_assessment: {
    overall_risk: 'LOW' | 'MEDIUM' | 'HIGH';
    financial_health_score: number; // 0-100
    liquidity_risk: number;
    leverage_risk: number;
    profitability_risk: number;
  };
  
  // Growth Potential
  growth_potential: {
    score: number; // 0-100
    factors: string[];
    opportunities: string[];
    challenges: string[];
  };
  
  // Data Quality
  data_quality: {
    completeness: number; // 0-100
    confidence: number; // 0-100
    sources: DataSource[];
    gaps: string[];
  };
}
```

#### Task 5.2: Caching & Performance
**Implementation:**
- Cache comprehensive analysis results
- Invalidate cache on data updates
- Incremental updates (only recalculate changed parts)

**Deliverables:**
- ✅ Comprehensive analysis generator
- ✅ Caching mechanism
- ✅ Performance optimization

---

### Phase 6: API Unification (Week 9)

**Objective:** Create unified API endpoints

#### Task 6.1: Unified Analysis API
**Files to Create:**
- `app/api/company-analysis/unified/route.ts`

**Endpoints:**
```typescript
// GET /api/company-analysis/unified?companyId=xxx
// Returns comprehensive unified analysis

// POST /api/company-analysis/unified/ingest
// Ingest data from any source (web, document, manual)

// POST /api/company-analysis/unified/fuse
// Manually trigger data fusion

// GET /api/company-analysis/unified/sources?companyId=xxx
// Get all data sources for a company
```

#### Task 6.2: Migration of Existing Endpoints
**Files to Modify:**
- `app/api/financial-metrics/*` - Update to use unified engine
- `app/api/companies/enrich` - Update to use unified engine

**Deliverables:**
- ✅ Unified API endpoints
- ✅ Backward compatibility maintained
- ✅ API documentation updated

---

### Phase 7: Frontend Integration (Week 10)

**Objective:** Update frontend to use unified engine

#### Task 7.1: Update Components
**Files to Modify:**
- `components/auth/onboarding/Step2CompanyInfo.tsx` - Use unified API
- `components/auth/onboarding/Step3AIConversation.tsx` - Use unified data
- `components/financial/FinancialChartsDisplay.tsx` - Display unified data

#### Task 7.2: Data Display Enhancement
**Implementation:**
- Show data source indicators
- Display confidence scores
- Show data conflicts/resolution
- Display comprehensive analysis

**Deliverables:**
- ✅ Frontend components updated
- ✅ Enhanced data visualization
- ✅ User experience improvements

---

### Phase 8: Testing & Optimization (Weeks 11-12)

**Objective:** Comprehensive testing and performance optimization

#### Task 8.1: Unit Tests
**Files to Create:**
- `__tests__/services/unified-company-analysis-engine.test.ts`
- `__tests__/services/data-fusion-engine.test.ts`
- `__tests__/services/comprehensive-analysis-generator.test.ts`

#### Task 8.2: Integration Tests
**Files to Create:**
- `__tests__/integration/unified-analysis-flow.test.ts`

#### Task 8.3: Performance Optimization
**Optimizations:**
- Caching strategies
- Database query optimization
- Parallel processing where possible
- Batch operations

**Deliverables:**
- ✅ Comprehensive test suite
- ✅ Performance benchmarks
- ✅ Optimization complete

---

## Data Flow: Unified Engine

### Complete Flow Diagram

```
User Action: Create Company (Step 2)
  ↓
POST /api/companies/create
  ↓
Trigger: UnifiedCompanyAnalysisEngine.analyzeCompany()
  ↓
┌─────────────────────────────────────────────────┐
│  Parallel Data Ingestion:                       │
│                                                  │
│  1. Web Research (Gemini + Google Search)      │
│     → Company Info + Financial Data             │
│     → Source: WEB_RESEARCH, Priority: 10        │
│                                                  │
│  2. Public Registry (finder.fi, asiakastieto)  │
│     → Financial Data                            │
│     → Source: PUBLIC_REGISTRY, Priority: 10     │
│                                                  │
│  3. YTJ Data (Finnish Business Registry)       │
│     → Company Registration Data                │
│     → Source: PUBLIC_REGISTRY, Priority: 10     │
└─────────────────────────────────────────────────┘
  ↓
Data Normalization & Validation
  ↓
Save Raw Data to financial_metrics (with source tracking)
  ↓
┌─────────────────────────────────────────────────┐
│  Data Fusion Engine:                            │
│                                                  │
│  For each fiscal year:                          │
│    - Collect all data sources                   │
│    - Apply priority-based selection             │
│    - Fill gaps with confidence-weighted avg     │
│    - Validate consistency                       │
│    - Generate fused financial_metrics record    │
└─────────────────────────────────────────────────┘
  ↓
Calculate Ratios (ROE, D/E, Current Ratio, etc.)
  ↓
Generate Comprehensive Analysis
  ↓
Save Results:
  - companies.enriched_data (company info)
  - financial_metrics (fused data + ratios)
  - analysis_results (comprehensive analysis cache)
  ↓
Return Unified Analysis to Frontend

---

User Action: Upload Document (Step 3)
  ↓
POST /api/financial/analyze
  ↓
Trigger: UnifiedCompanyAnalysisEngine.ingestDocument()
  ↓
Document Extraction (Gemini AI)
  ↓
Data Normalization & Validation
  ↓
Save Raw Data to financial_metrics (Source: DOCUMENT, Priority: 100)
  ↓
┌─────────────────────────────────────────────────┐
│  Data Fusion Engine (Re-run):                  │
│                                                  │
│  - Document data has HIGHEST priority (100)     │
│  - Overrides web-extracted data (priority 10)   │
│  - Fuses with existing data                     │
│  - Updates fused financial_metrics record      │
└─────────────────────────────────────────────────┘
  ↓
Recalculate Ratios (with new document data)
  ↓
Regenerate Comprehensive Analysis
  ↓
Return Updated Analysis
```

---

## Key Design Decisions

### 1. Data Source Priority System

**Priority Levels:**
- **DOCUMENT (100):** Highest priority - User-uploaded financial documents
- **MANUAL (50):** User manual entry - High trust, user verified
- **AI_EXTRACTED (10):** Web-scraped/AI-extracted - Lower trust, may have errors
- **ESTIMATED (1):** Calculated/estimated - Lowest priority, use only for gaps

**Rationale:**
- Documents are most accurate (official financial statements)
- Manual entry is user-verified
- Web extraction may have errors or outdated data
- Estimates are last resort for missing data

### 2. Confidence Scoring

**Scoring Factors:**
- **Source Reliability:** Document > Manual > Web > Estimated
- **Data Completeness:** More complete data = higher confidence
- **Validation Status:** Validated data = higher confidence
- **Temporal Freshness:** Newer data = higher confidence
- **Cross-Source Agreement:** Multiple sources agree = higher confidence

**Formula:**
```
confidence = (
  source_weight * 0.4 +
  completeness_score * 0.2 +
  validation_bonus * 0.2 +
  freshness_score * 0.1 +
  agreement_score * 0.1
) * 100
```

### 3. Conflict Resolution Strategy

**When multiple sources have different values:**

1. **Priority-Based Selection:** Use highest priority source
2. **Confidence-Weighted Average:** If priorities equal, use weighted average
3. **Temporal Preference:** Prefer newer data if priorities equal
4. **Validation Preference:** Prefer validated data

**Example:**
```
Revenue for 2023:
- Document: 1,000,000€ (Priority: 100, Confidence: 95)
- Web Research: 950,000€ (Priority: 10, Confidence: 70)
- Result: Use Document value (1,000,000€)
```

### 4. Gap Filling Strategy

**When data is missing:**

1. **Use Best Available Source:** Check other years, use if reasonable
2. **Confidence-Weighted Interpolation:** If multiple years available
3. **Industry Benchmark:** Use industry averages as last resort
4. **Mark as Estimated:** Clearly flag estimated values

---

## Migration Strategy

### Backward Compatibility

**Phase 1: Parallel Operation**
- Keep existing endpoints working
- New unified engine runs alongside
- Gradual migration

**Phase 2: Unified Endpoints**
- Create new unified endpoints
- Update frontend to use new endpoints
- Keep old endpoints for compatibility

**Phase 3: Deprecation**
- Mark old endpoints as deprecated
- Migrate all clients to unified endpoints
- Remove old endpoints (after 3 months)

### Data Migration

**Existing Data:**
- All existing `financial_metrics` records get default source attribution
- `data_source_type` column maps to new `DataSourceType` enum
- Existing data marked as `AI_EXTRACTED` or `DOCUMENT` based on `data_source_type`

**Migration Script:**
```sql
-- Migrate existing financial_metrics to unified format
UPDATE financial_metrics
SET 
  data_sources = jsonb_build_array(
    jsonb_build_object(
      'type', CASE 
        WHEN data_source_type = 'document' THEN 'document'
        WHEN data_source_type = 'manual' THEN 'manual'
        ELSE 'ai_extracted'
      END,
      'priority', CASE
        WHEN data_source_type = 'document' THEN 100
        WHEN data_source_type = 'manual' THEN 50
        ELSE 10
      END,
      'confidence', COALESCE(data_confidence, 50),
      'extracted_at', created_at
    )
  ),
  source_priority = CASE
    WHEN data_source_type = 'document' THEN 100
    WHEN data_source_type = 'manual' THEN 50
    ELSE 10
  END,
  confidence_score = COALESCE(data_confidence, 50)
WHERE data_sources IS NULL;
```

---

## Success Metrics

### Technical Metrics
- **Data Completeness:** >90% of companies have complete financial data
- **Data Accuracy:** >95% confidence score average
- **Processing Time:** <15 seconds for full company analysis
- **API Response Time:** <2 seconds for unified analysis endpoint

### Business Metrics
- **User Satisfaction:** Improved data quality perception
- **Reduced Manual Entry:** <20% of companies require manual data entry
- **Analysis Quality:** Comprehensive analysis available for 100% of companies
- **Data Conflicts Resolved:** 100% automatic resolution rate

---

## Risk Mitigation

### Technical Risks

**1. Data Quality Issues**
- **Risk:** Poor quality web-extracted data
- **Mitigation:** Robust validation, confidence scoring, user override capability

**2. Performance Degradation**
- **Risk:** Unified engine slower than separate systems
- **Mitigation:** Caching, parallel processing, incremental updates

**3. Data Loss During Migration**
- **Risk:** Existing data lost during migration
- **Mitigation:** Comprehensive backup, migration scripts with rollback

### Business Risks

**1. User Confusion**
- **Risk:** Users confused by unified system
- **Mitigation:** Clear UI indicators, data source visibility, documentation

**2. Increased Complexity**
- **Risk:** System becomes too complex to maintain
- **Mitigation:** Clean architecture, comprehensive tests, documentation

---

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| **Phase 1: Foundation** | Weeks 1-2 | Unified data model, core engine framework, DB migration |
| **Phase 2: Data Ingestion** | Weeks 3-4 | All data sources integrated |
| **Phase 3: Data Fusion** | Weeks 5-6 | Smart merging, conflict resolution |
| **Phase 4: Calculation** | Week 7 | Enhanced ratio calculation, trend analysis |
| **Phase 5: Analysis** | Week 8 | Comprehensive analysis generation |
| **Phase 6: API** | Week 9 | Unified API endpoints |
| **Phase 7: Frontend** | Week 10 | UI integration |
| **Phase 8: Testing** | Weeks 11-12 | Tests, optimization, documentation |

**Total Duration:** 12 weeks (3 months)

---

## Next Steps

1. **Review & Approval:** Review this plan with team
2. **Sprint Planning:** Break down into sprint tasks
3. **Resource Allocation:** Assign developers to phases
4. **Kickoff Meeting:** Start Phase 1 implementation
5. **Weekly Reviews:** Track progress, adjust as needed

---

## Document Version

**Version:** 1.0  
**Created:** November 8, 2025  
**Author:** TrustyFinance Development Team  
**Status:** Draft - Pending Review

