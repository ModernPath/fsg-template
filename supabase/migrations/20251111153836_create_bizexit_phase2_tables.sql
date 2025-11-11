-- ============================================================================
-- BizExit Platform - Phase 2 Schema Migration
-- Created: 2025-11-11
-- Description: Listings, Deals, Buyers, NDAs, Payments, Audit
-- ============================================================================

-- ============================================================================
-- 8. LISTINGS (Sale listings for companies)
-- ============================================================================

CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  
  -- Listing Details
  title TEXT NOT NULL,
  short_description TEXT,
  asking_price DECIMAL(18,2),
  price_negotiable BOOLEAN DEFAULT true,
  currency TEXT DEFAULT 'EUR',
  
  -- Status
  status TEXT DEFAULT 'draft' NOT NULL,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Materials
  teaser_asset_id UUID REFERENCES company_assets(id),
  im_asset_id UUID REFERENCES company_assets(id),
  pitch_deck_asset_id UUID REFERENCES company_assets(id),
  
  -- Settings
  show_financials BOOLEAN DEFAULT false,
  show_location BOOLEAN DEFAULT false,
  allow_contact BOOLEAN DEFAULT true,
  
  -- Metrics
  views_count INTEGER DEFAULT 0,
  inquiries_count INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  CONSTRAINT valid_listing_status CHECK (status IN ('draft', 'review', 'active', 'paused', 'sold', 'expired', 'archived')),
  CONSTRAINT positive_views CHECK (views_count >= 0),
  CONSTRAINT positive_inquiries CHECK (inquiries_count >= 0)
);

CREATE INDEX idx_listings_company ON listings(company_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_published ON listings(published_at) WHERE status = 'active';
CREATE INDEX idx_listings_expires ON listings(expires_at) WHERE expires_at IS NOT NULL;

COMMENT ON TABLE listings IS 'Public listings for companies being sold';

-- ============================================================================
-- 9. LISTING_PORTALS (Portal syndication)
-- ============================================================================

CREATE TABLE listing_portals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  portal_code TEXT NOT NULL,
  
  -- Portal Integration
  external_id TEXT,
  external_url TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' NOT NULL,
  last_sync_at TIMESTAMPTZ,
  sync_error TEXT,
  
  -- Metrics
  views_count INTEGER DEFAULT 0,
  leads_count INTEGER DEFAULT 0,
  
  -- Settings
  auto_sync BOOLEAN DEFAULT true,
  portal_settings JSONB DEFAULT '{}'::jsonb,
  
  UNIQUE(listing_id, portal_code),
  CONSTRAINT valid_portal_status CHECK (status IN ('pending', 'active', 'paused', 'error', 'removed'))
);

CREATE INDEX idx_listing_portals_listing ON listing_portals(listing_id);
CREATE INDEX idx_listing_portals_portal ON listing_portals(portal_code);
CREATE INDEX idx_listing_portals_status ON listing_portals(status);
CREATE INDEX idx_listing_portals_external ON listing_portals(external_id);

COMMENT ON TABLE listing_portals IS 'Portal syndication records for listings';

-- ============================================================================
-- 10. DEALS (Sales pipeline)
-- ============================================================================

CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  
  -- Parties
  buyer_id UUID REFERENCES profiles(id),
  broker_id UUID REFERENCES profiles(id),
  
  -- Deal Information
  name TEXT NOT NULL,
  deal_value DECIMAL(18,2),
  currency TEXT DEFAULT 'EUR',
  
  -- Status & Stage
  status TEXT DEFAULT 'active' NOT NULL,
  current_stage TEXT DEFAULT 'sourcing' NOT NULL,
  stage_updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Pricing
  fixed_fee DECIMAL(10,2) DEFAULT 0,
  success_fee_percentage DECIMAL(5,2),
  success_fee_minimum DECIMAL(10,2),
  success_fee_maximum DECIMAL(10,2),
  calculated_success_fee DECIMAL(10,2),
  
  -- Important Dates
  expected_close_date DATE,
  actual_close_date DATE,
  
  -- Outcome
  outcome_reason TEXT,
  outcome_notes TEXT,
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  
  CONSTRAINT valid_deal_status CHECK (status IN ('active', 'paused', 'closed_won', 'closed_lost', 'cancelled')),
  CONSTRAINT valid_deal_stage CHECK (current_stage IN (
    'sourcing', 'nda_negotiation', 'initial_review', 'due_diligence',
    'negotiation', 'term_sheet', 'signing', 'closed_won', 'closed_lost'
  )),
  CONSTRAINT positive_fees CHECK (
    (fixed_fee IS NULL OR fixed_fee >= 0) AND
    (success_fee_percentage IS NULL OR (success_fee_percentage >= 0 AND success_fee_percentage <= 100))
  )
);

CREATE INDEX idx_deals_org ON deals(organization_id);
CREATE INDEX idx_deals_company ON deals(company_id);
CREATE INDEX idx_deals_buyer ON deals(buyer_id);
CREATE INDEX idx_deals_broker ON deals(broker_id);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deals_stage ON deals(current_stage);
CREATE INDEX idx_deals_close_date ON deals(expected_close_date);

COMMENT ON TABLE deals IS 'Sales pipeline deals';

-- ============================================================================
-- 11. DEAL_STAGES (Stage history)
-- ============================================================================

CREATE TABLE deal_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE NOT NULL,
  
  stage TEXT NOT NULL,
  entered_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  exited_at TIMESTAMPTZ,
  duration_days INTEGER,
  
  notes TEXT,
  changed_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT valid_stage CHECK (stage IN (
    'sourcing', 'nda_negotiation', 'initial_review', 'due_diligence',
    'negotiation', 'term_sheet', 'signing', 'closed_won', 'closed_lost'
  ))
);

CREATE INDEX idx_deal_stages_deal ON deal_stages(deal_id);
CREATE INDEX idx_deal_stages_stage ON deal_stages(stage);
CREATE INDEX idx_deal_stages_entered ON deal_stages(entered_at DESC);

COMMENT ON TABLE deal_stages IS 'Historical record of deal stage transitions';

-- ============================================================================
-- 12. DEAL_ACTIVITIES (Activity timeline)
-- ============================================================================

CREATE TABLE deal_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE NOT NULL,
  
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Relations
  user_id UUID REFERENCES auth.users(id),
  related_asset_id UUID REFERENCES company_assets(id),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  CONSTRAINT valid_activity_type CHECK (activity_type IN (
    'stage_change', 'note_added', 'document_uploaded', 'meeting_scheduled',
    'email_sent', 'nda_signed', 'offer_submitted', 'payment_made'
  ))
);

CREATE INDEX idx_deal_activities_deal ON deal_activities(deal_id);
CREATE INDEX idx_deal_activities_type ON deal_activities(activity_type);
CREATE INDEX idx_deal_activities_created ON deal_activities(created_at DESC);
CREATE INDEX idx_deal_activities_user ON deal_activities(user_id);

COMMENT ON TABLE deal_activities IS 'Timeline of all deal activities';

-- ============================================================================
-- 13. BUYER_PROFILES (Extended buyer information)
-- ============================================================================

