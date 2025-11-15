# Company Enrichment System - Implementation Documentation

## Overview

The Company Enrichment System is a comprehensive data enrichment platform that automatically collects, analyzes, and enriches company information using AI and public data sources. The system is based on Trusty Finance's proven enrichment engine, extended with M&A-specific modules for BizExit platform.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  COMPANY ENRICHMENT SYSTEM                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────┐      ┌──────────────────┐                  │
│  │  API Layer     │──────│  Inngest Jobs    │                  │
│  │  (Next.js)     │      │  (Background)    │                  │
│  └────────────────┘      └──────────────────┘                  │
│           │                        │                             │
│           ▼                        ▼                             │
│  ┌──────────────────────────────────────────┐                  │
│  │      Company Enrichment Engine           │                  │
│  │  (17 Modules: 9 Base + 8 M&A Extensions) │                  │
│  └──────────────────────────────────────────┘                  │
│           │                                                       │
│           ▼                                                       │
│  ┌──────────────────────────────────────────┐                  │
│  │         PostgreSQL Database              │                  │
│  │  (company_enriched_data, enrichment_jobs)│                  │
│  └──────────────────────────────────────────┘                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Enrichment Modules

### Base Modules (1-9) - From Trusty Finance

1. **Company Basic Information** (`basic_info`)
   - YTJ/Business registry data
   - Company description, products
   - Website, address, employees
   - Recent news and updates

2. **Financial Data** (`financial_data`)
   - Multi-year financial statements (3-5 years)
   - Revenue, profit, assets, equity
   - Financial ratios and metrics
   - Sources: Finder.fi, Asiakastieto.fi

3. **Industry Analysis** (`industry_analysis`)
   - Industry overview and trends
   - Market size and growth rate
   - Key drivers and challenges
   - Industry reports

4. **Competitive Analysis** (`competitive_analysis`)
   - Competitive landscape
   - Key competitors
   - Market share estimates
   - Strengths and weaknesses

5. **Growth Analysis** (`growth_analysis`)
   - Growth opportunities
   - Business model description
   - Revenue streams
   - Expansion potential

6. **Financial Health** (`financial_health`)
   - Credit rating
   - Financial stability assessment
   - Cash flow situation
   - Payment behavior

7. **Personnel Information** (`personnel_info`)
   - Employee count and trend
   - Key management team
   - Board members
   - Growth trajectory

8. **Market Intelligence** (`market_intelligence`)
   - Recent news and press releases
   - Awards and recognition
   - Partnerships
   - Social media presence

9. **Web Presence** (`web_presence`)
   - Website quality assessment
   - SEO ranking
   - Content quality
   - Customer testimonials

### M&A Extension Modules (10-17) - BizExit Specific

10. **M&A History** (`ma_history`)
    - Previous acquisitions and divestitures
    - Funding rounds
    - Ownership structure
    - Investment history

11. **Valuation Data** (`valuation_data`)
    - Estimated company value (low/mid/high)
    - Industry multiples (EV/Revenue, EV/EBITDA, P/E)
    - Comparable transactions
    - Asset-based valuation

12. **Customer Intelligence** (`customer_intelligence`)
    - Customer concentration
    - Customer retention rate
    - Contract types
    - Recurring revenue percentage

13. **Operational Efficiency** (`operational_efficiency`)
    - Revenue per employee
    - Asset turnover
    - Working capital cycle
    - Automation level

14. **Competitive Advantages** (`competitive_advantages`)
    - Unique selling points
    - Barriers to entry
    - Patents and IP
    - Brand strength

15. **Risk Assessment** (`risk_assessment`)
    - Key business risks
    - Legal and regulatory issues
    - Customer concentration risk
    - Key person dependency

16. **Integration Potential** (`integration_potential`)
    - Synergy opportunities
    - Cultural fit assessment
    - Integration complexity
    - Technology compatibility

17. **Exit Attractiveness** (`exit_attractiveness`)
    - Ideal buyer profile
    - Strategic value
    - Market timing
    - Seller motivation

## Database Schema

### `company_enriched_data`
Stores all enriched data for companies.

