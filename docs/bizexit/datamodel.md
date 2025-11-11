# BizExit Data Model

## Overview

This document describes the complete database schema for the BizExit platform. The schema is designed for:
- Multi-tenant architecture with organization isolation
- Row Level Security (RLS) for data access control
- Comprehensive audit logging
- Scalability and performance

## Entity Relationship Diagram

```
Organizations
    ├── Users (via user_organizations)
    ├── Companies
    │   ├── Company_Financials
    │   ├── Company_Assets
    │   ├── Listings
    │   │   └── Listing_Portals
    │   └── Deals
    │       ├── Deal_Stages
    │       ├── Deal_Activities
    │       ├── NDAs
    │       └── Payments
    ├── Buyer_Profiles
    └── Partners

Audit_Logs (cross-cutting)
Portal_Adapters (system-wide)
Document_Types (system-wide)
```

## Core Tables

### organizations

Multi-tenant container for data isolation.

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL, -- 'broker', 'seller', 'platform'
  logo_url TEXT,
  website TEXT,
  country TEXT,
  industry TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  active BOOLEAN DEFAULT true NOT NULL,
  CONSTRAINT name_length CHECK (char_length(name) >= 2)
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_active ON organizations(active);
```

### user_organizations

Many-to-many relationship between users and organizations with roles.

```sql
CREATE TABLE user_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL, -- 'admin', 'broker', 'seller', 'analyst', 'viewer'
  permissions JSONB DEFAULT '{}'::jsonb,
  active BOOLEAN DEFAULT true NOT NULL,
  UNIQUE(user_id, organization_id)
);

CREATE INDEX idx_user_organizations_user ON user_organizations(user_id);
CREATE INDEX idx_user_organizations_org ON user_organizations(organization_id);
CREATE INDEX idx_user_organizations_role ON user_organizations(role);
```

### profiles

Extended user information (updated from existing table).

```sql
-- Migration to add new fields to existing profiles table
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'buyer',
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

-- Valid roles: 'admin', 'broker', 'seller', 'buyer', 'partner', 'analyst'
```

### companies

Core entity representing businesses being sold.

```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic Information
  name TEXT NOT NULL,
  legal_name TEXT,
  business_id TEXT, -- Y-tunnus, VAT number, etc.
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
  
  -- Financial Summary (detailed in company_financials)
  annual_revenue DECIMAL(18,2),
  annual_ebitda DECIMAL(18,2),
  asking_price DECIMAL(18,2),
  currency TEXT DEFAULT 'EUR',
  
  -- Status
  status TEXT DEFAULT 'draft' NOT NULL,
  -- 'draft', 'review', 'active', 'under_offer', 'sold', 'archived'
  
  -- AI/RAG
  embedding VECTOR(1536), -- OpenAI ada-002 or similar
  embedding_updated_at TIMESTAMPTZ,
  
  -- Metadata
  featured BOOLEAN DEFAULT false,
  confidential BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  
  CONSTRAINT name_length CHECK (char_length(name) >= 2)
);

CREATE INDEX idx_companies_org ON companies(organization_id);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_industry ON companies(industry);
CREATE INDEX idx_companies_country ON companies(country);
CREATE INDEX idx_companies_featured ON companies(featured) WHERE featured = true;
CREATE INDEX idx_companies_embedding ON companies USING ivfflat (embedding vector_cosine_ops);
```

### company_financials

Detailed financial metrics per year.

```sql
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
  
  -- Ratios (calculated)
  gross_margin DECIMAL(5,2),
  ebitda_margin DECIMAL(5,2),
  net_margin DECIMAL(5,2),
  current_ratio DECIMAL(5,2),
  debt_to_equity DECIMAL(5,2),
  
  -- Metadata
  currency TEXT DEFAULT 'EUR',
  audited BOOLEAN DEFAULT false,
  notes TEXT,
  
  UNIQUE(company_id, fiscal_year)
);

