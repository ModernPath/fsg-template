-- ============================================================================
-- BizExit Company Enrichment System
-- ============================================================================
-- This migration creates the complete data enrichment system for M&A materials
-- Based on Trusty Finance enrichment engine with M&A extensions
-- 
-- Features:
-- - 17 enrichment modules (9 base + 8 M&A extensions)
-- - Source tracking and data provenance
-- - Job tracking and progress monitoring
-- - Quality scoring and confidence metrics
-- ============================================================================

-- ============================================================================
-- 1. MAIN ENRICHED DATA TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS company_enriched_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Foreign Keys
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- ========================================================================
  -- TRUSTY FINANCE BASE MODULES (1-9)
  -- ========================================================================
  
  -- Module 1: Company Basic Information (YTJ/PRH)
  basic_info JSONB DEFAULT '{}'::jsonb,
  /* Structure:
    {
      "name": "Company Name",
      "businessId": "1234567-8",
      "industry": "Software Development",
      "companyForm": "Oy",
      "registrationDate": "2020-01-15",
      "address": "Street 1, 00100 Helsinki",
      "website": "https://example.com",
      "employees": 25,
      "description": "AI-generated company description",
      "products": ["Product A", "Product B"],
      "marketPosition": "Market leader in...",
      "recentNews": ["News item 1", "News item 2"],
      "dataQuality": {
        "verified": true,
        "aiGenerated": false,
        "needsVerification": false,
        "confidence": "HIGH",
        "missingFields": []
      }
    }
  */
  
  -- Module 2: Financial Data (Multi-year)
  financial_data JSONB DEFAULT '{}'::jsonb,
  /* Structure:
    {
      "yearly": [
        {
          "year": 2023,
          "revenue": 1500000,
          "operatingProfit": 250000,
          "netProfit": 180000,
          "ebitda": 300000,
          "totalAssets": 800000,
          "equity": 400000,
          "totalLiabilities": 400000,
          "profitMargin": 16.67,
          "equityRatio": 50.0,
          "returnOnEquity": 45.0,
          "source": "Finder.fi",
          "confidence": "HIGH"
        }
      ],
      "currency": "EUR",
      "lastUpdated": "2024-11-15T10:00:00Z",
      "sourcesUsed": ["Finder.fi", "Asiakastieto.fi"],
      "yearsFound": 3,
      "confidence": "HIGH"
    }
  */
  
  -- Module 3: Industry Analysis
  industry_analysis JSONB DEFAULT '{}'::jsonb,
  /* Structure:
    {
      "industry": "Software Development",
      "industryInfo": "Growing industry with...",
      "industryTrends": ["AI adoption", "Cloud migration"],
      "marketSize": "€5B in Finland",
      "growthRate": "12% annually",
      "keyDrivers": ["Digital transformation", "Remote work"]
    }
  */
  
  -- Module 4: Competitive Analysis
  competitive_analysis JSONB DEFAULT '{}'::jsonb,
  /* Structure:
    {
      "competitiveLandscape": "Fragmented market with...",
      "keyCompetitors": [
        {
          "name": "Competitor A",
          "description": "Main competitor focused on...",
          "marketPosition": "Market leader",
          "estimatedRevenue": "€3M"
        }
      ],
      "marketShare": "5-10% in domestic market",
      "strengths": ["Strong brand", "Technical expertise"],
      "weaknesses": ["Limited sales team", "Small market presence"]
    }
  */
  
  -- Module 5: Growth Analysis
  growth_analysis JSONB DEFAULT '{}'::jsonb,
  /* Structure:
    {
      "growthOpportunities": ["International expansion", "New product lines"],
      "businessModel": "SaaS subscription with professional services",
      "revenueStreams": ["Software licenses", "Consulting", "Support"],
      "expansionPotential": "High - untapped markets in Nordics"
    }
  */
  
  -- Module 6: Financial Health
  financial_health JSONB DEFAULT '{}'::jsonb,
  /* Structure:
    {
      "rating": "A",
      "creditScore": "85/100",
      "stability": "Strong - consistent profitability",
      "cashFlow": "Positive operational cash flow",
      "paymentBehavior": "Excellent - no late payments"
    }
  */
  
  -- Module 7: Personnel Information
  personnel_info JSONB DEFAULT '{}'::jsonb,
  /* Structure:
    {
      "count": 25,
      "trend": "Growing - 40% increase in 2 years",
      "keyManagement": ["CEO: John Doe", "CTO: Jane Smith"],
      "boardMembers": ["Chair: Alice Johnson", "Member: Bob Wilson"],
      "source": "YTJ + LinkedIn"
    }
  */
  
  -- Module 8: Market Intelligence
  market_intelligence JSONB DEFAULT '{}'::jsonb,
  /* Structure:
    {
      "recentNews": ["Funding round announcement", "New customer win"],
      "pressReleases": ["Product launch", "Partnership announcement"],
      "awards": ["Best Startup 2023"],
      "partnerships": ["Microsoft", "AWS"],
      "socialMedia": {
        "linkedinFollowers": 1500,
        "facebookLikes": 500,
        "twitterFollowers": 800
      }
    }
  */
  
  -- Module 9: Web Presence
  web_presence JSONB DEFAULT '{}'::jsonb,
  /* Structure:
    {
      "website": "https://example.com",
      "websiteQuality": "Professional and modern",
      "seoRanking": 75,
      "contentQuality": "High-quality blog and case studies",
      "customerTestimonials": ["Great product!", "Excellent support"]
    }
  */
  
  -- ========================================================================
  -- BIZEXIT M&A EXTENSIONS (10-17)
  -- ========================================================================
  
  -- Module 10: M&A History & Ownership
  ma_history JSONB DEFAULT '{}'::jsonb,
  /* Structure:
    {
      "previousAcquisitions": [
        {
          "year": 2021,
          "target": "Small Tech Co",
          "value": "€500k",
          "description": "Acquired for technology"
        }
      ],
      "previousDivestitures": [],
      "fundingRounds": [
        {
          "date": "2020-06-01",
          "type": "Seed",
          "amount": "€200k",
          "investors": ["Business Angel Network"]
        }
      ],
      "ownership": {
        "mainOwners": ["Founder 1: 60%", "Founder 2: 40%"],
        "ownershipStructure": "Privately held",
        "publiclyTraded": false
      }
    }
  */
  
  -- Module 11: Valuation Data
  valuation_data JSONB DEFAULT '{}'::jsonb,
  /* Structure:
    {
      "estimatedValue": {
        "low": 3000000,
        "mid": 4500000,
        "high": 6000000,
        "method": "EV/Revenue multiple",
        "confidence": "MEDIUM"
      },
      "industryMultiples": {
        "evToRevenue": 3.0,
        "evToEbitda": 15.0,
        "priceToEarnings": 20.0,
        "source": "Industry reports"
      },
      "comparableTransactions": [
        {
          "date": "2023-05-01",
          "target": "Similar Co",
          "buyer": "Larger Corp",
          "value": "€5M",
          "multiple": "3.3x revenue"
        }
      ],
      "assetValue": {
        "tangibleAssets": 500000,
        "intangibleAssets": 1000000,
        "total": 1500000
      }
    }
  */
  
  -- Module 12: Customer Intelligence
  customer_intelligence JSONB DEFAULT '{}'::jsonb,
  /* Structure:
    {
      "customerConcentration": "Top 10 customers = 40% of revenue",
      "customerRetentionRate": "92% annual retention",
      "averageCustomerLifetime": "3.5 years",
      "customerGrowthRate": "25% new customers annually",
      "contractTypes": ["Annual subscriptions", "Multi-year agreements"],
      "recurringRevenue": "85% of total revenue"
    }
  */
  
  -- Module 13: Operational Efficiency
  operational_efficiency JSONB DEFAULT '{}'::jsonb,
  /* Structure:
    {
      "revenuePerEmployee": 60000,
      "profitPerEmployee": 10000,
      "assetTurnover": 1.875,
      "inventoryTurnover": null,
      "workingCapitalCycle": 45,
      "automationLevel": "High - 80% of processes automated"
    }
  */
  
  -- Module 14: Competitive Advantages
  competitive_advantages JSONB DEFAULT '{}'::jsonb,
  /* Structure:
    {
      "uniqueSellingPoints": ["Proprietary AI algorithm", "Strong brand recognition"],
      "barriersToEntry": ["Technical complexity", "Customer relationships"],
      "networkEffects": "Moderate - value increases with user base",
      "switchingCosts": "High - integration complexity",
      "brandStrength": "Strong in local market",
      "proprietaryTechnology": ["Patent-pending ML model", "Custom API"],
      "patents": {
        "count": 2,
        "key": ["ML algorithm patent", "UI/UX patent"]
      },
      "licenses": ["Required industry certifications"]
    }
  */
  
  -- Module 15: Risk Assessment
  risk_assessment JSONB DEFAULT '{}'::jsonb,
  /* Structure:
    {
      "keyRisks": [
        {
          "risk": "Customer concentration",
          "severity": "MEDIUM",
          "mitigation": "Actively diversifying customer base"
        }
      ],
      "legalIssues": [],
      "environmentalLiabilities": [],
      "pendingLitigation": [],
      "regulatoryRisks": ["GDPR compliance", "Industry regulations"],
      "customerConcentrationRisk": "MEDIUM",
      "supplierDependency": "LOW",
      "keyPersonRisk": "MEDIUM - founder-dependent"
    }
  */
  
  -- Module 16: Integration Potential
  integration_potential JSONB DEFAULT '{}'::jsonb,
  /* Structure:
    {
      "synergies": {
        "revenueSynergies": ["Cross-selling opportunities", "Market expansion"],
        "costSynergies": ["Shared infrastructure", "Economies of scale"],
        "estimatedSynergyValue": "€500k annually"
      },
      "culturalFit": "Good - similar company values",
      "integrationComplexity": "MEDIUM",
      "technologyCompatibility": "HIGH - modern tech stack",
      "organizationalAlignment": "GOOD",
      "geographicOverlap": "None - complementary markets"
    }
  */
  
  -- Module 17: Exit Attractiveness
  exit_attractiveness JSONB DEFAULT '{}'::jsonb,
  /* Structure:
    {
      "idealBuyerProfile": ["Strategic buyer in same industry", "PE firm focused on SaaS"],
      "strategicValue": "HIGH - strong IP and customer base",
      "financialValue": "GOOD - profitable with growth potential",
      "urgencyToSell": "MEDIUM - no immediate pressure",
      "sellerMotivation": "Strategic - seeking growth capital and expertise",
      "timing": "Good - favorable market conditions",
      "marketConditions": "Strong M&A activity in sector"
    }
  */
  
  -- ========================================================================
  -- METADATA & QUALITY METRICS
  -- ========================================================================
  
  enrichment_version TEXT DEFAULT '1.0' NOT NULL,
  
  -- Quality Scores (0-100)
  confidence_score DECIMAL(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
  completeness_score DECIMAL(5,2) CHECK (completeness_score >= 0 AND completeness_score <= 100),
  data_quality_score DECIMAL(5,2) CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
  
  -- Timestamps
  last_enriched_at TIMESTAMPTZ,
  enriched_by UUID REFERENCES auth.users(id),
  
  -- Source Tracking
  sources_used TEXT[] DEFAULT ARRAY[]::TEXT[],
  total_api_calls INTEGER DEFAULT 0,
  processing_time_ms INTEGER,
  
  -- Constraints
  CONSTRAINT unique_company_enrichment UNIQUE(company_id)
);