CREATE TABLE buyer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Company/Individual
  buyer_type TEXT NOT NULL DEFAULT 'individual',
  company_name TEXT,
  position TEXT,
  
  -- Investment Profile
  industries_of_interest TEXT[] DEFAULT '{}',
  countries_of_interest TEXT[] DEFAULT '{}',
  min_revenue DECIMAL(18,2),
  max_revenue DECIMAL(18,2),
  min_ebitda DECIMAL(18,2),
  max_ebitda DECIMAL(18,2),
  budget_min DECIMAL(18,2),
  budget_max DECIMAL(18,2),
  currency TEXT DEFAULT 'EUR',
  
  -- Verification
  verified BOOLEAN DEFAULT false,
  verification_date TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  
  -- Activity
  active_searches INTEGER DEFAULT 0,
  ndas_signed INTEGER DEFAULT 0,
  offers_submitted INTEGER DEFAULT 0,
  
  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  CONSTRAINT valid_buyer_type CHECK (buyer_type IN ('individual', 'company', 'investment_firm')),
  CONSTRAINT positive_metrics CHECK (
    active_searches >= 0 AND ndas_signed >= 0 AND offers_submitted >= 0
  )
);

CREATE INDEX idx_buyer_profiles_user ON buyer_profiles(user_id);
CREATE INDEX idx_buyer_profiles_verified ON buyer_profiles(verified);
CREATE INDEX idx_buyer_profiles_industries ON buyer_profiles USING GIN(industries_of_interest);
CREATE INDEX idx_buyer_profiles_countries ON buyer_profiles USING GIN(countries_of_interest);

COMMENT ON TABLE buyer_profiles IS 'Extended buyer profile information';

-- ============================================================================
-- 14. NDAS (Non-Disclosure Agreements)
-- ============================================================================

CREATE TABLE ndas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Parties
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  deal_id UUID REFERENCES deals(id),
  
  -- Document
  template_version TEXT NOT NULL,
  document_asset_id UUID REFERENCES company_assets(id),
  signed_document_asset_id UUID REFERENCES company_assets(id),
  
  -- Status
  status TEXT DEFAULT 'draft' NOT NULL,
  
  -- Dates
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- E-Signature
  signature_provider TEXT,
  signature_request_id TEXT,
  signature_data JSONB,
  
  -- IP & Device
  ip_address INET,
  user_agent TEXT,
  
  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  CONSTRAINT valid_nda_status CHECK (status IN ('draft', 'sent', 'viewed', 'signed', 'declined', 'expired')),
  CONSTRAINT valid_signature_provider CHECK (
    signature_provider IS NULL OR 
    signature_provider IN ('docusign', 'hellosign', 'manual')
  )
);

CREATE INDEX idx_ndas_company ON ndas(company_id);
CREATE INDEX idx_ndas_buyer ON ndas(buyer_id);
CREATE INDEX idx_ndas_deal ON ndas(deal_id);
CREATE INDEX idx_ndas_status ON ndas(status);
CREATE INDEX idx_ndas_signed ON ndas(signed_at DESC) WHERE status = 'signed';
CREATE INDEX idx_ndas_expires ON ndas(expires_at) WHERE status = 'signed';

COMMENT ON TABLE ndas IS 'Non-disclosure agreements between buyers and sellers';

-- ============================================================================
-- 15. PAYMENTS (Payment transactions)
-- ============================================================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE NOT NULL,
  
  -- Payment Type
  payment_type TEXT NOT NULL,
  
  -- Amount
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  
  -- Status
  status TEXT DEFAULT 'pending' NOT NULL,
  
  -- Stripe Integration
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_charge_id TEXT,
  stripe_refund_id TEXT,
  
  -- Dates
  due_date DATE,
  paid_at TIMESTAMPTZ,
  
  -- Invoice
  invoice_number TEXT UNIQUE,
  invoice_url TEXT,
  
  -- Metadata
  description TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  CONSTRAINT valid_payment_type CHECK (payment_type IN ('fixed_fee', 'success_fee', 'milestone', 'refund')),
  CONSTRAINT valid_payment_status CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded', 'cancelled')),
  CONSTRAINT positive_amount CHECK (amount > 0)
);

CREATE INDEX idx_payments_org ON payments(organization_id);
CREATE INDEX idx_payments_deal ON payments(deal_id);
CREATE INDEX idx_payments_type ON payments(payment_type);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_stripe ON payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_due_date ON payments(due_date);