CREATE INDEX idx_company_financials_company ON company_financials(company_id);
CREATE INDEX idx_company_financials_year ON company_financials(fiscal_year);
```

### company_assets

Documents, images, videos associated with companies.

```sql
CREATE TABLE company_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  
  -- File Information
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'document', 'image', 'video', 'financial_statement'
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL, -- Supabase Storage path
  thumbnail_url TEXT,
  
  -- Document Type (for generated materials)
  document_type TEXT, -- 'teaser', 'im', 'pitch_deck', 'valuation', 'faq', etc.
  
  -- Generation Metadata (if AI-generated)
  generated BOOLEAN DEFAULT false,
  generation_prompt TEXT,
  generation_model TEXT,
  generation_params JSONB,
  
  -- Access Control
  access_level TEXT DEFAULT 'private' NOT NULL,
  -- 'public', 'teaser', 'nda_signed', 'due_diligence', 'private'
  
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
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_company_assets_company ON company_assets(company_id);
CREATE INDEX idx_company_assets_type ON company_assets(type);
CREATE INDEX idx_company_assets_document_type ON company_assets(document_type);
CREATE INDEX idx_company_assets_access ON company_assets(access_level);
```

### document_types

System-wide document type definitions.

```sql
CREATE TABLE document_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  code TEXT UNIQUE NOT NULL, -- 'teaser', 'im', 'pitch_deck', etc.
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'marketing', 'financial', 'legal', 'due_diligence'
  
  -- Generation Settings
  requires_ai_generation BOOLEAN DEFAULT false,
  prompt_template_path TEXT,
  estimated_pages INTEGER,
  
  -- Access Requirements
  requires_nda BOOLEAN DEFAULT false,
  access_level TEXT DEFAULT 'private',
  
  -- Ordering
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true
);

CREATE INDEX idx_document_types_code ON document_types(code);
CREATE INDEX idx_document_types_category ON document_types(category);
```

### listings

Sale listings for companies on various portals.

```sql
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
  -- 'draft', 'review', 'active', 'paused', 'sold', 'expired', 'archived'
  
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
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_listings_company ON listings(company_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_published ON listings(published_at) WHERE status = 'active';
```

### listing_portals

Portal-specific listing syndications.

```sql
CREATE TABLE listing_portals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  portal_code TEXT NOT NULL, -- 'bizbuysell', 'transfindo', 'yritysporssi', etc.
  
  -- Portal Integration
  external_id TEXT, -- ID on the external portal
  external_url TEXT, -- URL on the external portal
  
  -- Status
  status TEXT DEFAULT 'pending' NOT NULL,
  -- 'pending', 'active', 'paused', 'error', 'removed'
  
  last_sync_at TIMESTAMPTZ,
  sync_error TEXT,
  
  -- Metrics
  views_count INTEGER DEFAULT 0,
  leads_count INTEGER DEFAULT 0,
  
  -- Settings
  auto_sync BOOLEAN DEFAULT true,
  portal_settings JSONB DEFAULT '{}'::jsonb,
  
  UNIQUE(listing_id, portal_code)
);

CREATE INDEX idx_listing_portals_listing ON listing_portals(listing_id);
CREATE INDEX idx_listing_portals_portal ON listing_portals(portal_code);
CREATE INDEX idx_listing_portals_status ON listing_portals(status);
CREATE INDEX idx_listing_portals_external ON listing_portals(external_id);
```

### deals

Sales pipeline instances.

```sql
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  
  -- Parties
  buyer_id UUID REFERENCES profiles(id), -- Can be NULL initially
  broker_id UUID REFERENCES profiles(id),
  
  -- Deal Information
  name TEXT NOT NULL,
  deal_value DECIMAL(18,2),
  currency TEXT DEFAULT 'EUR',
  
  -- Status & Stage
  status TEXT DEFAULT 'active' NOT NULL,
  -- 'active', 'paused', 'closed_won', 'closed_lost', 'cancelled'
  
  current_stage TEXT DEFAULT 'sourcing' NOT NULL,
  -- 'sourcing', 'nda_negotiation', 'initial_review', 'due_diligence',
  -- 'negotiation', 'term_sheet', 'signing', 'closed_won', 'closed_lost'
  
  stage_updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Pricing
  fixed_fee DECIMAL(10,2) DEFAULT 0,
  success_fee_percentage DECIMAL(5,2), -- e.g., 5.00 for 5%
  success_fee_minimum DECIMAL(10,2),
  success_fee_maximum DECIMAL(10,2),
  calculated_success_fee DECIMAL(10,2),
  
  -- Important Dates
  expected_close_date DATE,
  actual_close_date DATE,
  
  -- Lost/Won Reasons
  outcome_reason TEXT,
  outcome_notes TEXT,
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_deals_org ON deals(organization_id);
CREATE INDEX idx_deals_company ON deals(company_id);
CREATE INDEX idx_deals_buyer ON deals(buyer_id);
CREATE INDEX idx_deals_broker ON deals(broker_id);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deals_stage ON deals(current_stage);
CREATE INDEX idx_deals_close_date ON deals(expected_close_date);
```

### deal_stages

Historical record of deal stage transitions.

```sql
CREATE TABLE deal_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE NOT NULL,
  
  stage TEXT NOT NULL,
  entered_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  exited_at TIMESTAMPTZ,
  duration_days INTEGER, -- Calculated on exit
  
  notes TEXT,
  changed_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_deal_stages_deal ON deal_stages(deal_id);
