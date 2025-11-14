# Materials Generation System - Comprehensive Implementation Plan

## Executive Summary

This document outlines the complete implementation plan for the **Materials Generation System**, one of the most critical features of the BizExit platform. The system enables automated creation of professional sales materials (teasers, information memorandums, pitch decks, and valuation reports) using AI and public/private data sources.

**Business Critical Goals:**
1. **Fast Time-to-Market**: Generate professional teaser in minutes to improve lead conversion
2. **Data Quality**: Combine public data + customer uploads + AI questionnaire for comprehensive materials
3. **Professional Output**: Integration with Gamma.app or similar for presentation-quality documents
4. **Scalability**: Handle multiple concurrent generation requests
5. **Accuracy**: Ensure all financial and business data is verified and accurate

---

## 1. Current State Analysis

### 1.1 Existing Database Schema

```sql
-- company_assets table (stores all materials)
CREATE TABLE company_assets (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  company_id UUID REFERENCES companies(id),
  
  -- File Information
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,              -- 'teaser', 'im', 'pitch_deck', 'valuation_report'
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  thumbnail_url TEXT,
  
  -- Document Type
  document_type TEXT REFERENCES document_types(code),
  
  -- Generation Metadata
  generated BOOLEAN DEFAULT false,
  generation_prompt TEXT,
  generation_model TEXT,
  generation_params JSONB,
  
  -- Access Control
  access_level TEXT DEFAULT 'private',
  
  -- Processing Status
  virus_scanned BOOLEAN,
  virus_scan_result TEXT,
  ocr_processed BOOLEAN,
  ocr_text TEXT,
  
  -- Metadata
  metadata JSONB
);
```

### 1.2 Current API Endpoint

**Path**: `/api/bizexit/materials/route.ts`

**Current Capabilities:**
- ✅ GET: List materials
- ✅ POST: Create material record (basic)
- ❌ NO AI generation
- ❌ NO public data enrichment
- ❌ NO presentation generation
- ❌ NO workflow orchestration

**Critical Issues:**
1. Materials API uses old `organization_id` query pattern (needs fixing)
2. No actual document generation logic
3. No integration with AI services
4. No integration with Gamma.app or similar
5. No multi-stage workflow

---

## 2. Target Architecture

### 2.1 System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    Materials Generation System                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐      ┌──────────────────┐                 │
│  │  Data Collection │──────│  AI Enrichment   │                 │
│  │  Pipeline        │      │  Engine          │                 │
│  └─────────────────┘      └──────────────────┘                 │
│           │                        │                             │
│           │                        │                             │
│           ▼                        ▼                             │
│  ┌──────────────────────────────────────────┐                  │
│  │       Data Consolidation Layer           │                  │
│  │  (Company Profile + Public Data + Docs)  │                  │
│  └──────────────────────────────────────────┘                  │
│                      │                                           │
│                      ▼                                           │
│  ┌──────────────────────────────────────────┐                  │
│  │    Document Generation Orchestrator      │                  │
│  └──────────────────────────────────────────┘                  │
│           │              │              │                        │
│           ▼              ▼              ▼                        │
│   ┌───────────┐  ┌────────────┐  ┌──────────┐                 │
│   │  Teaser   │  │     IM     │  │  Pitch   │                 │
│   │ Generator │  │ Generator  │  │  Deck    │                 │
│   └───────────┘  └────────────┘  └──────────┘                 │
│           │              │              │                        │
│           └──────────────┴──────────────┘                        │
│                      │                                           │
│                      ▼                                           │
│  ┌──────────────────────────────────────────┐                  │
│  │   Gamma.app / Presentation Generator     │                  │
│  └──────────────────────────────────────────┘                  │
│                      │                                           │
│                      ▼                                           │
│  ┌──────────────────────────────────────────┐                  │
│  │     Storage & Version Management         │                  │
│  └──────────────────────────────────────────┘                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Sources

#### A. Public Data Sources (Automated)
1. **Business Registry Data** (YTJ in Finland)
   - Company name, business ID
   - Legal structure, founding date
   - Official address, industry classification
   - Board members, ownership structure

2. **Financial Data** (PRH, Asiakastieto)
   - Credit rating
   - Publicly available financials
   - Company size, employee count
   - Payment behavior

3. **Market Intelligence** (Tavily, DataForSEO)
   - Industry trends
   - Market size and growth
   - Competitor analysis
   - News and press releases

4. **Web Presence** (Website scraping)
   - Company description
   - Products and services
   - Customer testimonials
   - Team information

#### B. Customer Provided Data
1. **Financial Documents**
   - Balance sheets (last 3 years)
   - Income statements (last 3 years)
   - Cash flow statements
   - Management accounts (latest)

