-- ============================================================================
-- BizExit Platform - Core Schema Migration
-- Created: 2025-11-11
-- Description: Creates all core tables for BizExit M&A platform
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================================
-- 1. ORGANIZATIONS (Multi-tenant container)
-- ============================================================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL DEFAULT 'broker', -- 'broker', 'seller', 'platform'
  logo_url TEXT,
  website TEXT,
  country TEXT,
  industry TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  active BOOLEAN DEFAULT true NOT NULL,
  CONSTRAINT name_length CHECK (char_length(name) >= 2),
  CONSTRAINT valid_type CHECK (type IN ('broker', 'seller', 'platform'))
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_active ON organizations(active);
CREATE INDEX idx_organizations_type ON organizations(type);

COMMENT ON TABLE organizations IS 'Multi-tenant organizations (brokers, sellers, platform)';

-- ============================================================================
-- 2. USER_ORGANIZATIONS (Many-to-many user<>org relationship)
-- ============================================================================

CREATE TABLE user_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  permissions JSONB DEFAULT '{}'::jsonb,
  active BOOLEAN DEFAULT true NOT NULL,
  UNIQUE(user_id, organization_id),
  CONSTRAINT valid_role CHECK (role IN ('admin', 'broker', 'seller', 'analyst', 'viewer'))
);

CREATE INDEX idx_user_organizations_user ON user_organizations(user_id);
CREATE INDEX idx_user_organizations_org ON user_organizations(organization_id);
CREATE INDEX idx_user_organizations_role ON user_organizations(role);

COMMENT ON TABLE user_organizations IS 'Links users to organizations with roles';

-- ============================================================================
-- 3. UPDATE PROFILES TABLE (Add new fields)
-- ============================================================================

ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'buyer',
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

-- Add constraint for valid roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_profile_role'
  ) THEN
    ALTER TABLE profiles 
    ADD CONSTRAINT valid_profile_role 
    CHECK (role IN ('admin', 'broker', 'seller', 'buyer', 'partner', 'analyst'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

COMMENT ON COLUMN profiles.role IS 'User primary role: admin, broker, seller, buyer, partner, analyst';

-- ============================================================================
-- 4. COMPANIES (Businesses being sold)
-- ============================================================================

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic Information
  name TEXT NOT NULL,
  legal_name TEXT,
  business_id TEXT, -- Y-tunnus, VAT, etc.
  country TEXT NOT NULL,
  city TEXT,
  founded_year INTEGER,
  website TEXT,
  industry TEXT NOT NULL,
  sub_industry TEXT,
  
  -- Business Details
  description TEXT,
  employees_count INTEGER,
  legal_structure TEXT, -- 'LLC', 'Corporation', 'Partnership', etc.
  
  -- Financial Summary
  annual_revenue DECIMAL(18,2),
  annual_ebitda DECIMAL(18,2),
  asking_price DECIMAL(18,2),
  currency TEXT DEFAULT 'EUR',
  
  -- Status
  status TEXT DEFAULT 'draft' NOT NULL,
  
  -- AI/RAG
  embedding VECTOR(1536),
  embedding_updated_at TIMESTAMPTZ,
  
  -- Metadata
  featured BOOLEAN DEFAULT false,
  confidential BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  
  CONSTRAINT name_length CHECK (char_length(name) >= 2),
  CONSTRAINT valid_status CHECK (status IN ('draft', 'review', 'active', 'under_offer', 'sold', 'archived')),
  CONSTRAINT positive_financials CHECK (
    (annual_revenue IS NULL OR annual_revenue >= 0) AND
    (asking_price IS NULL OR asking_price >= 0)
  )
);

CREATE INDEX idx_companies_org ON companies(organization_id);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_industry ON companies(industry);
CREATE INDEX idx_companies_country ON companies(country);
CREATE INDEX idx_companies_featured ON companies(featured) WHERE featured = true;
CREATE INDEX idx_companies_embedding ON companies USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

COMMENT ON TABLE companies IS 'Companies/businesses being sold';

-- ============================================================================
-- 5. COMPANY_FINANCIALS (Detailed financial metrics)
-- ============================================================================

CREATE TABLE company_financials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  
  -- Period
  fiscal_year INTEGER NOT NULL,
  period_start DATE,
  period_end DATE,
  
  -- Income Statement
  revenue DECIMAL(18,2),
  cost_of_goods_sold DECIMAL(18,2),
  gross_profit DECIMAL(18,2),
  operating_expenses DECIMAL(18,2),
  ebitda DECIMAL(18,2),
  depreciation DECIMAL(18,2),
  ebit DECIMAL(18,2),
  interest_expense DECIMAL(18,2),
  tax_expense DECIMAL(18,2),
  net_income DECIMAL(18,2),
  
  -- Balance Sheet
  total_assets DECIMAL(18,2),
  current_assets DECIMAL(18,2),
  fixed_assets DECIMAL(18,2),
  total_liabilities DECIMAL(18,2),
  current_liabilities DECIMAL(18,2),
  long_term_debt DECIMAL(18,2),
  equity DECIMAL(18,2),
  
  -- Cash Flow
  operating_cash_flow DECIMAL(18,2),
  investing_cash_flow DECIMAL(18,2),
  financing_cash_flow DECIMAL(18,2),
  free_cash_flow DECIMAL(18,2),
  
  -- Ratios
  gross_margin DECIMAL(5,2),
  ebitda_margin DECIMAL(5,2),
  net_margin DECIMAL(5,2),
  current_ratio DECIMAL(5,2),
  debt_to_equity DECIMAL(5,2),
  
  -- Metadata
  currency TEXT DEFAULT 'EUR',
  audited BOOLEAN DEFAULT false,
  notes TEXT,
  
  UNIQUE(company_id, fiscal_year),
  CONSTRAINT valid_fiscal_year CHECK (fiscal_year >= 1900 AND fiscal_year <= 2100)
);

