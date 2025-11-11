-- ============================================================================
-- Add missing columns to organizations table
-- Created: 2025-11-11 23:00:00
-- Description: Adds description, business_id, and data_quality columns
-- ============================================================================

-- Add description column for organization description
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Add business_id column for official business registry ID (Y-tunnus, VAT, etc.)
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS business_id TEXT;

-- Add data_quality JSONB column for storing data quality indicators
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS data_quality JSONB DEFAULT '{
    "verified": false,
    "aiGenerated": false,
    "needsVerification": false,
    "confidence": "LOW",
    "missingFields": [],
    "sources": []
  }'::jsonb;

-- Add index for business_id lookups
CREATE INDEX IF NOT EXISTS idx_organizations_business_id ON organizations(business_id)
  WHERE business_id IS NOT NULL;

-- Add comments
COMMENT ON COLUMN organizations.description IS 'Organization description and background information';
COMMENT ON COLUMN organizations.business_id IS 'Official business registry ID (e.g., Finnish Y-tunnus)';
COMMENT ON COLUMN organizations.data_quality IS 'Data quality indicators (verified, AI-generated, confidence level)';

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