2. **Operational Documents**
   - Customer lists (anonymized)
   - Supplier agreements
   - Product/service catalogs
   - Patents and IP documentation

3. **Strategic Documents**
   - Business plan
   - Growth strategy
   - Market analysis
   - SWOT analysis

#### C. AI-Generated Questionnaire
Comprehensive questionnaire covering:
- Business model and value proposition
- Revenue streams and customer segments
- Key resources and partnerships
- Growth opportunities
- Risk factors
- Unique selling points

---

## 3. Workflow Design

### 3.1 Material Generation Workflow

```
Step 1: Initiation
├─ User clicks "Generate Materials" for a company
├─ System checks if company has minimum required data
└─ Creates generation job with status "initiated"

Step 2: Data Collection (Phase 1 - Public Data)
├─ Fetch YTJ business registry data
├─ Fetch credit rating and public financials
├─ Search market intelligence (Tavily)
├─ Scrape company website
└─ Store in generation_data_cache table

Step 3: Document Upload (Phase 2 - Customer Data)
├─ Present upload interface for financial docs
├─ OCR processing for uploaded PDFs
├─ Extract key financial metrics
├─ Validate data consistency
└─ Store in company_assets + extracted_data tables

Step 4: AI Questionnaire (Phase 3 - Strategic Data)
├─ Generate contextual questions based on:
│  ├─ Industry type
│  ├─ Company size
│  ├─ Available data gaps
│  └─ Target audience (buyer profile)
├─ Present interactive questionnaire
├─ Validate and store responses
└─ Update generation_data_cache

Step 5: Data Consolidation
├─ Merge all data sources
├─ Resolve conflicts (e.g., different revenue figures)
├─ Fill gaps with AI estimates (clearly marked)
├─ Create comprehensive company profile
└─ Store in consolidated_company_data table

Step 6: Content Generation (AI-Powered)
├─ Generate Teaser (Quick, 2-3 pages)
│  ├─ Executive summary
│  ├─ Key highlights
│  ├─ Basic financials
│  └─ Contact information
├─ Generate Information Memorandum (Full, 20-30 pages)
│  ├─ Detailed company overview
│  ├─ Market analysis
│  ├─ Financial performance (3 years)
│  ├─ Growth strategy
│  ├─ Risk factors
│  └─ Investment highlights
├─ Generate Pitch Deck (10-15 slides)
│  ├─ Problem/Solution
│  ├─ Market opportunity
│  ├─ Business model
│  ├─ Traction
│  ├─ Financials
│  ├─ Team
│  └─ Investment ask
└─ Use Gemini 2.5 Pro for content quality

Step 7: Presentation Generation (Gamma.app)
├─ Format content for Gamma.app API
├─ Generate professional presentation
├─ Apply BizExit branding
├─ Add charts, graphs, and visuals
└─ Export as PDF and interactive link

Step 8: Review & Approval
├─ Send to broker/seller for review
├─ Highlight AI-generated sections
├─ Allow inline editing
├─ Track version history
└─ Require approval before distribution

Step 9: Distribution
├─ Add to materials library
├─ Make available for deal sharing
├─ Generate shareable links (with access control)
└─ Track views and downloads
```

### 3.2 Progressive Generation Strategy

**Quick Teaser First (Priority 1)**
- Time: 5-10 minutes
- Purpose: Enable immediate lead generation
- Content: Basic company info + highlights
- Source: Public data + minimal uploads

**Full IM Later (Priority 2)**
- Time: 2-4 hours (with customer input)
- Purpose: Comprehensive due diligence material
- Content: Complete business analysis
- Source: All data sources combined

**Pitch Deck (Priority 3)**
- Time: 1-2 hours
- Purpose: Investor presentations
- Content: Story-driven narrative
- Source: Teaser + IM content, reformatted

---

## 4. Database Schema Extensions

### 4.1 New Tables Required