CREATE INDEX idx_company_financials_company ON company_financials(company_id);
CREATE INDEX idx_company_financials_year ON company_financials(fiscal_year DESC);

COMMENT ON TABLE company_financials IS 'Detailed financial statements per year';

-- ============================================================================
-- 6. DOCUMENT_TYPES (System-wide document definitions)
-- ============================================================================

CREATE TABLE document_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  
  -- Generation Settings
  requires_ai_generation BOOLEAN DEFAULT false,
  prompt_template_path TEXT,
  estimated_pages INTEGER,
  
  -- Access Requirements
  requires_nda BOOLEAN DEFAULT false,
  access_level TEXT DEFAULT 'private',
  
  -- Ordering
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  
  CONSTRAINT valid_category CHECK (category IN ('marketing', 'financial', 'legal', 'due_diligence')),
  CONSTRAINT valid_access_level CHECK (access_level IN ('public', 'teaser', 'nda_signed', 'due_diligence', 'private'))
);

CREATE INDEX idx_document_types_code ON document_types(code);
CREATE INDEX idx_document_types_category ON document_types(category);
CREATE INDEX idx_document_types_active ON document_types(active);

COMMENT ON TABLE document_types IS 'System-wide document type definitions';

-- Insert default document types
INSERT INTO document_types (code, name, description, category, requires_ai_generation, requires_nda, access_level, display_order) VALUES
  ('teaser', 'Teaser', '2-page executive summary', 'marketing', true, false, 'teaser', 1),
  ('im', 'Information Memorandum', 'Comprehensive 20-50 page document', 'marketing', true, true, 'nda_signed', 2),
  ('pitch_deck', 'Pitch Deck', '10-15 slide presentation', 'marketing', true, true, 'nda_signed', 3),
  ('financial_statement', 'Financial Statement', 'Detailed financial reports', 'financial', false, true, 'nda_signed', 4),
  ('valuation', 'Valuation Report', 'Company valuation analysis', 'financial', true, true, 'nda_signed', 5),
  ('nda', 'Non-Disclosure Agreement', 'NDA template', 'legal', false, false, 'private', 6),
  ('loi', 'Letter of Intent', 'LOI template', 'legal', false, true, 'private', 7),
  ('dd_checklist', 'Due Diligence Checklist', 'DD document list', 'due_diligence', true, true, 'due_diligence', 8),
  ('faq', 'Frequently Asked Questions', 'Common Q&A', 'marketing', true, true, 'nda_signed', 9);

-- ============================================================================
-- 7. COMPANY_ASSETS (Documents, images, videos)
-- ============================================================================

CREATE TABLE company_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  
  -- File Information
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
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
  access_level TEXT DEFAULT 'private' NOT NULL,
  
  -- Processing
  virus_scanned BOOLEAN DEFAULT false,
  virus_scan_result TEXT,
  ocr_processed BOOLEAN DEFAULT false,
  ocr_text TEXT,
  
  -- Versioning
  version INTEGER DEFAULT 1,
  parent_asset_id UUID REFERENCES company_assets(id),
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  
  CONSTRAINT valid_asset_type CHECK (type IN ('document', 'image', 'video', 'financial_statement')),
  CONSTRAINT valid_asset_access CHECK (access_level IN ('public', 'teaser', 'nda_signed', 'due_diligence', 'private')),
  CONSTRAINT positive_file_size CHECK (file_size > 0)
);

CREATE INDEX idx_company_assets_company ON company_assets(company_id);
CREATE INDEX idx_company_assets_type ON company_assets(type);
CREATE INDEX idx_company_assets_document_type ON company_assets(document_type);
CREATE INDEX idx_company_assets_access ON company_assets(access_level);
CREATE INDEX idx_company_assets_version ON company_assets(parent_asset_id, version);

COMMENT ON TABLE company_assets IS 'All documents and media files for companies';

-- Continue in next migration file for remaining tables...
-- (This is Phase 1 - Core tables)

COMMENT ON SCHEMA public IS 'BizExit Platform - Phase 1 Migration Complete';