-- Indexes for performance
CREATE INDEX idx_company_enriched_data_company ON company_enriched_data(company_id);
CREATE INDEX idx_company_enriched_data_updated ON company_enriched_data(updated_at DESC);
CREATE INDEX idx_company_enriched_data_confidence ON company_enriched_data(confidence_score DESC);
CREATE INDEX idx_company_enriched_data_completeness ON company_enriched_data(completeness_score DESC);

-- Auto-update updated_at timestamp
CREATE TRIGGER update_company_enriched_data_updated_at
  BEFORE UPDATE ON company_enriched_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 2. ENRICHMENT JOBS TABLE (Progress Tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS enrichment_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- References
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  triggered_by UUID REFERENCES auth.users(id),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending',
  CONSTRAINT valid_enrichment_status CHECK (
    status IN ('pending', 'processing', 'completed', 'failed', 'partial', 'cancelled')
  ),
  
  -- Progress Tracking
  total_modules INTEGER DEFAULT 17 NOT NULL,
  completed_modules INTEGER DEFAULT 0 NOT NULL,
  failed_modules TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Module Status (detailed tracking)
  module_status JSONB DEFAULT '{}'::jsonb,
  /* Structure:
    {
      "basic_info": {
        "status": "completed",
        "startedAt": "2024-11-15T10:00:00Z",
        "completedAt": "2024-11-15T10:00:30Z",
        "duration": 30000,
        "error": null
      },
      "financial_data": {
        "status": "processing",
        "startedAt": "2024-11-15T10:00:30Z",
        "completedAt": null,
        "duration": null,
        "error": null
      }
    }
  */
  
  -- Results
  result_data JSONB,
  error_message TEXT,
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  total_duration_ms INTEGER,
  
  -- Configuration
  config JSONB DEFAULT '{}'::jsonb,
  /* Structure:
    {
      "modules": ["basic_info", "financial_data"],  // null = all modules
      "force": false,                                 // force refresh even if data exists
      "priority": "normal"                            // high, normal, low
    }
  */
  
  -- Inngest event ID (for tracking)
  inngest_event_id TEXT,
  inngest_run_id TEXT
);

