-- ============================================================================
-- Fix Materials Generation Dependencies
-- Created: 2025-01-14
-- Purpose: Create missing tables that materials generation depends on
-- ============================================================================

-- ============================================================================
-- 1. ORGANIZATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  business_id TEXT UNIQUE, -- Finnish Y-tunnus
  website TEXT,
  industry TEXT,
  size TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS (policies created later)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. USER_ORGANIZATIONS TABLE (if not exists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  UNIQUE(user_id, organization_id)
);

-- Enable RLS
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. COMPANIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic Info
  name TEXT NOT NULL,
  business_id TEXT, -- Finnish Y-tunnus
  description TEXT,
  industry TEXT,
  website TEXT,
  
  -- Financial
  valuation DECIMAL,
  revenue DECIMAL,
  ebitda DECIMAL,
  employees INTEGER,
  
  -- Status
  status TEXT DEFAULT 'active',
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS (policies created later)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. COMPANY_ASSETS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS company_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- References
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  
  -- Asset Info
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'teaser', 'im', 'pitch_deck', 'financial_document', etc.
  storage_path TEXT,
  file_url TEXT,
  file_size BIGINT,
  mime_type TEXT,
  
  -- Gamma.app integration
  gamma_presentation_url TEXT,
  gamma_presentation_id TEXT,
  
  -- Content (for AI-generated text)
  content JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS (policies created later)
ALTER TABLE company_assets ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. INDEXES for Performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_companies_organization_id ON companies(organization_id);
CREATE INDEX IF NOT EXISTS idx_companies_business_id ON companies(business_id);
CREATE INDEX IF NOT EXISTS idx_company_assets_company_id ON company_assets(company_id);
CREATE INDEX IF NOT EXISTS idx_company_assets_organization_id ON company_assets(organization_id);
CREATE INDEX IF NOT EXISTS idx_company_assets_type ON company_assets(type);
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_organization_id ON user_organizations(organization_id);

-- ============================================================================
-- 6. UPDATE TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_assets_updated_at BEFORE UPDATE ON company_assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. ROW LEVEL SECURITY POLICIES
-- (Created after all tables exist)
-- ============================================================================

-- User Organizations Policies
CREATE POLICY "Users can view own organization memberships"
  ON user_organizations FOR SELECT
  USING ( user_id = auth.uid() );

-- Organizations Policies
CREATE POLICY "Organizations are viewable by members"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Companies Policies
CREATE POLICY "Companies viewable by organization members"
  ON companies FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can insert companies"
  ON companies FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can update companies"
  ON companies FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Company Assets Policies
CREATE POLICY "Company assets viewable by organization members"
  ON company_assets FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can insert company assets"
  ON company_assets FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can update company assets"
  ON company_assets FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