CREATE INDEX idx_deal_stages_stage ON deal_stages(stage);
CREATE INDEX idx_deal_stages_entered ON deal_stages(entered_at);
```

### deal_activities

Activity log for deals (timeline).

```sql
CREATE TABLE deal_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE NOT NULL,
  
  activity_type TEXT NOT NULL,
  -- 'stage_change', 'note_added', 'document_uploaded', 'meeting_scheduled',
  -- 'email_sent', 'nda_signed', 'offer_submitted', etc.
  
  title TEXT NOT NULL,
  description TEXT,
  
  -- Relations
  user_id UUID REFERENCES auth.users(id),
  related_asset_id UUID REFERENCES company_assets(id),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_deal_activities_deal ON deal_activities(deal_id);
CREATE INDEX idx_deal_activities_type ON deal_activities(activity_type);
CREATE INDEX idx_deal_activities_created ON deal_activities(created_at);
```

### buyer_profiles

Extended buyer information.

```sql
CREATE TABLE buyer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Company/Individual
  buyer_type TEXT NOT NULL, -- 'individual', 'company', 'investment_firm'
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
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_buyer_profiles_user ON buyer_profiles(user_id);
CREATE INDEX idx_buyer_profiles_verified ON buyer_profiles(verified);
CREATE INDEX idx_buyer_profiles_industries ON buyer_profiles USING GIN(industries_of_interest);
```

### ndas

Non-Disclosure Agreements.

```sql
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
  -- 'draft', 'sent', 'viewed', 'signed', 'declined', 'expired'
  
  -- Dates
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- E-Signature
  signature_provider TEXT, -- 'docusign', 'hellosign', 'manual', etc.
  signature_request_id TEXT,
  signature_data JSONB,
  
  -- IP & Device Info
  ip_address INET,
  user_agent TEXT,
  
  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_ndas_company ON ndas(company_id);
CREATE INDEX idx_ndas_buyer ON ndas(buyer_id);
CREATE INDEX idx_ndas_deal ON ndas(deal_id);
CREATE INDEX idx_ndas_status ON ndas(status);
CREATE INDEX idx_ndas_signed ON ndas(signed_at) WHERE status = 'signed';
```

### payments

Payment transactions.

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE NOT NULL,
  
  -- Payment Type
  payment_type TEXT NOT NULL,
  -- 'fixed_fee', 'success_fee', 'milestone', 'refund'
  
  -- Amount
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  
  -- Status
  status TEXT DEFAULT 'pending' NOT NULL,
  -- 'pending', 'processing', 'succeeded', 'failed', 'refunded', 'cancelled'
  
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
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_payments_org ON payments(organization_id);
CREATE INDEX idx_payments_deal ON payments(deal_id);
CREATE INDEX idx_payments_type ON payments(payment_type);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_stripe ON payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_due_date ON payments(due_date);
```

### partners

External partners (legal, financial advisors, etc.).

```sql
CREATE TABLE partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  
  -- Partner Information
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'legal', 'financial', 'tax', 'valuation', 'other'
  company_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  
  -- User Link (if they have system access)
  user_id UUID REFERENCES auth.users(id),
  
  -- Commission
  commission_type TEXT, -- 'percentage', 'fixed', 'none'
  commission_rate DECIMAL(5,2),
  commission_amount DECIMAL(10,2),
  
  -- Status
  active BOOLEAN DEFAULT true,
  
  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_partners_org ON partners(organization_id);
CREATE INDEX idx_partners_type ON partners(type);
CREATE INDEX idx_partners_user ON partners(user_id);
CREATE INDEX idx_partners_active ON partners(active);
```

### portal_adapters

Portal integration configurations (system-wide).