-- Indexes
CREATE INDEX idx_enrichment_jobs_company ON enrichment_jobs(company_id);
CREATE INDEX idx_enrichment_jobs_status ON enrichment_jobs(status);
CREATE INDEX idx_enrichment_jobs_created ON enrichment_jobs(created_at DESC);
CREATE INDEX idx_enrichment_jobs_triggered_by ON enrichment_jobs(triggered_by);

-- Auto-update updated_at
CREATE TRIGGER update_enrichment_jobs_updated_at
  BEFORE UPDATE ON enrichment_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 3. DATA SOURCES TABLE (Provenance & Audit Trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- References
  enrichment_job_id UUID REFERENCES enrichment_jobs(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Source Information
  module_name TEXT NOT NULL,
  source_name TEXT NOT NULL,           -- 'YTJ', 'Asiakastieto', 'Gemini AI', 'Tavily', etc.
  source_type TEXT NOT NULL,           -- 'API', 'WEB_SCRAPE', 'AI_GENERATED', 'USER_PROVIDED'
  source_url TEXT,
  
  -- Data
  data_extracted JSONB,
  extraction_timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Quality Metrics
  confidence_level TEXT CHECK (confidence_level IN ('HIGH', 'MEDIUM', 'LOW')),
  verification_status TEXT DEFAULT 'UNVERIFIED' CHECK (
    verification_status IN ('VERIFIED', 'UNVERIFIED', 'NEEDS_REVIEW', 'REJECTED')
  ),
  
  -- Performance Metrics
  cost DECIMAL(10,4),                  -- API call cost in EUR (if applicable)
  response_time_ms INTEGER,
  
  -- Notes
  notes TEXT
);

-- Indexes
CREATE INDEX idx_data_sources_job ON data_sources(enrichment_job_id);
CREATE INDEX idx_data_sources_company ON data_sources(company_id);
CREATE INDEX idx_data_sources_module ON data_sources(module_name);
CREATE INDEX idx_data_sources_source_name ON data_sources(source_name);
CREATE INDEX idx_data_sources_created ON data_sources(created_at DESC);

-- ============================================================================
-- 4. UPDATE COMPANIES TABLE
-- ============================================================================

-- Add enrichment status fields to companies table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'enrichment_status'
  ) THEN
    ALTER TABLE companies ADD COLUMN enrichment_status TEXT DEFAULT 'not_enriched';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'last_enriched_at'
  ) THEN
    ALTER TABLE companies ADD COLUMN last_enriched_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'enrichment_completeness'
  ) THEN
    ALTER TABLE companies ADD COLUMN enrichment_completeness DECIMAL(5,2) DEFAULT 0;
  END IF;
