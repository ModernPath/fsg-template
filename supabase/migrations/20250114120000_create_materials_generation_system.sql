-- ============================================================================
-- Materials Generation System - Database Schema
-- Created: 2025-01-14
-- Purpose: Complete materials generation workflow support
-- ============================================================================

-- ============================================================================
-- 1. MATERIAL GENERATION JOBS
-- Tracks the entire workflow from initiation to completion
-- ============================================================================

CREATE TABLE IF NOT EXISTS material_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- References
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  
  -- Job Status
  status TEXT NOT NULL DEFAULT 'initiated',
  progress_percentage INTEGER DEFAULT 0,
  current_step TEXT,
  
  -- Phase Tracking
  public_data_collected BOOLEAN DEFAULT false,
  public_data_collected_at TIMESTAMPTZ,
  documents_uploaded BOOLEAN DEFAULT false,
  documents_uploaded_at TIMESTAMPTZ,
  questionnaire_completed BOOLEAN DEFAULT false,
  questionnaire_completed_at TIMESTAMPTZ,
  data_consolidated BOOLEAN DEFAULT false,
  data_consolidated_at TIMESTAMPTZ,
  
  -- Material Types to Generate
  generate_teaser BOOLEAN DEFAULT true,
  generate_im BOOLEAN DEFAULT false,
  generate_pitch_deck BOOLEAN DEFAULT false,
  
  -- Generated Assets (references to company_assets)
  teaser_asset_id UUID REFERENCES company_assets(id),
  im_asset_id UUID REFERENCES company_assets(id),
  pitch_deck_asset_id UUID REFERENCES company_assets(id),
  
  -- Error Handling
  error_message TEXT,
  error_details JSONB,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMPTZ,
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  estimated_completion_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  CONSTRAINT valid_status CHECK (status IN (
    'initiated',
    'collecting_data',
    'awaiting_uploads',
    'processing_uploads',
    'questionnaire_pending',
    'questionnaire_in_progress',
    'consolidating',
    'generating_teaser',
    'generating_im',
    'generating_pitch_deck',
    'review',
    'approved',
    'failed',
    'cancelled'
  )),
  
  CONSTRAINT valid_progress CHECK (progress_percentage >= 0 AND progress_percentage <= 100)
);

-- Indexes for performance
CREATE INDEX idx_material_jobs_company ON material_generation_jobs(company_id);
CREATE INDEX idx_material_jobs_org ON material_generation_jobs(organization_id);
CREATE INDEX idx_material_jobs_status ON material_generation_jobs(status);
CREATE INDEX idx_material_jobs_created_by ON material_generation_jobs(created_by);
CREATE INDEX idx_material_jobs_created_at ON material_generation_jobs(created_at DESC);

COMMENT ON TABLE material_generation_jobs IS 'Tracks materials generation workflow from start to finish';

-- ============================================================================
-- 2. GENERATION DATA CACHE
-- Stores public data fetched from external sources
-- ============================================================================

CREATE TABLE IF NOT EXISTS generation_data_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- References
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES material_generation_jobs(id) ON DELETE CASCADE,
  
  -- Data Source
  source_type TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_url TEXT,
  
  -- Data Content
  data JSONB NOT NULL,
  
  -- Quality Metrics
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  data_quality TEXT, -- 'high', 'medium', 'low'
  
  -- Metadata
  fetch_timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  fetch_duration_ms INTEGER,
  expires_at TIMESTAMPTZ,
  cache_key TEXT,
  
  -- Status
  is_valid BOOLEAN DEFAULT true,
  validation_notes TEXT,
  
  CONSTRAINT valid_source_type CHECK (source_type IN (
    'ytj',
    'credit_rating',
    'market_intel',
    'website',
    'news',
    'social',
    'competitor_analysis',
    'industry_report'
  )),
  
  CONSTRAINT valid_confidence CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)),
  
  CONSTRAINT valid_quality CHECK (data_quality IS NULL OR data_quality IN ('high', 'medium', 'low'))
);

-- Indexes
CREATE INDEX idx_generation_cache_company ON generation_data_cache(company_id);
CREATE INDEX idx_generation_cache_job ON generation_data_cache(job_id);
CREATE INDEX idx_generation_cache_source ON generation_data_cache(source_type, source_name);
CREATE INDEX idx_generation_cache_expires ON generation_data_cache(expires_at);
CREATE INDEX idx_generation_cache_key ON generation_data_cache(cache_key);

COMMENT ON TABLE generation_data_cache IS 'Caches public data to avoid repeated API calls';

-- ============================================================================
-- 3. MATERIAL QUESTIONNAIRE RESPONSES
-- Stores AI-generated questionnaire and user responses
-- ============================================================================