```sql
-- Material generation jobs (track workflow)
CREATE TABLE material_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  company_id UUID REFERENCES companies(id),
  organization_id UUID REFERENCES organizations(id),
  created_by UUID REFERENCES profiles(id),
  
  -- Job Status
  status TEXT NOT NULL, -- 'initiated', 'collecting_data', 'awaiting_uploads', 
                        -- 'questionnaire_pending', 'generating', 'review', 
                        -- 'approved', 'failed'
  progress_percentage INTEGER DEFAULT 0,
  
  -- Phase Tracking
  public_data_collected BOOLEAN DEFAULT false,
  documents_uploaded BOOLEAN DEFAULT false,
  questionnaire_completed BOOLEAN DEFAULT false,
  
  -- Material Types to Generate
  generate_teaser BOOLEAN DEFAULT true,
  generate_im BOOLEAN DEFAULT false,
  generate_pitch_deck BOOLEAN DEFAULT false,
  
  -- Generated Assets
  teaser_asset_id UUID REFERENCES company_assets(id),
  im_asset_id UUID REFERENCES company_assets(id),
  pitch_deck_asset_id UUID REFERENCES company_assets(id),
  
  -- Error Handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB,
  
  CONSTRAINT valid_status CHECK (status IN (
    'initiated', 'collecting_data', 'awaiting_uploads', 
    'questionnaire_pending', 'generating', 'review', 
    'approved', 'failed', 'cancelled'
  ))
);

-- Data collection cache (store fetched public data)
CREATE TABLE generation_data_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  company_id UUID REFERENCES companies(id),
  job_id UUID REFERENCES material_generation_jobs(id),
  
  -- Data Source
  source_type TEXT NOT NULL, -- 'ytj', 'credit_rating', 'market_intel', 'website'
  source_name TEXT NOT NULL,
  
  -- Data Content
  data JSONB NOT NULL,
  
  -- Metadata
  fetch_timestamp TIMESTAMPTZ DEFAULT NOW(),
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  expires_at TIMESTAMPTZ,
  
  CONSTRAINT valid_source_type CHECK (source_type IN (
    'ytj', 'credit_rating', 'market_intel', 'website', 'news', 'social'
  ))
);

-- AI questionnaire responses
CREATE TABLE material_questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  job_id UUID REFERENCES material_generation_jobs(id),
  company_id UUID REFERENCES companies(id),
  
  -- Question
  question_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  question_category TEXT, -- 'business_model', 'financials', 'strategy', etc.
  
  -- Response
  response_text TEXT,
  response_type TEXT, -- 'text', 'number', 'boolean', 'multiple_choice'
  response_data JSONB,
  
  -- Metadata
  answered_by UUID REFERENCES profiles(id),
  answered_at TIMESTAMPTZ,
  confidence_level TEXT -- 'high', 'medium', 'low'
);

-- Extracted financial data from documents
CREATE TABLE extracted_financial_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  company_id UUID REFERENCES companies(id),
  asset_id UUID REFERENCES company_assets(id),
  
  -- Financial Period
  fiscal_year INTEGER NOT NULL,
  period_type TEXT NOT NULL, -- 'annual', 'q1', 'q2', 'q3', 'q4'
  
  -- Income Statement
  revenue DECIMAL(18,2),
  cost_of_goods_sold DECIMAL(18,2),
  gross_profit DECIMAL(18,2),
  operating_expenses DECIMAL(18,2),
  ebitda DECIMAL(18,2),
  ebit DECIMAL(18,2),
  net_income DECIMAL(18,2),
  
  -- Balance Sheet
  total_assets DECIMAL(18,2),
  current_assets DECIMAL(18,2),
  total_liabilities DECIMAL(18,2),
  current_liabilities DECIMAL(18,2),
  equity DECIMAL(18,2),
  
  -- Cash Flow
  operating_cash_flow DECIMAL(18,2),
  investing_cash_flow DECIMAL(18,2),
  financing_cash_flow DECIMAL(18,2),
  
  -- Key Metrics
  employees_count INTEGER,
  
  -- Extraction Metadata
  extraction_method TEXT, -- 'ocr', 'manual', 'api'
  confidence_score DECIMAL(3,2),
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  
  -- Currency
  currency TEXT DEFAULT 'EUR',
  
  -- Raw Data
  raw_data JSONB,
  
  CONSTRAINT valid_period_type CHECK (period_type IN ('annual', 'q1', 'q2', 'q3', 'q4'))
);

-- Generation content versions (track edits and approvals)
CREATE TABLE material_content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  asset_id UUID REFERENCES company_assets(id),
  job_id UUID REFERENCES material_generation_jobs(id),
  
  -- Version Info
  version_number INTEGER NOT NULL,
  is_current BOOLEAN DEFAULT false,
  
  -- Content
  content_json JSONB NOT NULL, -- Structured content before formatting
  formatted_content TEXT, -- HTML or Markdown
  
  -- Generation Info
  generated_by TEXT, -- 'ai', 'human', 'hybrid'
  ai_model TEXT,
  generation_prompt TEXT,
  
  -- Review & Approval
  status TEXT DEFAULT 'draft', -- 'draft', 'review', 'approved', 'rejected'
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  -- Changes
  changes_from_previous JSONB,
  
  CONSTRAINT valid_status CHECK (status IN ('draft', 'review', 'approved', 'rejected'))
);

-- Material access tracking (who viewed what)
CREATE TABLE material_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  asset_id UUID REFERENCES company_assets(id),
  
  -- Accessor Info
  accessed_by UUID REFERENCES profiles(id),
  accessor_type TEXT, -- 'broker', 'buyer', 'seller', 'external'
  accessor_email TEXT,
  accessor_ip TEXT,
  
  -- Access Details
  access_method TEXT, -- 'download', 'view', 'share'
  user_agent TEXT,
  
  -- Metadata
  metadata JSONB
);
```

