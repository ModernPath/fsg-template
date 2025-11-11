# Company Research Flow Analysis

## Overview

This document provides a detailed analysis of how company research works in TrustyFinance, specifically focusing on what happens when the **"Lähetä & Analysoi" (Submit & Analyze)** button is clicked in Step 2 of onboarding, and how company research is conducted using LLM prompts.

## Architecture Summary

The company research system uses **Google Gemini AI** with **Google Search Grounding** to perform comprehensive company research. There are two main research paths:

1. **Background Company Enrichment** - Triggered when company is created (Step 2 Submit)
2. **Onboarding Conversation Research** - Triggered during AI conversation (currently disabled)

---

## Flow 1: Step 2 Company Creation & Analysis Trigger

### Step-by-Step Flow

```
User on Step 2: Company Information
    ↓
User enters company name and business ID
    ↓
User clicks "Lähetä & Analysoi" (Submit & Analyze) button
    ↓
OnboardingFlow.tsx: handleStep2Submit()
    ↓
POST /api/companies/create
    ↓
Company saved to database (enrichment_status: 'pending')
    ↓
Inngest Event: 'company/enrich.financial-data'
    ↓
Inngest Function: enrichCompanyFinancialData (BACKGROUND JOB)
    ↓
UnifiedCompanyEnrichment.enrichCompany()
    ↓
ONE Gemini API call with Google Search Grounding
    ↓
Extracts: overview, products, team, market + multi-year financial data
    ↓
Saves to: companies.enriched_data and financial_metrics table
    ↓
Updates enrichment_status: 'enriched'
    ↓
User navigates to Step 3 (AI Conversation)
```

### Key Files

1. **Frontend Component**: `components/auth/onboarding/Step2CompanyInfo.tsx`
   - Renders the form with "Lähetä & Analysoi" button
   - Button text: `t('step2.submitAndAnalyze', { default: 'Submit & Analyze' })`

2. **Frontend Handler**: `components/auth/OnboardingFlow.tsx` (lines 2447-2604)
   - Function: `handleStep2Submit()`
   - Validates company name and business ID
   - Calls: `/api/companies/create` or `/api/companies/update/${companyId}`
   - Navigates to Step 3 after successful creation