CREATE TABLE IF NOT EXISTS material_questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- References
  job_id UUID REFERENCES material_generation_jobs(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  
  -- Question
  question_id TEXT NOT NULL,
  question_order INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  question_category TEXT,
  question_type TEXT NOT NULL,
  question_options JSONB,
  question_hint TEXT,
  is_required BOOLEAN DEFAULT false,
  
  -- Response
  response_text TEXT,
  response_type TEXT,
  response_data JSONB,
  response_confidence TEXT,
  
  -- Metadata
  answered_by UUID REFERENCES profiles(id),
  answered_at TIMESTAMPTZ,
  time_spent_seconds INTEGER,
  
  -- AI Context
  generated_based_on JSONB, -- What data was used to generate this question
  importance_score DECIMAL(3,2),
  
  CONSTRAINT valid_question_type CHECK (question_type IN (
    'text',
    'textarea',
    'number',
    'boolean',
    'single_choice',
    'multiple_choice',
    'date',
    'currency'
  )),
  
  CONSTRAINT valid_response_confidence CHECK (response_confidence IS NULL OR response_confidence IN ('high', 'medium', 'low'))
);

-- Indexes
CREATE INDEX idx_questionnaire_job ON material_questionnaire_responses(job_id);
CREATE INDEX idx_questionnaire_company ON material_questionnaire_responses(company_id);
CREATE INDEX idx_questionnaire_order ON material_questionnaire_responses(job_id, question_order);
CREATE INDEX idx_questionnaire_answered ON material_questionnaire_responses(answered_at);

COMMENT ON TABLE material_questionnaire_responses IS 'AI-generated contextual questions and user responses';

-- ============================================================================
-- 4. EXTRACTED FINANCIAL DATA
-- Stores financial data extracted from uploaded documents
-- ============================================================================

CREATE TABLE IF NOT EXISTS extracted_financial_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- References
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  asset_id UUID REFERENCES company_assets(id) ON DELETE SET NULL,
  job_id UUID REFERENCES material_generation_jobs(id) ON DELETE CASCADE,
  
  -- Financial Period
  fiscal_year INTEGER NOT NULL,
  period_type TEXT NOT NULL DEFAULT 'annual',
  period_start_date DATE,
  period_end_date DATE,
  
  -- Income Statement
  revenue DECIMAL(18,2),
  cost_of_goods_sold DECIMAL(18,2),
  gross_profit DECIMAL(18,2),
  operating_expenses DECIMAL(18,2),
  ebitda DECIMAL(18,2),
  depreciation DECIMAL(18,2),
  amortization DECIMAL(18,2),
  ebit DECIMAL(18,2),
  interest_expense DECIMAL(18,2),
  tax_expense DECIMAL(18,2),
  net_income DECIMAL(18,2),
  
  -- Balance Sheet
  total_assets DECIMAL(18,2),
  current_assets DECIMAL(18,2),
  cash_and_equivalents DECIMAL(18,2),
  accounts_receivable DECIMAL(18,2),
  inventory DECIMAL(18,2),
  fixed_assets DECIMAL(18,2),
  intangible_assets DECIMAL(18,2),
  
  total_liabilities DECIMAL(18,2),
  current_liabilities DECIMAL(18,2),
  accounts_payable DECIMAL(18,2),
  short_term_debt DECIMAL(18,2),
  long_term_debt DECIMAL(18,2),
  
  equity DECIMAL(18,2),
  retained_earnings DECIMAL(18,2),
  
  -- Cash Flow
  operating_cash_flow DECIMAL(18,2),
  investing_cash_flow DECIMAL(18,2),
  financing_cash_flow DECIMAL(18,2),
  free_cash_flow DECIMAL(18,2),
  
  -- Key Metrics
  employees_count INTEGER,
  revenue_per_employee DECIMAL(18,2),
  gross_margin DECIMAL(5,2),
  ebitda_margin DECIMAL(5,2),
  net_margin DECIMAL(5,2),
  current_ratio DECIMAL(5,2),
  debt_to_equity DECIMAL(5,2),
  
  -- Extraction Metadata
  extraction_method TEXT NOT NULL,
  extraction_confidence DECIMAL(3,2),
  extraction_model TEXT,
  extraction_timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Verification
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,
  
  -- Currency
  currency TEXT DEFAULT 'EUR',
  
  -- Raw Data
  raw_data JSONB,
  extraction_details JSONB,
  
  CONSTRAINT valid_period_type CHECK (period_type IN ('annual', 'q1', 'q2', 'q3', 'q4', 'ytd')),
  
  CONSTRAINT valid_extraction_method CHECK (extraction_method IN ('ocr_ai', 'manual', 'api', 'import')),
  
  CONSTRAINT valid_fiscal_year CHECK (fiscal_year >= 1900 AND fiscal_year <= 2100)
);