```sql
CREATE TABLE company_enriched_data (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  
  -- Base Modules (1-9)
  basic_info JSONB,
  financial_data JSONB,
  industry_analysis JSONB,
  competitive_analysis JSONB,
  growth_analysis JSONB,
  financial_health JSONB,
  personnel_info JSONB,
  market_intelligence JSONB,
  web_presence JSONB,
  
  -- M&A Extensions (10-17)
  ma_history JSONB,
  valuation_data JSONB,
  customer_intelligence JSONB,
  operational_efficiency JSONB,
  competitive_advantages JSONB,
  risk_assessment JSONB,
  integration_potential JSONB,
  exit_attractiveness JSONB,
  
  -- Metadata
  confidence_score DECIMAL(5,2),
  completeness_score DECIMAL(5,2),
  data_quality_score DECIMAL(5,2),
  last_enriched_at TIMESTAMPTZ,
  sources_used TEXT[],
  processing_time_ms INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `enrichment_jobs`
Tracks enrichment job progress.

```sql
CREATE TABLE enrichment_jobs (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  status TEXT, -- 'pending', 'processing', 'completed', 'failed'
  total_modules INTEGER DEFAULT 17,
  completed_modules INTEGER DEFAULT 0,
  module_status JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  total_duration_ms INTEGER,
  config JSONB
);
```

### `data_sources`
Audit trail for data sources.

```sql
CREATE TABLE data_sources (
  id UUID PRIMARY KEY,
  enrichment_job_id UUID REFERENCES enrichment_jobs(id),
  company_id UUID REFERENCES companies(id),
  module_name TEXT,
  source_name TEXT,
  source_type TEXT, -- 'API', 'WEB_SCRAPE', 'AI_GENERATED'
  data_extracted JSONB,
  confidence_level TEXT,
  response_time_ms INTEGER
);
```

## API Endpoints

### `POST /api/companies/[id]/enrich`
Triggers enrichment process for a company.

**Request:**
```json
{
  "modules": ["basic_info", "financial_data"], // Optional: specific modules
  "force": false,                               // Force refresh
  "priority": "normal"                          // Job priority
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "uuid",
  "estimatedDuration": 510, // seconds
  "message": "Enrichment process started"
}
```

### `GET /api/companies/[id]/enriched-data`
Retrieves enriched company data.

**Response:**
```json
{
  "success": true,
  "data": {
    "basicInfo": {...},
    "financialData": {...},
    // ... all 17 modules
  },
  "metadata": {
    "confidenceScore": 85,
    "completenessScore": 92,
    "lastEnriched": "2024-11-15T10:00:00Z",
    "sourcesUsed": ["YTJ", "Finder.fi", "Gemini AI"]
  }
}
```

### `GET /api/enrichment-jobs/[id]`
Checks enrichment job status (for progress tracking).

**Response:**
```json
{
  "success": true,
  "job": {
    "id": "uuid",
    "status": "processing",
    "progress": {
      "totalModules": 17,
      "completedModules": 8,
      "currentModule": "financial_health",
      "percentage": 47
    },
    "timing": {
      "startedAt": "2024-11-15T10:00:00Z",
      "estimatedCompletion": "2024-11-15T10:08:00Z"
    }
  }
}
```

## Inngest Background Job

The enrichment process runs as an Inngest background job for:
- Long-running operations (5-10 minutes)
- Retry logic on failures
- Progress tracking
- Parallel module execution

**Event:** `company/enrichment.requested`

**Workflow:**
1. Initialize job → `pending`
2. Fetch company details
3. Run base modules (1-9) - Parallel execution
4. Run M&A modules (10-17) - Sequential execution
5. Save enriched data
6. Update job status → `completed`
7. Update company status

## Data Sources

### Public APIs
- **YTJ/PRH** - Finnish business registry
- **Bolagsverket** - Swedish business registry
- **Asiakastieto.fi** - Credit information
- **Finder.fi** - Financial data

### AI-Powered Search
- **Google Gemini AI** - With Google Search grounding
- Searches from:
  - Company websites
  - News articles
  - Industry reports
  - Social media (LinkedIn, etc.)

## Quality Metrics

### Confidence Score (0-100)
Calculated based on:
- YTJ verification: 25 points
- Financial data years: up to 25 points
- Description quality: 15 points
- Products/services: 10 points
- Recent news: 10 points
- Other fields: 15 points

### Completeness Score (0-100)
Percentage of filled modules (17 total).

### Data Quality Score (0-100)
Based on source reliability and verification status.

## Usage Example

### Frontend Usage

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';

// Start enrichment
const enrichMutation = useMutation({
  mutationFn: async (companyId: string) => {
    const res = await fetch(`/api/companies/${companyId}/enrich`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ force: false }),
    });
    return res.json();
  },
});

// Poll job status
const { data: jobStatus } = useQuery({
  queryKey: ['enrichment-job', jobId],
  queryFn: () => fetch(`/api/enrichment-jobs/${jobId}`).then(r => r.json()),
  refetchInterval: 2000, // Poll every 2 seconds
  enabled: !!jobId,
});

// Fetch enriched data
const { data: enrichedData } = useQuery({
  queryKey: ['company-enriched', companyId],
  queryFn: () => fetch(`/api/companies/${companyId}/enriched-data`).then(r => r.json()),
});
```