### 4.2 Schema Modifications

```sql
-- Add material generation tracking to companies
ALTER TABLE companies 
  ADD COLUMN materials_generated BOOLEAN DEFAULT false,
  ADD COLUMN teaser_generated_at TIMESTAMPTZ,
  ADD COLUMN im_generated_at TIMESTAMPTZ,
  ADD COLUMN last_material_update TIMESTAMPTZ;

-- Add asset_type enum to company_assets (if not exists)
ALTER TABLE company_assets
  ADD COLUMN IF NOT EXISTS asset_type TEXT;

UPDATE company_assets SET asset_type = type WHERE asset_type IS NULL;

-- Add generation status to company_assets
ALTER TABLE company_assets
  ADD COLUMN IF NOT EXISTS generation_status TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS gamma_presentation_id TEXT,
  ADD COLUMN IF NOT EXISTS gamma_presentation_url TEXT;

-- Create indexes for performance
CREATE INDEX idx_material_jobs_company ON material_generation_jobs(company_id);
CREATE INDEX idx_material_jobs_status ON material_generation_jobs(status);
CREATE INDEX idx_generation_cache_company ON generation_data_cache(company_id);
CREATE INDEX idx_generation_cache_job ON generation_data_cache(job_id);
CREATE INDEX idx_questionnaire_job ON material_questionnaire_responses(job_id);
CREATE INDEX idx_financial_data_company_year ON extracted_financial_data(company_id, fiscal_year);
CREATE INDEX idx_content_versions_asset ON material_content_versions(asset_id);
CREATE INDEX idx_access_log_asset ON material_access_log(asset_id);
```

---

## 5. API Implementation

### 5.1 API Endpoints Structure

```
/api/bizexit/materials/
├── generate/
│   ├── initiate          POST   - Start generation job
│   ├── [jobId]/status    GET    - Check job status
│   └── [jobId]/cancel    POST   - Cancel job
│
├── data-collection/
│   ├── public-data       POST   - Trigger public data fetch
│   ├── upload            POST   - Upload documents
│   ├── extract-financial POST   - Extract data from uploads
│   └── [jobId]/data      GET    - Get collected data
│
├── questionnaire/
│   ├── generate          POST   - Generate AI questionnaire
│   ├── [jobId]/questions GET    - Get questions
│   ├── [jobId]/respond   POST   - Submit responses
│   └── [jobId]/progress  GET    - Check completion
│
├── generation/
│   ├── teaser            POST   - Generate teaser
│   ├── im                POST   - Generate IM
│   ├── pitch-deck        POST   - Generate pitch deck
│   └── [jobId]/content   GET    - Get generated content
│
├── review/
│   ├── [assetId]         GET    - Get material for review
│   ├── [assetId]/edit    PUT    - Edit material
│   ├── [assetId]/approve POST   - Approve material
│   └── [assetId]/reject  POST   - Reject material
│
└── distribution/
    ├── [assetId]/share   POST   - Generate share link
    ├── [assetId]/access  GET    - Get access log
    └── [assetId]/download GET   - Download material
```

---

## 6. Integration Specifications

### 6.1 Gamma.app Integration

**API Documentation**: https://gamma.app/docs/api

**Authentication**: API Key (from environment)

**Workflow:**
```javascript
// 1. Create presentation from structured content
const gammaResponse = await fetch('https://api.gamma.app/v1/presentations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${GAMMA_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Company Teaser - [Company Name]',
    slides: [
      {
        title: 'Executive Summary',
        content: markdown_content,
        layout: 'title-content'
      },
      // ... more slides
    ],
    theme: 'professional',
    branding: {
      logo: company_logo_url,
      primaryColor: '#1E40AF', // BizExit brand color
      fontFamily: 'Inter'
    }
  })
});

// 2. Get presentation URL
const { id, url, embed_url } = await gammaResponse.json();

// 3. Store in database
await supabase
  .from('company_assets')
  .update({
    gamma_presentation_id: id,
    gamma_presentation_url: url,
    storage_path: embed_url
  })
  .eq('id', assetId);
```

**Alternative**: If Gamma.app doesn't have API, use:
- **Beautiful.ai API**
- **Pitch.com API**  
- **Slides.com API**
- Or **puppeteer** + custom templates

### 6.2 Data Sources Integration