COMMENT ON TABLE payments IS 'Payment transactions (fixed fees, success fees, etc.)';

-- ============================================================================
-- 16. PARTNERS (External partners)
-- ============================================================================

CREATE TABLE partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  
  -- Partner Information
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  company_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  
  -- User Link
  user_id UUID REFERENCES auth.users(id),
  
  -- Commission
  commission_type TEXT,
  commission_rate DECIMAL(5,2),
  commission_amount DECIMAL(10,2),
  
  -- Status
  active BOOLEAN DEFAULT true,
  
  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  CONSTRAINT valid_partner_type CHECK (type IN ('legal', 'financial', 'tax', 'valuation', 'other')),
  CONSTRAINT valid_commission_type CHECK (
    commission_type IS NULL OR 
    commission_type IN ('percentage', 'fixed', 'none')
  )
);

CREATE INDEX idx_partners_org ON partners(organization_id);
CREATE INDEX idx_partners_type ON partners(type);
CREATE INDEX idx_partners_user ON partners(user_id);
CREATE INDEX idx_partners_active ON partners(active);

COMMENT ON TABLE partners IS 'External partners (legal, financial advisors, etc.)';

-- ============================================================================
-- 17. PORTAL_ADAPTERS (System-wide portal configs)
-- ============================================================================

CREATE TABLE portal_adapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Portal Information
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  api_docs_url TEXT,
  
  -- Integration Type
  integration_type TEXT NOT NULL DEFAULT 'api',
  
  -- Configuration
  api_endpoint TEXT,
  auth_type TEXT,
  config_schema JSONB,
  
  -- Status
  active BOOLEAN DEFAULT true,
  maintenance_mode BOOLEAN DEFAULT false,
  
  -- Metadata
  features TEXT[] DEFAULT '{}',
  supported_countries TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  
  CONSTRAINT valid_integration_type CHECK (integration_type IN ('api', 'scraper', 'manual', 'webhook')),
  CONSTRAINT valid_auth_type CHECK (
    auth_type IS NULL OR 
    auth_type IN ('api_key', 'oauth2', 'basic', 'none')
  )
);

CREATE INDEX idx_portal_adapters_code ON portal_adapters(code);
CREATE INDEX idx_portal_adapters_active ON portal_adapters(active);

COMMENT ON TABLE portal_adapters IS 'Configuration for external portal integrations';

-- Insert default portal adapters
INSERT INTO portal_adapters (code, name, description, integration_type, active) VALUES
  ('mock', 'Mock Portal', 'Mock adapter for development', 'manual', true),
  ('bizbuysell', 'BizBuySell', 'Leading US business marketplace', 'api', false),
  ('transfindo', 'Transfindo', 'European B2B marketplace', 'api', false),
  ('yritysporssi', 'Yritysporssi.fi', 'Finnish business marketplace', 'api', false);

-- ============================================================================
-- 18. AUDIT_LOGS (Comprehensive audit trail)
-- ============================================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- User & Session
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),
  session_id TEXT,
  
  -- Action
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  
  -- Changes
  changes JSONB,
  
  -- Request Info
  ip_address INET,
  user_agent TEXT,
  request_path TEXT,
  request_method TEXT,
  
  -- Tamper Evidence
  previous_hash TEXT,
  current_hash TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  CONSTRAINT valid_action CHECK (action IN ('create', 'update', 'delete', 'view', 'download', 'export', 'sign')),
  CONSTRAINT valid_resource CHECK (resource_type IN (
    'company', 'listing', 'deal', 'nda', 'payment', 'user', 'document', 'organization'
  ))
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_hash ON audit_logs(current_hash);

COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail with tamper-evident hashing';

-- ============================================================================
-- Phase 2 Complete
-- ============================================================================

COMMENT ON SCHEMA public IS 'BizExit Platform - Phase 2 Migration Complete';