3. **API Route**: `app/api/companies/create/route.ts`
   - Creates company in database
   - Fetches YTJ data (Finnish business registry) if available
   - **Triggers Inngest event**: `company/enrich.financial-data` (line 964)
   - Returns created company data immediately (doesn't wait for enrichment)

4. **Inngest Handler**: `lib/inngest/functions/company-enrichment.ts`
   - Function: `enrichCompanyFinancialData`
   - Event: `company/enrich.financial-data`
   - Runs in background (async, non-blocking)
   - Uses `UnifiedCompanyEnrichment` service

5. **Enrichment Service**: `lib/financial-search/unified-company-enrichment.ts`
   - Class: `UnifiedCompanyEnrichment`
   - Method: `enrichCompany()`
   - Makes the actual Gemini API call with Google Search Grounding

### Important Notes

✅ **Company research happens when company is created** (Step 2 Submit), not during pre-analysis.

✅ **The enrichment runs asynchronously** - the API returns immediately while enrichment happens in background.

✅ **User sees progress** - There's a `CompanyAnalysisProgress` component that shows enrichment phases:
   - Phase 1: Searching company information
   - Phase 2: Analyzing market information  
   - Phase 3: Finalizing analysis

---

## Flow 2: Pre-Analysis Step (Different Process)

### What Pre-Analysis Actually Does

**Note**: The pre-analysis step is a different process that happens later, after documents are uploaded. It does NOT trigger company research.

When user clicks "Analyze" button in Step 3 (after uploading documents):

```
User clicks "Analyze" button in Step 3 (after document upload)
    ↓
OnboardingFlow.tsx: handleAnalyzeAndContinue()
    ↓
POST /api/onboarding/trigger-analysis
    ↓
Inngest Event: 'financial/analysis-requested'
    ↓
Inngest Function: processDocumentAnalysisRequest
    ↓
Processes existing financial_metrics data (already enriched)
    ↓
Calculates financial ratios (ROE, D/E, current ratio, etc.)
    ↓
Triggers: 'recommendations/generation-requested' (if financing_needs exist)
```

**Key Point**: Pre-analysis processes data that was already collected during Step 2 enrichment. It does NOT perform new web research.

---

## Flow 3: Company Enrichment Job Details

### Inngest Job Execution

**Function**: `enrichCompanyFinancialData`
- **File**: `lib/inngest/functions/company-enrichment.ts`
- **Event**: `company/enrich.financial-data`
- **Concurrency**: Limit 5 concurrent executions
- **Endpoint**: `/api/inngest/company`

**Steps**:
1. Update `enrichment_status` to 'enriching'
2. Fetch company website
3. Call `UnifiedCompanyEnrichment.enrichCompany()` - **THE MAIN RESEARCH CALL**
4. Save company info (overview, products, market)
5. Save financial data to `financial_metrics` table
6. Update `enrichment_status` to 'enriched'

---

## LLM Prompts Used

### Prompt 1: Unified Company Enrichment

**Service**: `lib/financial-search/unified-company-enrichment.ts`
**Method**: `buildUnifiedPrompt()`
**Model**: `gemini-2.5-flash-preview-09-2025`
**Tools**: `[{ googleSearch: {} }]` (Google Search Grounding)

**Full Prompt Structure**:

```typescript
🔴 CRITICAL INSTRUCTIONS - Extract COMPLETE company profile:

Company: ${companyName}
Business ID: ${businessId}
Country: ${country}
Industry: ${industry}
Website: ${website}

🎯 YOUR MISSION: Extract EVERYTHING about this company in ONE comprehensive search.

PART 1: COMPANY INFORMATION
Extract from company websites, news, LinkedIn, industry reports:

1. **Overview** (2-3 sentences):
   - What does the company do?
   - When was it founded?
   - Key facts about the business

2. **Products/Services** (array of strings):
   - Main products or services offered
   - 3-5 specific items
   - Extract ONLY if clearly stated - no guessing!

3. **Team** (array of strings):
   - Key people (CEO, founders, leadership)
   - Format: "Name - Title"
   - Extract ONLY if found in sources

4. **Market Position** (1-2 sentences):
   - Target market / customers
   - Competitive position
   - Market trends affecting the company

PART 2: MULTI-YEAR FINANCIAL DATA
Extract from official sources (kauppalehti.fi, finder.fi, asiakastieto.fi, prh.fi, ytj.fi):

For EACH year (2024, 2023, 2022, 2021, 2020), extract:
- Revenue (liikevaihto)
- Operating Profit (liikevoitto)
- Net Profit (nettotulos / tilikauden voitto)
- Total Assets (taseen loppusumma)
- Equity (oma pääoma)
- Total Liabilities (velat yhteensä)

🚨 FINANCIAL DATA RULES - STRICTLY ENFORCE:
1. ❌ NEVER EVER estimate, calculate, approximate, or guess ANY financial numbers
2. ❌ NEVER use industry averages, typical ranges, or similar companies as reference
3. ❌ NEVER extrapolate or interpolate data from other years
4. ✅ ONLY extract numbers that are EXPLICITLY STATED in grounded search results
5. ✅ Extract ALL years available (companies often publish 3-5 years in one report)
6. ✅ ALWAYS include the EXACT source URL where you found each number
7. ✅ If a number is NOT in your grounded search results → return null or empty array
8. ✅ Year must be 2023 or earlier (no current year estimates!)
9. ✅ Every financial value MUST come from a trusted Finnish financial source with URL proof

SEARCH STRATEGY:
1. "site:kauppalehti.fi ${businessId} taloustiedot"
2. "${companyName} ${businessId} tilinpäätös 2023"
3. "site:finder.fi ${businessId}"
4. "${companyName} company profile products"
5. "${companyName} CEO leadership team"

RESPONSE FORMAT (JSON):
{
  "overview": "Company description...",
  "products": ["Product 1", "Product 2"],
  "team": ["Name - CEO", "Name - CTO"],
  "market": "Market position description...",
  "revenue": [
    {"value": 600000, "year": 2023, "source": "https://...", "confidence": "HIGH"},
    {"value": 550000, "year": 2022, "source": "https://...", "confidence": "HIGH"}
  ],
  "operating_profit": [...],
  "net_profit": [...],
  "total_assets": [...],
  "equity": [...],
  "total_liabilities": [...],
  "searchQueriesUsed": ["query1", "query2"],
  "sourcesFound": ["url1", "url2"]
}
```

**Configuration**:
- Temperature: `0.0` (no creativity, only factual extraction)
- Max Output Tokens: `8192`
- Response Format: `application/json`
- Response Schema: Validated TypeScript schema

### Prompt 2: Onboarding Conversation Research (Currently Disabled)

**Service**: `lib/services/gemini-company-research.ts`
**Method**: `buildPromptForArea()`
**Model**: `gemini-2.5-flash`
**Tools**: `[{ googleSearch: {} }]` (Google Search Grounding)

**Research Areas**:
- `overview`: Company description, mission, founding year, size
- `financial`: Revenue, profitability, growth trends, funding rounds
- `news`: Recent news from last 6 months, press releases, announcements
- `market`: Market position, competitors, market share, competitive advantages
- `products`: Products/services, categories, features, pricing models
- `team`: Leadership, CEO, board members, founders, team size
- `funding`: Funding rounds, investors, valuation, use of funds

**Example Prompt (Financial Area)**:

```typescript
Company: ${companyName}
Business ID: ${businessId}
Industry: ${industry}
Country: ${country}
Website: ${website}

Research Task: Find financial information about this company.

Search for:
- Latest revenue figures
- Profitability (profit/loss)
- Growth trends
- Funding rounds (if startup/scaleup)
- Major investments or acquisitions
- Stock performance (if public)

Important:
- ONLY report numbers explicitly stated in sources
- Include year for all financial figures
- Cite source for each number
- Do NOT estimate or calculate missing values

Return structured JSON with:
{
  "summary": "Financial overview",
  "keyPoints": ["revenue: X EUR (year: YYYY, source: URL)", ...],
  "confidence": "HIGH" | "MEDIUM" | "LOW"
}
```

**Status**: Currently **DISABLED** (`shouldPerformResearch()` returns `false`) because:
- Takes 60+ seconds per company
- Blocks the conversation flow
- Company data already available from enrichment process

### Prompt 3: Enhanced Analysis (Analysis of Existing Data)

**Service**: `app/api/onboarding/enhanced-analysis/route.ts`
**Model**: `gemini-2.5-flash-lite`
**Tools**: None (no web search, only analyzes existing data)

**Purpose**: Analyzes existing company data (from database) to generate insights and recommendations.

**Prompt Structure**:
- Company information (name, business ID, industry)
- YTJ data (Finnish business registry data)
- Enriched data (from previous research)
- Financial metrics (from database)

**Output**: Comprehensive analysis JSON with:
- Executive summary
- Financial analysis
- Competitive analysis
- Growth opportunities
- Financing recommendations
- Industry insights
- Actionable insights

**Note**: This does NOT perform web research - it only analyzes what's already in the database.

---

## Job Execution Flow

### Job 1: Company Enrichment (`company/enrich.financial-data`)

**Trigger**: Company creation in `/api/companies/create`

**Execution Steps**:
```typescript
1. step.run('update-status-enriching')
   - Update companies.enrichment_status = 'enriching'
   - Set enrichment_started_at timestamp

2. step.run('unified-enrichment')
   - Call UnifiedCompanyEnrichment.enrichCompany()
   - Single Gemini API call with Google Search Grounding
   - Returns: overview, products, team, market, financial data

3. step.run('save-company-info')
   - Save overview, products, market to companies table

4. step.run('save-financial-data')
   - Save multi-year financial data to financial_metrics table
   - One record per fiscal year found

5. step.run('mark-enriched')
   - Update enrichment_status = 'enriched'
   - Set enrichment_method = 'unified_gemini_grounding'
   - Store confidence score and metadata
```

**Estimated Time**: 10-15 seconds
**Cost**: Single Gemini API call

### Job 2: Financial Analysis (`financial/analysis-requested`)

**Trigger**: Pre-analysis step (`/api/onboarding/trigger-analysis`)

**Execution Steps**:
```typescript
1. step.run('fetch-financial-metrics')
   - Fetch all financial_metrics for company
   - Order by fiscal_year ascending

2. Calculate derived metrics for each year:
   - ROE (Return on Equity)
   - Debt-to-Equity Ratio
   - Current Ratio
   - Quick Ratio
   - EBITDA (if components available)
   - DSO (Days Sales Outstanding)
   - Fixed Asset Turnover
   - Revenue Growth Rate

3. step.run('update-financial-metrics')
   - Update all financial_metrics records with calculated values

4. step.run('fetch-latest-financing-needs')
   - Get most recent financing_needs record

5. step.sendEvent('recommendations/generation-requested')
   - If financing_needs exist, trigger recommendation generation
```

**Estimated Time**: 1-2 seconds
**No LLM calls** - only database calculations

---

## Data Storage

### Companies Table

**Fields Updated by Research**:
- `description` - Company overview
- `products` - Array of products/services
- `market` - Market position description
- `enrichment_status` - 'pending' → 'enriching' → 'enriched' / 'failed'
- `enrichment_method` - 'unified_gemini_grounding'
- `enrichment_confidence` - 0-100 score
- `enrichment_started_at` - Timestamp
- `enrichment_completed_at` - Timestamp
- `metadata.enriched_data` - Full research data (overview, products, team, market)
- `metadata.enhanced_analysis` - Deep analysis results (if enhanced-analysis was called)

### Financial Metrics Table

**Fields Populated by Research**:
- `company_id` - Company reference
- `fiscal_year` - Year (2020-2024)
- `fiscal_period` - 'FY2023'
- `revenue` - Liikevaihto
- `operating_profit` - Liikevoitto
- `net_profit` - Nettotulos
- `total_assets` - Taseen loppusumma
- `total_equity` - Oma pääoma
- `total_liabilities` - Vieras pääoma
- `data_source` - Source URL
- `data_confidence` - Confidence score

---

## Error Handling

### Company Enrichment Errors

1. **API Key Missing**: Throws error immediately
2. **Gemini API Failure**: Returns empty structure, marks status as 'failed'
3. **Database Error**: Logs error, does not throw (non-critical updates)
4. **Source Validation**: Untrusted sources marked as 'LOW' confidence

### Financial Analysis Errors

1. **No Financial Metrics**: Returns early, logs warning
2. **Database Update Failure**: Throws error, Inngest retries
3. **Calculation Errors**: Returns null for individual metrics, continues processing

---

## Caching Strategy

### Company Research Cache

**Service**: `lib/services/gemini-company-research.ts`
**Cache Key**: `company-research:${companyName}:${businessId}:${researchAreas.join(',')}`
**TTL**: 1 hour (3600000ms)
**Tags**: `['company-research', 'company:${companyName}']`

**Note**: Unified enrichment does NOT use caching - always fetches fresh data for financial information.

---

## Cost Analysis

### Gemini API Calls

1. **Unified Enrichment**: 1 call per company
   - Model: `gemini-2.5-flash-preview-09-2025`
   - Estimated cost: ~$0.01-0.02 per company (based on input/output tokens)

2. **Onboarding Research** (disabled): Would be 5 calls per company
   - One call per research area (overview, financial, news, products, team)
   - Estimated cost: ~$0.05-0.10 per company

3. **Enhanced Analysis**: 1 call per request
   - Model: `gemini-2.5-flash-lite`
   - Estimated cost: ~$0.005-0.01 per analysis

---

## Trusted Sources

### Financial Data Sources

The system validates that financial data comes from trusted domains:
- `kauppalehti.fi` - Finnish business news and financial data
- `finder.fi` - Finnish company information service
- `asiakastieto.fi` - Finnish credit and business information
- `prh.fi` - Finnish Patent and Registration Office
- `ytj.fi` - Finnish Business Information System

### Source Validation

**Location**: `lib/financial-search/unified-company-enrichment.ts` → `validateSources()`

- Checks each financial data point's source URL
- Validates hostname against trusted domains list
- Marks untrusted sources as 'LOW' confidence
- Filters out null values

---

## Performance Metrics

### Company Enrichment

- **Average Time**: 10-15 seconds
- **Success Rate**: ~85-90% (depends on company data availability)
- **Concurrency**: Max 5 concurrent enrichments
- **Retry Policy**: Inngest default (3 retries with exponential backoff)

### Financial Analysis

- **Average Time**: 1-2 seconds
- **Success Rate**: ~99% (depends on data availability)
- **No Concurrency Limits**: Fast processing

---

## Future Improvements

1. **Re-enable Onboarding Research** with:
   - Async processing (don't block conversation)
   - Caching of results
   - Faster model (gemini-2.5-flash)

2. **Progressive Enrichment**:
   - Start with basic data
   - Enhance with additional research later
   - Show partial results immediately

3. **Multi-language Support**:
   - Swedish companies (Bolagsverket, Allabolag)
   - English companies (Companies House, etc.)

4. **Real-time Updates**:
   - Use Supabase Realtime to show enrichment progress
   - Display partial results as they come in

---

## Summary

### Step 2 "Lähetä & Analysoi" Button Triggers Company Research

When user clicks "Lähetä & Analysoi" (Submit & Analyze) in Step 2:
1. Company saved to database (enrichment_status: 'pending')
2. `company/enrich.financial-data` Inngest event triggered immediately
3. Unified enrichment performs ONE Gemini API call with Google Search Grounding
4. Extracts company info + multi-year financial data from web
5. Saves everything to database (enrichment_status: 'enriched')
6. User navigates to Step 3 (AI Conversation)

### Pre-Analysis Step Processes Already Enriched Data

The pre-analysis step (different button, after document upload) only:
- Processes existing financial metrics (already enriched)
- Calculates derived ratios
- Triggers recommendation generation

**It does NOT perform new web research** - that happens in Step 2.

### Research Uses Single Unified Prompt

Instead of multiple calls, the system uses ONE comprehensive prompt that:
- Gets company overview, products, team, market
- Extracts multi-year financial data (up to 5 years)
- Validates sources
- Returns structured JSON

This approach is faster, cheaper, and more reliable than multiple separate calls.