#### A. YTJ (Finnish Business Registry)
```typescript
// Already implemented in /api/ytj/search/route.ts
const ytjData = await fetch(
  `https://avoindata.prh.fi/bis/v1/${businessId}`
);
```

#### B. Tavily Search (Market Intelligence)
```typescript
// Already available via tools/tavily-search.ts
const marketData = await tavilyClient.search(
  `${companyName} ${industry} market analysis Finland`,
  {
    searchDepth: 'advanced',
    maxResults: 10,
    includeAnswer: true
  }
);
```

#### C. DataForSEO (SEO & Web Data)
```typescript
const webData = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/advanced', {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${DATAFORSEO_CREDENTIALS}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    keyword: `${companyName} reviews`,
    location_code: 2246, // Finland
    language_code: 'fi'
  })
});
```

#### D. Gemini AI (Content Generation)
```typescript
// Already available via lib/gemini.ts and tools/gemini.ts
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_STUDIO_KEY!);
const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.0-flash-exp',
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 4096
  }
});

const result = await model.generateContent({
  contents: [{
    role: 'user',
    parts: [{
      text: `Generate a professional business teaser for:\n${JSON.stringify(companyData, null, 2)}`
    }]
  }]
});
```

---

## 7. Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Priority**: P0 (Critical)

**Tasks:**
1. ✅ Fix materials API organization_id query
2. Create database migrations for new tables
3. Implement basic job creation and tracking
4. Set up Inngest workers for background processing
5. Create materials generation UI skeleton

**Deliverables:**
- Working job creation endpoint
- Database schema deployed
- Basic UI for initiating generation

### Phase 2: Data Collection (Week 3-4)
**Priority**: P0 (Critical)

**Tasks:**
1. Implement public data fetchers (YTJ, Tavily)
2. Create document upload flow with OCR
3. Build financial data extraction (using Gemini)
4. Implement data consolidation logic
5. Create data review UI

**Deliverables:**
- Automated public data collection
- Document upload with extraction
- Consolidated company profile

### Phase 3: Teaser Generation (Week 5-6)
**Priority**: P0 (Critical - MVP)

**Tasks:**
1. Design teaser template structure
2. Implement AI content generation (Gemini)
3. Integrate Gamma.app or alternative
4. Create review and approval workflow
5. Build teaser preview UI

**Deliverables:**
- **Working teaser generation (MVP)**
- Professional PDF output
- Review and approval system

### Phase 4: Questionnaire System (Week 7-8)
**Priority**: P1 (High)

**Tasks:**
1. Design contextual question generator
2. Implement interactive questionnaire UI
3. Build response validation
4. Integrate responses into data consolidation
5. Create progress tracking

**Deliverables:**
- AI-generated questionnaires
- Response collection system
- Enhanced data quality

### Phase 5: Full IM Generation (Week 9-11)
**Priority**: P1 (High)

**Tasks:**
1. Design comprehensive IM template
2. Implement advanced financial analysis
3. Generate market analysis sections
4. Create risk assessment module
5. Build full IM assembly

**Deliverables:**
- Complete Information Memorandum
- Professional formatting
- 20-30 page documents

### Phase 6: Pitch Deck Generation (Week 12-13)
**Priority**: P2 (Medium)

**Tasks:**
1. Design pitch deck templates (multiple styles)
2. Implement story-driven content generation
3. Create visual data representation
4. Build slide customization
5. Integrate with presentation tools

**Deliverables:**
- Professional pitch decks
- Multiple templates
- Interactive presentations

### Phase 7: Distribution & Analytics (Week 14-15)
**Priority**: P2 (Medium)

**Tasks:**
1. Implement secure sharing links
2. Build access control system
3. Create view tracking analytics
4. Implement NDA-gated access
5. Build analytics dashboard

**Deliverables:**
- Secure material distribution
- Access tracking
- Usage analytics

### Phase 8: Optimization & Scale (Week 16+)
**Priority**: P3 (Low)

**Tasks:**
1. Performance optimization
2. Caching strategies
3. Parallel processing
4. Error handling improvements
5. User feedback integration

**Deliverables:**
- Fast generation times
- Reliable system
- High user satisfaction

---

## 8. Technical Implementation Details

### 8.1 Inngest Workers (Background Jobs)

```typescript
// lib/inngest-materials-functions.ts