END $$;

-- Add constraint for enrichment_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_company_enrichment_status'
  ) THEN
    ALTER TABLE companies ADD CONSTRAINT valid_company_enrichment_status 
      CHECK (enrichment_status IN ('not_enriched', 'enriching', 'enriched', 'failed', 'partial'));
  END IF;
END $$;

-- Index for enrichment status
CREATE INDEX IF NOT EXISTS idx_companies_enrichment_status ON companies(enrichment_status);

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE company_enriched_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrichment_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view enriched data for their companies
CREATE POLICY "Users can view enriched data for their companies"
  ON company_enriched_data FOR SELECT
  USING (
    company_id IN (
      SELECT id FROM companies
      WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- RLS Policy: Service role can manage all enriched data
CREATE POLICY "Service role can manage enriched data"
  ON company_enriched_data FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- RLS Policy: Users can view enrichment jobs for their companies
CREATE POLICY "Users can view enrichment jobs for their companies"
  ON enrichment_jobs FOR SELECT
  USING (
    company_id IN (
      SELECT id FROM companies
      WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- RLS Policy: Users can create enrichment jobs for their companies
CREATE POLICY "Users can create enrichment jobs for their companies"
  ON enrichment_jobs FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT id FROM companies
      WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- RLS Policy: Service role can manage all enrichment jobs
CREATE POLICY "Service role can manage enrichment jobs"
  ON enrichment_jobs FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- RLS Policy: Users can view data sources for their companies
CREATE POLICY "Users can view data sources for their companies"
  ON data_sources FOR SELECT
  USING (
    company_id IN (
      SELECT id FROM companies
      WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- RLS Policy: Service role can manage all data sources
CREATE POLICY "Service role can manage data sources"
  ON data_sources FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate completeness score
CREATE OR REPLACE FUNCTION calculate_enrichment_completeness(enriched_data company_enriched_data)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  total_modules INTEGER := 17;
  filled_modules INTEGER := 0;
BEGIN
  -- Check each module
  IF enriched_data.basic_info IS NOT NULL AND enriched_data.basic_info != '{}'::jsonb THEN
    filled_modules := filled_modules + 1;
  END IF;
  IF enriched_data.financial_data IS NOT NULL AND enriched_data.financial_data != '{}'::jsonb THEN
    filled_modules := filled_modules + 1;
  END IF;
  IF enriched_data.industry_analysis IS NOT NULL AND enriched_data.industry_analysis != '{}'::jsonb THEN
    filled_modules := filled_modules + 1;
  END IF;
  IF enriched_data.competitive_analysis IS NOT NULL AND enriched_data.competitive_analysis != '{}'::jsonb THEN
    filled_modules := filled_modules + 1;
  END IF;
  IF enriched_data.growth_analysis IS NOT NULL AND enriched_data.growth_analysis != '{}'::jsonb THEN
    filled_modules := filled_modules + 1;
  END IF;
  IF enriched_data.financial_health IS NOT NULL AND enriched_data.financial_health != '{}'::jsonb THEN
    filled_modules := filled_modules + 1;
  END IF;
  IF enriched_data.personnel_info IS NOT NULL AND enriched_data.personnel_info != '{}'::jsonb THEN
    filled_modules := filled_modules + 1;
  END IF;
  IF enriched_data.market_intelligence IS NOT NULL AND enriched_data.market_intelligence != '{}'::jsonb THEN
    filled_modules := filled_modules + 1;
  END IF;
  IF enriched_data.web_presence IS NOT NULL AND enriched_data.web_presence != '{}'::jsonb THEN
    filled_modules := filled_modules + 1;
  END IF;
  IF enriched_data.ma_history IS NOT NULL AND enriched_data.ma_history != '{}'::jsonb THEN
    filled_modules := filled_modules + 1;
  END IF;
  IF enriched_data.valuation_data IS NOT NULL AND enriched_data.valuation_data != '{}'::jsonb THEN
    filled_modules := filled_modules + 1;
  END IF;
  IF enriched_data.customer_intelligence IS NOT NULL AND enriched_data.customer_intelligence != '{}'::jsonb THEN
    filled_modules := filled_modules + 1;
  END IF;
  IF enriched_data.operational_efficiency IS NOT NULL AND enriched_data.operational_efficiency != '{}'::jsonb THEN
    filled_modules := filled_modules + 1;
  END IF;
  IF enriched_data.competitive_advantages IS NOT NULL AND enriched_data.competitive_advantages != '{}'::jsonb THEN
    filled_modules := filled_modules + 1;
  END IF;
  IF enriched_data.risk_assessment IS NOT NULL AND enriched_data.risk_assessment != '{}'::jsonb THEN
    filled_modules := filled_modules + 1;
  END IF;
  IF enriched_data.integration_potential IS NOT NULL AND enriched_data.integration_potential != '{}'::jsonb THEN
    filled_modules := filled_modules + 1;
  END IF;
  IF enriched_data.exit_attractiveness IS NOT NULL AND enriched_data.exit_attractiveness != '{}'::jsonb THEN
    filled_modules := filled_modules + 1;
  END IF;
  
  RETURN ROUND((filled_modules::DECIMAL / total_modules) * 100, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- 7. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE company_enriched_data IS 'Stores comprehensive enriched data for companies from 17 different modules (9 base + 8 M&A extensions)';
COMMENT ON TABLE enrichment_jobs IS 'Tracks enrichment job progress and status for monitoring and debugging';
COMMENT ON TABLE data_sources IS 'Audit trail for all data sources used in enrichment process';

COMMENT ON COLUMN company_enriched_data.basic_info IS 'Module 1: Company basic information from YTJ/PRH';
COMMENT ON COLUMN company_enriched_data.financial_data IS 'Module 2: Multi-year financial data from Asiakastieto/Finder';
COMMENT ON COLUMN company_enriched_data.industry_analysis IS 'Module 3: Industry analysis and trends';
COMMENT ON COLUMN company_enriched_data.competitive_analysis IS 'Module 4: Competitive landscape and positioning';
COMMENT ON COLUMN company_enriched_data.growth_analysis IS 'Module 5: Growth opportunities and business model';
COMMENT ON COLUMN company_enriched_data.financial_health IS 'Module 6: Financial health and credit rating';
COMMENT ON COLUMN company_enriched_data.personnel_info IS 'Module 7: Personnel count and key management';
COMMENT ON COLUMN company_enriched_data.market_intelligence IS 'Module 8: Market intelligence, news, and social media';
COMMENT ON COLUMN company_enriched_data.web_presence IS 'Module 9: Website quality and online presence';
COMMENT ON COLUMN company_enriched_data.ma_history IS 'Module 10: M&A history, funding rounds, and ownership';
COMMENT ON COLUMN company_enriched_data.valuation_data IS 'Module 11: Valuation estimates and industry multiples';
COMMENT ON COLUMN company_enriched_data.customer_intelligence IS 'Module 12: Customer concentration and retention';
COMMENT ON COLUMN company_enriched_data.operational_efficiency IS 'Module 13: Operational efficiency metrics';
COMMENT ON COLUMN company_enriched_data.competitive_advantages IS 'Module 14: Competitive advantages and moats';
COMMENT ON COLUMN company_enriched_data.risk_assessment IS 'Module 15: Risk assessment and due diligence notes';
COMMENT ON COLUMN company_enriched_data.integration_potential IS 'Module 16: Integration potential for M&A';
COMMENT ON COLUMN company_enriched_data.exit_attractiveness IS 'Module 17: Exit strategy and buyer attractiveness';