-- Indexes
CREATE INDEX idx_financial_data_company ON extracted_financial_data(company_id);
CREATE INDEX idx_financial_data_year ON extracted_financial_data(company_id, fiscal_year DESC);
CREATE INDEX idx_financial_data_asset ON extracted_financial_data(asset_id);
CREATE INDEX idx_financial_data_job ON extracted_financial_data(job_id);
CREATE INDEX idx_financial_data_verified ON extracted_financial_data(verified, verified_at);

COMMENT ON TABLE extracted_financial_data IS 'Financial data extracted from uploaded documents';

-- ============================================================================
-- 5. MATERIAL CONTENT VERSIONS
-- Tracks all versions of generated content for approval workflow
-- ============================================================================

CREATE TABLE IF NOT EXISTS material_content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- References
  asset_id UUID REFERENCES company_assets(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES material_generation_jobs(id) ON DELETE CASCADE,
  
  -- Version Info
  version_number INTEGER NOT NULL DEFAULT 1,
  is_current BOOLEAN DEFAULT false,
  parent_version_id UUID REFERENCES material_content_versions(id),
  
  -- Content
  content_json JSONB NOT NULL,
  formatted_content TEXT,
  content_format TEXT DEFAULT 'markdown',
  
  -- Generation Info
  generated_by TEXT NOT NULL,
  ai_model TEXT,
  generation_prompt TEXT,
  generation_params JSONB,
  generation_timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Review & Approval
  status TEXT DEFAULT 'draft',
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  approval_notes TEXT,
  
  -- Changes
  changes_from_previous JSONB,
  change_summary TEXT,
  edited_sections TEXT[],
  
  -- Metadata
  word_count INTEGER,
  page_count INTEGER,
  metadata JSONB,
  
  CONSTRAINT valid_status CHECK (status IN ('draft', 'review', 'approved', 'rejected', 'archived')),
  
  CONSTRAINT valid_generated_by CHECK (generated_by IN ('ai', 'human', 'hybrid')),
  
  CONSTRAINT valid_content_format CHECK (content_format IN ('markdown', 'html', 'json', 'pdf'))
);

-- Indexes
CREATE INDEX idx_content_versions_asset ON material_content_versions(asset_id);
CREATE INDEX idx_content_versions_job ON material_content_versions(job_id);
CREATE INDEX idx_content_versions_current ON material_content_versions(asset_id, is_current) WHERE is_current = true;
CREATE INDEX idx_content_versions_status ON material_content_versions(status);
CREATE INDEX idx_content_versions_version ON material_content_versions(asset_id, version_number DESC);

COMMENT ON TABLE material_content_versions IS 'Version control for generated materials content';

-- ============================================================================
-- 6. MATERIAL ACCESS LOG
-- Tracks who accessed which materials and when
-- ============================================================================

CREATE TABLE IF NOT EXISTS material_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accessed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- References
  asset_id UUID REFERENCES company_assets(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Accessor Info
  accessed_by UUID REFERENCES profiles(id),
  accessor_type TEXT NOT NULL,
  accessor_email TEXT,
  accessor_name TEXT,
  accessor_organization TEXT,
  
  -- Access Details
  access_method TEXT NOT NULL,
  access_source TEXT, -- 'web', 'email_link', 'api', 'shared_link'
  shared_link_id UUID,
  
  -- Technical Details
  accessor_ip TEXT,
  user_agent TEXT,
  device_type TEXT,
  browser TEXT,
  location_country TEXT,
  location_city TEXT,
  
  -- Session
  session_id TEXT,
  session_duration_seconds INTEGER,
  pages_viewed INTEGER,
  
  -- Metadata
  metadata JSONB,
  
  CONSTRAINT valid_accessor_type CHECK (accessor_type IN (
    'broker',
    'seller',
    'buyer',
    'admin',
    'analyst',
    'external',
    'anonymous'
  )),
  
  CONSTRAINT valid_access_method CHECK (access_method IN (
    'view',
    'download',
    'share',
    'print',
    'email'
  ))
);

-- Indexes
CREATE INDEX idx_access_log_asset ON material_access_log(asset_id);
CREATE INDEX idx_access_log_accessed_at ON material_access_log(accessed_at DESC);
CREATE INDEX idx_access_log_accessed_by ON material_access_log(accessed_by);
CREATE INDEX idx_access_log_company ON material_access_log(company_id);
CREATE INDEX idx_access_log_accessor_type ON material_access_log(accessor_type);
CREATE INDEX idx_access_log_method ON material_access_log(access_method);

COMMENT ON TABLE material_access_log IS 'Audit trail for material access';

-- ============================================================================
-- 7. UPDATE EXISTING TABLES
-- ============================================================================

-- Add material generation tracking to companies
ALTER TABLE companies 
  ADD COLUMN IF NOT EXISTS materials_generated BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS teaser_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS im_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_material_update TIMESTAMPTZ;