```sql
CREATE TABLE portal_adapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Portal Information
  code TEXT UNIQUE NOT NULL, -- 'bizbuysell', 'transfindo', 'yritysporssi'
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  api_docs_url TEXT,
  
  -- Integration Type
  integration_type TEXT NOT NULL, -- 'api', 'scraper', 'manual', 'webhook'
  
  -- Configuration
  api_endpoint TEXT,
  auth_type TEXT, -- 'api_key', 'oauth2', 'basic', 'none'
  config_schema JSONB, -- JSON Schema for configuration
  
  -- Status
  active BOOLEAN DEFAULT true,
  maintenance_mode BOOLEAN DEFAULT false,
  
  -- Metadata
  features TEXT[] DEFAULT '{}', -- ['push_listings', 'pull_leads', 'analytics']
  supported_countries TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_portal_adapters_code ON portal_adapters(code);
CREATE INDEX idx_portal_adapters_active ON portal_adapters(active);
```

### audit_logs

Comprehensive audit trail with tamper-evident hashing.

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- User & Session
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),
  session_id TEXT,
  
  -- Action
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'view', 'download', etc.
  resource_type TEXT NOT NULL, -- 'company', 'deal', 'nda', 'payment', etc.
  resource_id UUID NOT NULL,
  
  -- Changes (for update/delete)
  changes JSONB, -- JSON diff of before/after
  
  -- Request Info
  ip_address INET,
  user_agent TEXT,
  request_path TEXT,
  request_method TEXT,
  
  -- Tamper Evidence
  previous_hash TEXT,
  current_hash TEXT, -- SHA-256 hash of (previous_hash + this record)
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_hash ON audit_logs(current_hash);
```

## Row Level Security (RLS) Policies

### General Principles
1. All tables (except system tables) have RLS enabled
2. Organization-scoped data isolated by organization_id
3. Service role bypasses RLS for admin operations
4. Authenticated users can only access their organization's data
5. Buyers can only see their own profile and signed NDAs

### Key RLS Patterns

#### Organization-Scoped Access
```sql
CREATE POLICY "Users can access their organization's data"
ON companies FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_organizations 
    WHERE user_id = auth.uid() AND active = true
  )
);
```

#### Role-Based Access
```sql
CREATE POLICY "Only brokers and admins can create companies"
ON companies FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_id = auth.uid()
    AND organization_id = NEW.organization_id
    AND role IN ('admin', 'broker')
    AND active = true
  )
);
```

#### Buyer Access (Limited)
```sql
CREATE POLICY "Buyers can view active listings"
ON listings FOR SELECT
USING (
  status = 'active'
  AND published_at IS NOT NULL
  AND (expires_at IS NULL OR expires_at > NOW())
);

CREATE POLICY "Buyers can view company details if NDA signed"
ON companies FOR SELECT
USING (
  id IN (
    SELECT company_id FROM ndas
    WHERE buyer_id = auth.uid()
    AND status = 'signed'
    AND (expires_at IS NULL OR expires_at > NOW())
  )
);
```

## Triggers & Functions

### Updated At Timestamp
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Audit Log Hash Chain
```sql
CREATE OR REPLACE FUNCTION calculate_audit_hash()
RETURNS TRIGGER AS $$
DECLARE
  prev_hash TEXT;
  data_string TEXT;
BEGIN
  -- Get previous hash
  SELECT current_hash INTO prev_hash
  FROM audit_logs
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Calculate new hash
  data_string := COALESCE(prev_hash, '') || 
                 NEW.user_id::text ||
                 NEW.action ||
                 NEW.resource_type ||
                 NEW.resource_id::text ||
                 NEW.created_at::text;
  
  NEW.previous_hash := prev_hash;
  NEW.current_hash := encode(digest(data_string, 'sha256'), 'hex');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_hash_trigger
  BEFORE INSERT ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION calculate_audit_hash();
```

### Company Embedding Update
```sql
CREATE OR REPLACE FUNCTION update_company_embedding()
RETURNS TRIGGER AS $$
BEGIN
  -- Set flag to regenerate embedding (actual generation happens in background job)
  NEW.embedding_updated_at := NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER company_content_changed
  BEFORE UPDATE OF name, description, industry ON companies
  FOR EACH ROW 
  WHEN (OLD IS DISTINCT FROM NEW)
  EXECUTE FUNCTION update_company_embedding();
```

### Deal Stage Transition
```sql
CREATE OR REPLACE FUNCTION record_deal_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.current_stage IS DISTINCT FROM NEW.current_stage THEN
    -- Close previous stage
    UPDATE deal_stages
    SET exited_at = NOW(),
        duration_days = EXTRACT(DAY FROM NOW() - entered_at)::INTEGER
    WHERE deal_id = NEW.id
    AND exited_at IS NULL;
    
    -- Create new stage record
    INSERT INTO deal_stages (deal_id, stage, changed_by)
    VALUES (NEW.id, NEW.current_stage, auth.uid());
    
    NEW.stage_updated_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deal_stage_change_trigger
  BEFORE UPDATE OF current_stage ON deals
  FOR EACH ROW EXECUTE FUNCTION record_deal_stage_change();