export const generateMaterialsJob = inngest.createFunction(
  { id: 'generate-materials' },
  { event: 'materials/generate.requested' },
  async ({ event, step }) => {
    const { jobId, companyId, types } = event.data;

    // Step 1: Collect public data
    const publicData = await step.run('collect-public-data', async () => {
      return await collectPublicData(companyId);
    });

    // Step 2: Wait for document uploads (pause job)
    await step.waitForEvent('materials/documents.uploaded', {
      event: 'materials/documents.uploaded',
      timeout: '7d', // Wait up to 7 days
      match: 'data.jobId'
    });

    // Step 3: Extract financial data
    const financialData = await step.run('extract-financial', async () => {
      return await extractFinancialData(jobId);
    });

    // Step 4: Generate questionnaire
    await step.run('send-questionnaire', async () => {
      return await generateAndSendQuestionnaire(jobId, companyId);
    });

    // Step 5: Wait for questionnaire completion
    await step.waitForEvent('materials/questionnaire.completed', {
      event: 'materials/questionnaire.completed',
      timeout: '14d',
      match: 'data.jobId'
    });

    // Step 6: Consolidate all data
    const consolidatedData = await step.run('consolidate-data', async () => {
      return await consolidateCompanyData(jobId);
    });

    // Step 7: Generate materials (parallel)
    const materials = await step.run('generate-content', async () => {
      const promises = [];
      
      if (types.includes('teaser')) {
        promises.push(generateTeaser(jobId, consolidatedData));
      }
      if (types.includes('im')) {
        promises.push(generateIM(jobId, consolidatedData));
      }
      if (types.includes('pitch_deck')) {
        promises.push(generatePitchDeck(jobId, consolidatedData));
      }

      return await Promise.all(promises);
    });

    // Step 8: Convert to presentations (Gamma.app)
    const presentations = await step.run('create-presentations', async () => {
      return await Promise.all(
        materials.map(m => createGammaPresentation(m))
      );
    });

    // Step 9: Update job status
    await step.run('finalize-job', async () => {
      await supabase
        .from('material_generation_jobs')
        .update({
          status: 'review',
          progress_percentage: 100,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);
    });

    // Step 10: Notify stakeholders
    await step.run('send-notifications', async () => {
      await sendMaterialsReadyNotification(jobId);
    });

    return { success: true, materials, presentations };
  }
);
```

### 8.2 Content Generation with Gemini

```typescript
// lib/ai/materials-generator.ts

interface CompanyData {
  basic: { name: string; industry: string; founded: number };
  financials: FinancialData[];
  market: MarketData;
  questionnaire: QuestionnaireResponses;
}

export async function generateTeaserContent(data: CompanyData): Promise<TeaserContent> {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 3000
    }
  });

  const prompt = `
You are a professional M&A advisor creating a business teaser.

**COMPANY DATA:**
${JSON.stringify(data, null, 2)}

**INSTRUCTIONS:**
Generate a professional 2-page business teaser with the following sections:

1. EXECUTIVE SUMMARY (2-3 paragraphs)
   - Company overview
   - Key value proposition
   - Transaction opportunity

2. BUSINESS HIGHLIGHTS (4-6 bullet points)
   - Unique selling points
   - Competitive advantages
   - Market position

3. FINANCIAL SNAPSHOT
   - Latest revenue and EBITDA
   - Growth trajectory (3 years)
   - Key metrics

4. TRANSACTION DETAILS
   - Type of sale
   - Target buyer profile
   - Timeline

**OUTPUT FORMAT:** Return as JSON with structure:
{
  "title": "...",
  "executive_summary": "...",
  "highlights": [...],
  "financials": {...},
  "transaction": {...}
}

**TONE:** Professional, compelling, fact-based
**LANGUAGE:** Clear, concise, no jargon
**FOCUS:** Investment opportunity, not just company description
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  // Parse JSON response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse AI response');
  }

  return JSON.parse(jsonMatch[0]);
}

export async function generateIMContent(data: CompanyData): Promise<IMContent> {
  // Similar structure but much more detailed
  // 20-30 pages covering:
  // - Company history and evolution
  // - Management team
  // - Products and services
  // - Market analysis
  // - Financial performance (detailed)
  // - Growth strategy
  // - Risk factors
  // - Investment highlights
  // - Transaction structure
}
```

### 8.3 Gamma.app Integration

```typescript
// lib/integrations/gamma.ts

interface GammaSlide {
  title: string;
  content: string;
  layout: 'title' | 'title-content' | 'two-column' | 'image-full';
  image?: string;
}

export async function createGammaPresentation(
  content: TeaserContent | IMContent,
  type: 'teaser' | 'im' | 'pitch_deck'
): Promise<{ id: string; url: string; pdfUrl: string }> {
  
  // Convert content to slides
  const slides = convertContentToSlides(content, type);

  // Create presentation via Gamma API
  const response = await fetch('https://api.gamma.app/v1/presentations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GAMMA_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: content.title,
      slides: slides,
      theme: {
        name: 'professional',
        colors: {
          primary: '#1E40AF',
          secondary: '#F59E0B',
          background: '#FFFFFF'
        },
        fonts: {
          heading: 'Inter',
          body: 'Inter'
        }
      },
      options: {
        enableComments: false,
        exportPdf: true,
        watermark: false
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gamma API error: ${response.statusText}`);
  }

  const result = await response.json();

  return {
    id: result.id,
    url: result.url,
    pdfUrl: result.pdfExportUrl
  };
}