-- Add generation columns to company_assets (if not exists)
ALTER TABLE company_assets
  ADD COLUMN IF NOT EXISTS generation_status TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS gamma_presentation_id TEXT,
  ADD COLUMN IF NOT EXISTS gamma_presentation_url TEXT,
  ADD COLUMN IF NOT EXISTS gamma_embed_url TEXT,
  ADD COLUMN IF NOT EXISTS content_version_id UUID REFERENCES material_content_versions(id);

-- Create constraint for generation_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_generation_status'
  ) THEN
    ALTER TABLE company_assets
    ADD CONSTRAINT valid_generation_status
    CHECK (generation_status IN ('manual', 'ai_generated', 'ai_edited', 'approved'));
  END IF;
END $$;

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE material_generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_data_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_questionnaire_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_financial_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_access_log ENABLE ROW LEVEL SECURITY;

-- Policies for material_generation_jobs
CREATE POLICY "Users can view jobs in their organization"
  ON material_generation_jobs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create jobs in their organization"
  ON material_generation_jobs FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update jobs they created or in their org"
  ON material_generation_jobs FOR UPDATE
  USING (
    created_by = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Policies for generation_data_cache
CREATE POLICY "Users can view cached data for their org companies"
  ON generation_data_cache FOR SELECT
  USING (
    company_id IN (
      SELECT id FROM companies 
      WHERE organization_id IN (
        SELECT organization_id FROM user_organizations 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policies for material_questionnaire_responses
CREATE POLICY "Users can view questionnaires for their org"
  ON material_questionnaire_responses FOR SELECT
  USING (
    company_id IN (
      SELECT id FROM companies 
      WHERE organization_id IN (
        SELECT organization_id FROM user_organizations 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can respond to questionnaires"
  ON material_questionnaire_responses FOR UPDATE
  USING (
    company_id IN (
      SELECT id FROM companies 
      WHERE organization_id IN (
        SELECT organization_id FROM user_organizations 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policies for extracted_financial_data
CREATE POLICY "Users can view financial data for their org"
  ON extracted_financial_data FOR SELECT
  USING (
    company_id IN (
      SELECT id FROM companies 
      WHERE organization_id IN (
        SELECT organization_id FROM user_organizations 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policies for material_content_versions
CREATE POLICY "Users can view content versions for their org"
  ON material_content_versions FOR SELECT
  USING (
    asset_id IN (
      SELECT id FROM company_assets 
      WHERE company_id IN (
        SELECT id FROM companies 
        WHERE organization_id IN (
          SELECT organization_id FROM user_organizations 
          WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Policies for material_access_log (read-only for users)
CREATE POLICY "Users can view access logs for their org materials"
  ON material_access_log FOR SELECT
  USING (
    company_id IN (
      SELECT id FROM companies 
      WHERE organization_id IN (
        SELECT organization_id FROM user_organizations 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "System can insert access logs"
  ON material_access_log FOR INSERT
  WITH CHECK (true); -- Allow system to log all access

-- ============================================================================
-- 9. FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update job progress
CREATE OR REPLACE FUNCTION update_job_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate progress based on completed phases
  NEW.progress_percentage := (
    (CASE WHEN NEW.public_data_collected THEN 20 ELSE 0 END) +
    (CASE WHEN NEW.documents_uploaded THEN 20 ELSE 0 END) +
    (CASE WHEN NEW.questionnaire_completed THEN 20 ELSE 0 END) +
    (CASE WHEN NEW.data_consolidated THEN 20 ELSE 0 END) +
    (CASE WHEN NEW.status = 'approved' THEN 20 ELSE 0 END)
  );
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_job_progress
  BEFORE UPDATE ON material_generation_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_job_progress();

-- Function to auto-expire cached data
CREATE OR REPLACE FUNCTION check_cache_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    -- Default: cache for 30 days
    NEW.expires_at := NOW() + INTERVAL '30 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cache_expiration
  BEFORE INSERT ON generation_data_cache
  FOR EACH ROW
  EXECUTE FUNCTION check_cache_expiration();

-- ============================================================================
-- 10. COMMENTS & DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN material_generation_jobs.status IS 'Current status of the generation workflow';
COMMENT ON COLUMN material_generation_jobs.progress_percentage IS 'Automatically calculated based on phase completion';
COMMENT ON COLUMN generation_data_cache.confidence_score IS 'AI confidence in data accuracy (0.00 to 1.00)';
COMMENT ON COLUMN extracted_financial_data.extraction_method IS 'How the data was extracted: ocr_ai, manual, api, or import';
COMMENT ON COLUMN material_content_versions.is_current IS 'Only one version per asset should have is_current=true';
COMMENT ON COLUMN material_access_log.accessor_type IS 'Type of user accessing the material';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