## Implementation Status

### ✅ Phase 1: Foundation (COMPLETED)
- [x] Database migrations
- [x] Types definitions
- [x] API endpoints
- [x] Inngest job framework

### ✅ Phase 2: Base Modules (COMPLETED)
- [x] Module 1: Company Basic Info
- [x] Module 2: Financial Data
- [x] Module 3: Industry Analysis
- [x] Module 4: Competitive Analysis
- [x] Module 5: Growth Analysis
- [x] Module 6: Financial Health
- [x] Module 7: Personnel Info
- [x] Module 8: Market Intelligence
- [x] Module 9: Web Presence

### ⏳ Phase 3: M&A Extensions (IN PROGRESS)
- [x] Module file structures created
- [ ] Module 10: M&A History (placeholder)
- [ ] Module 11: Valuation Data (placeholder)
- [ ] Module 12: Customer Intelligence (placeholder)
- [ ] Module 13: Operational Efficiency (placeholder)
- [ ] Module 14: Competitive Advantages (placeholder)
- [ ] Module 15: Risk Assessment (placeholder)
- [ ] Module 16: Integration Potential (placeholder)
- [ ] Module 17: Exit Attractiveness (placeholder)

### 🔜 Phase 4: Dashboard UI
- [ ] Enrichment status indicator
- [ ] Progress modal
- [ ] Data visualization widgets
- [ ] Confidence/completeness metrics display

### 🔜 Phase 5: Materials Integration
- [ ] Teaser generation using enriched data
- [ ] Information Memorandum generation
- [ ] Data quality validation for materials

## Performance Considerations

### Estimated Timing
- Base modules (1-2): 30-60 seconds (2 Gemini calls)
- Additional modules (3-9): 3-5 minutes (7 Gemini calls)
- M&A modules (10-17): 4-6 minutes (8 Gemini calls)
- **Total**: ~8-12 minutes for full enrichment

### Optimization Strategies
1. **Parallel execution** of independent modules
2. **Caching** of YTJ and public registry data
3. **Incremental updates** (refresh only changed modules)
4. **Rate limiting** to avoid API throttling

### Cost Estimation
- Gemini AI calls: ~$0.50 per enrichment (17 calls)
- Total per enrichment: ~$0.50-1.00
- Monthly (100 enrichments): ~$50-100

## Security & Compliance

### Data Protection
- Row Level Security (RLS) on all tables
- Only company organization members can view enriched data
- Service role for background job execution
- Audit trail via `data_sources` table

### API Rate Limiting
- Max 5 concurrent enrichments (Inngest concurrency)
- Per-company locking (one enrichment at a time)

### GDPR Compliance
- User consent for data collection
- Right to erasure (delete enriched data)
- Data portability (export enriched data)

## Troubleshooting

### Common Issues

**Enrichment fails with "No data available"**
- Company not in YTJ/business registry
- Business ID incorrect
- No financial data available publicly

**Enrichment stuck in "processing"**
- Check Inngest dashboard for errors
- Review logs in enrichment_jobs table
- Verify Google AI API key

**Low confidence scores**
- Limited public data available
- AI couldn't verify information
- Company website/presence minimal

## Future Enhancements

### Planned Features
1. **Multi-country support** (Sweden, Norway, Denmark)
2. **Real-time data updates** (webhooks from data sources)
3. **Custom enrichment rules** (per-organization)
4. **Enrichment scheduling** (auto-refresh quarterly)
5. **Data export** (PDF, Excel)
6. **Comparison tools** (compare multiple companies)

### Technical Improvements
1. **Smart caching** (reduce API calls)
2. **Incremental updates** (only changed modules)
3. **Batch enrichment** (multiple companies)
4. **Quality scoring improvements**
5. **Source diversification** (more data providers)

## Support & Documentation

- **Main Docs**: `/docs/subsystems/COMPANY_ENRICHMENT_SYSTEM.md`
- **API Reference**: `/docs/backend.md`
- **Database Schema**: `/docs/datamodel.md`
- **Type Definitions**: `/types/company-enrichment.ts`

---

**Last Updated**: November 15, 2024  
**Version**: 1.0  
**Status**: Phase 1-2 Complete, Phase 3 In Progress