```

## Indexes Strategy

### Performance Indexes
- All foreign keys have indexes
- Frequently queried fields (status, dates) have indexes
- GIN indexes for JSONB and array fields
- Vector indexes for embeddings (ivfflat)

### Partial Indexes
```sql
-- Active records only
CREATE INDEX idx_companies_active 
ON companies(status) WHERE status NOT IN ('archived', 'sold');

CREATE INDEX idx_listings_published 
ON listings(published_at) WHERE status = 'active';

CREATE INDEX idx_ndas_active 
ON ndas(expires_at) WHERE status = 'signed' AND expires_at > NOW();
```

## Data Retention Policies

### Soft Deletes
- Most records use status flags instead of actual deletion
- Archived data retained for 7 years for compliance
- Personal data can be hard-deleted per GDPR requests

### Cleanup Jobs
```sql
-- Archive old audit logs (older than 2 years)
-- Move to separate archive table
-- Run monthly via Inngest job
```

## Enums & Constants

### User Roles
```typescript
type UserRole = 
  | 'admin'      // Full system access
  | 'broker'     // Can manage companies and deals
  | 'seller'     // Can manage their own companies
  | 'buyer'      // Can view listings and submit offers
  | 'partner'    // Limited access to specific deals
  | 'analyst';   // Read-only analytics access
```

### Deal Stages
```typescript
type DealStage =
  | 'sourcing'          // Lead generation
  | 'nda_negotiation'   // NDA being negotiated
  | 'initial_review'    // Buyer reviewing teaser/IM
  | 'due_diligence'     // Full DD in progress
  | 'negotiation'       // Price and terms negotiation
  | 'term_sheet'        // Term sheet stage
  | 'signing'           // Final contracts
  | 'closed_won'        // Deal successfully closed
  | 'closed_lost';      // Deal fell through
```

### Company Status
```typescript
type CompanyStatus =
  | 'draft'         // Being prepared
  | 'review'        // Under review
  | 'active'        // Active for sale
  | 'under_offer'   // Offer received
  | 'sold'          // Successfully sold
  | 'archived';     // No longer active
```

### Listing Status
```typescript
type ListingStatus =
  | 'draft'     // Being prepared
  | 'review'    // Under review
  | 'active'    // Live on portals
  | 'paused'    // Temporarily paused
  | 'sold'      // Company sold
  | 'expired'   // Listing expired
  | 'archived'; // Archived
```

### NDA Status
```typescript
type NDAStatus =
  | 'draft'    // Being prepared
  | 'sent'     // Sent to buyer
  | 'viewed'   // Buyer viewed
  | 'signed'   // Signed by buyer
  | 'declined' // Declined by buyer
  | 'expired'; // Expired without signing
```

### Payment Status
```typescript
type PaymentStatus =
  | 'pending'     // Awaiting payment
  | 'processing'  // Payment in progress
  | 'succeeded'   // Payment successful
  | 'failed'      // Payment failed
  | 'refunded'    // Payment refunded
  | 'cancelled';  // Payment cancelled
```

## Data Validation Rules

### Constraints
1. All financial amounts must be non-negative
2. Percentages must be between 0 and 100
3. Email addresses must be valid format
4. Phone numbers follow E.164 format
5. URLs must be valid format
6. Business IDs validated per country
7. Dates: created_at < updated_at
8. Deal value must match company asking price (within tolerance)

### Business Rules
1. A company can only have one active listing
2. A buyer can only have one active NDA per company
3. Success fee cannot exceed deal value
4. Fixed fee must be paid before accessing materials
5. NDA must be signed before accessing confidential docs
6. Deal cannot be closed without payments

## Migration Strategy

### Phase 1: Core Tables
1. organizations
2. user_organizations
3. profiles (update)
4. companies
5. company_financials
6. company_assets

### Phase 2: Listings & Deals
7. document_types
8. listings
9. listing_portals
10. deals
11. deal_stages
12. deal_activities

### Phase 3: Buyers & NDAs
13. buyer_profiles
14. ndas

### Phase 4: Payments & Integration
15. payments
16. partners
17. portal_adapters
18. audit_logs

### Phase 5: Functions & Triggers
19. RLS policies
20. Triggers
21. Indexes
22. Seed data

---

**Last Updated**: 2025-11-11
**Version**: 1.0.0