function convertContentToSlides(
  content: TeaserContent,
  type: string
): GammaSlide[] {
  const slides: GammaSlide[] = [];

  // Title slide
  slides.push({
    title: content.title,
    content: content.subtitle || 'Investment Opportunity',
    layout: 'title'
  });

  // Executive summary
  slides.push({
    title: 'Executive Summary',
    content: content.executive_summary,
    layout: 'title-content'
  });

  // Highlights
  slides.push({
    title: 'Key Highlights',
    content: content.highlights.map(h => `• ${h}`).join('\n'),
    layout: 'title-content'
  });

  // Financials
  slides.push({
    title: 'Financial Performance',
    content: formatFinancials(content.financials),
    layout: 'two-column'
  });

  // Add more slides based on type...

  return slides;
}
```

---

## 9. UI/UX Design

### 9.1 Materials Generation Flow

```
┌────────────────────────────────────────────────────────┐
│              Company Detail Page                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │  [Generate Sales Materials] Button                │ │
│  └──────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────┐
│          Material Generation Wizard                     │
│                                                          │
│  Step 1: Select Materials                               │
│  ☑ Teaser (Quick - 10 minutes)                         │
│  ☐ Information Memorandum (Detailed - 2-4 hours)      │
│  ☐ Pitch Deck (Investor-ready - 1-2 hours)            │
│                                                          │
│  [Continue] ──────────────────────────────────────────▶│
└────────────────────────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────┐
│  Step 2: Public Data Collection (Automated)            │
│  ✓ Business Registry Data                              │
│  ✓ Credit Rating                                       │
│  ⏳ Market Intelligence (30s remaining)                │
│  ⏳ Web Scraping (45s remaining)                       │
│                                                          │
│  [Skip to Next] [Wait for Completion]                  │
└────────────────────────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────┐
│  Step 3: Upload Financial Documents                    │
│  ┌──────────────────────────────────────────────────┐ │
│  │  📄 Drag & drop or click to upload               │ │
│  │                                                    │ │
│  │  Required:                                        │ │
│  │  • Balance Sheet (last 3 years)                  │ │
│  │  • Income Statement (last 3 years)               │ │
│  │                                                    │ │
│  │  Optional but recommended:                        │ │
│  │  • Cash Flow Statement                            │ │
│  │  • Management Accounts (latest)                   │ │
│  └──────────────────────────────────────────────────┘ │
│                                                          │
│  Uploaded: 2 files (Processing...)                     │
│  [Continue] [Skip for Teaser-only]                     │
└────────────────────────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────┐
│  Step 4: AI Questionnaire (20 questions)               │
│  ┌──────────────────────────────────────────────────┐ │
│  │  Question 5 of 20                                 │ │
│  │                                                    │ │
│  │  What is your company's main competitive          │ │
│  │  advantage in the market?                         │ │
│  │                                                    │ │
│  │  ┌────────────────────────────────────────────┐  │ │
│  │  │ [Text area for answer]                     │  │ │
│  │  └────────────────────────────────────────────┘  │ │
│  │                                                    │ │
│  │  [Previous] [Save & Continue]                     │ │
│  └──────────────────────────────────────────────────┘ │
│                                                          │
│  Progress: ████████░░░░░░░░ 40%                        │
│  [Save Draft] [Complete Later]                         │
└────────────────────────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────┐
│  Step 5: AI Content Generation                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │  🤖 AI is crafting your materials...             │ │
│  │                                                    │ │
│  │  ✓ Analyzing company data                        │ │
│  │  ✓ Generating executive summary                  │ │
│  │  ⏳ Creating business highlights (2 min)         │ │
│  │  ⏳ Formatting financials                         │ │
│  │  ⏳ Assembling presentation (Gamma.app)           │ │
│  │                                                    │ │
│  │  Estimated time remaining: 3 minutes              │ │
│  └──────────────────────────────────────────────────┘ │
│                                                          │
│  [Leave this page safely - we'll email you]            │
└────────────────────────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────┐
│  Step 6: Review & Edit                                 │
│  ┌──────────────────────────────────────────────────┐ │
│  │  📄 Company Teaser - Preview                     │ │
│  │                                                    │ │
│  │  [View in Gamma] [Download PDF]                  │ │
│  │                                                    │ │
│  │  🟡 AI-generated content (review recommended)     │ │
│  │                                                    │ │
│  │  Executive Summary:                               │ │
│  │  [Editable text area with rich formatting]       │ │
│  │                                                    │ │
│  │  [Edit Inline] [Regenerate Section]              │ │
│  └──────────────────────────────────────────────────┘ │
│                                                          │
│  [Save Draft] [Approve & Publish]                      │
└────────────────────────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────┐
│  ✅ Materials Ready!                                   │
│                                                          │
│  Your sales materials are ready to share:              │
│                                                          │
│  📄 Company Teaser                                     │
│     [View] [Download] [Share Link] [Analytics]         │
│                                                          │
│  Want more detailed materials?                          │
│  [Generate Information Memorandum]                      │
│                                                          │
│  [Go to Materials Library] [Create New Deal]           │
└────────────────────────────────────────────────────────┘
```

---

## 10. Success Metrics

### 10.1 Key Performance Indicators

**Business Metrics:**
- Time to first teaser: < 15 minutes
- Teaser generation success rate: > 95%
- User satisfaction score: > 4.5/5
- Materials usage in deals: > 80% of deals

**Technical Metrics:**
- API response time: < 2s (non-generation endpoints)
- Generation job completion rate: > 98%
- Public data fetch success: > 90%
- Document OCR accuracy: > 95%

**Quality Metrics:**
- AI content accuracy (human review): > 90%
- Financial data extraction accuracy: > 98%
- User edits per generated document: < 20% content changed

### 10.2 Monitoring & Alerts

```typescript
// Set up monitoring for critical paths
- Job stuck in "generating" for > 30 minutes
- Multiple consecutive job failures
- Gamma.app API errors
- Data extraction failures
- Low confidence scores (< 0.7)
```

---

## 11. Risk Mitigation

### 11.1 Data Quality Risks

**Risk**: Inaccurate financial data from OCR
**Mitigation**: 
- Manual verification step for all financials
- Confidence scores for extracted data
- Side-by-side comparison with originals
- Allow easy manual correction

**Risk**: Outdated public data
**Mitigation**:
- Cache expiration (30 days)
- Timestamp all data sources
- Display data age in materials
- Re-fetch option

### 11.2 Technical Risks

**Risk**: Gamma.app API unavailable
**Mitigation**:
- Fallback to alternative services
- Local PDF generation with templates
- Queue jobs for retry
- User notification system

**Risk**: AI generates incorrect content
**Mitigation**:
- Always mark AI-generated sections
- Mandatory human review before sharing
- Version control for all edits
- Easy rollback to previous versions

### 11.3 Legal & Compliance Risks

**Risk**: Confidential data leaks
**Mitigation**:
- Encryption at rest and in transit
- Access control and audit logs
- NDA enforcement
- Watermarking sensitive documents

**Risk**: Misleading financial information
**Mitigation**:
- Disclaimer in all materials
- Verification requirements
- Legal review option
- Clear "unverified" labels

---

## 12. Documentation Requirements

### 12.1 Developer Documentation
- API endpoint specifications
- Database schema documentation
- Integration guides (Gamma, AI services)
- Worker job specifications
- Error handling guide

### 12.2 User Documentation
- Materials generation guide
- Document upload requirements
- Questionnaire tips
- Review and approval workflow
- Sharing and distribution guide

### 12.3 Admin Documentation
- System monitoring guide
- Troubleshooting common issues
- Manual intervention procedures
- Data verification protocols
- Compliance checklist

---

## 13. Next Steps

### Immediate Actions (This Week)

1. **Review & Approval**
   - ✅ Review this implementation plan
   - ⏳ Get stakeholder signoff
   - ⏳ Prioritize must-have vs nice-to-have features

2. **Technical Setup**
   - Create database migrations
   - Set up Gamma.app account and API keys
   - Configure environment variables
   - Create project structure

3. **Team Alignment**
   - Assign development resources
   - Set up project board
   - Schedule daily standups
   - Define definition of done

### Week 1 Deliverables

- Database schema deployed
- Materials API fixed (organization_id)
- Basic job creation working
- UI mockups approved

### Sprint Planning

- 2-week sprints
- Demo every sprint end
- MVP target: Week 6 (Teaser generation working)
- Full release: Week 15

---

## Conclusion

This materials generation system is **mission-critical** for BizExit's value proposition. By automating the creation of professional sales materials, we:

1. **Reduce time-to-market** from weeks to minutes
2. **Improve lead conversion** with immediate teasers
3. **Ensure data quality** through multi-source verification
4. **Maintain professionalism** via AI + Gamma.app
5. **Scale efficiently** with background job processing

**The system is complex but achievable** with the outlined architecture. The phased approach allows for early wins (teaser generation) while building toward comprehensive material creation.

**Key Success Factor**: Strong integration between data collection, AI generation, and presentation tools (Gamma.app).

---

**Document Version**: 1.0  
**Created**: 2025-01-14  
**Author**: AI Development Assistant  
**Status**: DRAFT - Awaiting Review  
**Next Review**: After stakeholder feedback

