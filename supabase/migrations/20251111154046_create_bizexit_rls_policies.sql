-- ============================================================================
-- BizExit Platform - Phase 3: RLS Policies & Triggers
-- Created: 2025-11-11
-- Description: Row Level Security policies and automated triggers
-- ============================================================================

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
-- profiles already has RLS enabled
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_portals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ndas ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_adapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================================================

-- Check if user is member of organization
CREATE OR REPLACE FUNCTION is_organization_member(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_id = auth.uid()
    AND organization_id = org_id
    AND active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has specific role in organization
CREATE OR REPLACE FUNCTION has_organization_role(org_id UUID, required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_id = auth.uid()
    AND organization_id = org_id
    AND role = required_role
    AND active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is admin in any organization
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if buyer has signed NDA for company
CREATE OR REPLACE FUNCTION has_signed_nda(comp_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM ndas
    WHERE company_id = comp_id
    AND buyer_id = auth.uid()
    AND status = 'signed'
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RLS POLICIES: ORGANIZATIONS
-- ============================================================================

-- View: Members can view their organizations
CREATE POLICY "Users can view their organizations"
ON organizations FOR SELECT
USING (is_organization_member(id));

-- Insert: Only platform admins can create orgs (via service role)
-- UPDATE/DELETE: Only org admins

CREATE POLICY "Organization admins can update their org"
ON organizations FOR UPDATE
USING (has_organization_role(id, 'admin'));

CREATE POLICY "Organization admins can delete their org"
ON organizations FOR DELETE
USING (has_organization_role(id, 'admin'));

-- ============================================================================
-- RLS POLICIES: USER_ORGANIZATIONS
-- ============================================================================

CREATE POLICY "Users can view their organization memberships"
ON user_organizations FOR SELECT
USING (user_id = auth.uid() OR is_organization_member(organization_id));

CREATE POLICY "Organization admins can manage memberships"
ON user_organizations FOR ALL
USING (has_organization_role(organization_id, 'admin'));

-- ============================================================================
-- RLS POLICIES: COMPANIES
-- ============================================================================

-- View: Organization members can view their companies
CREATE POLICY "Organization members can view their companies"
ON companies FOR SELECT
USING (is_organization_member(organization_id));

-- View: Buyers with signed NDA can view company details
CREATE POLICY "Buyers with signed NDA can view companies"
ON companies FOR SELECT
USING (has_signed_nda(id));

-- View: Public listings can be viewed by anyone (limited fields)
CREATE POLICY "Anyone can view active listings"
ON companies FOR SELECT
USING (
  id IN (
    SELECT company_id FROM listings
    WHERE status = 'active'
    AND published_at IS NOT NULL
  )
);

-- Insert/Update/Delete: Brokers and admins only
CREATE POLICY "Brokers and admins can create companies"
ON companies FOR INSERT
WITH CHECK (
  is_organization_member(organization_id) AND
  (has_organization_role(organization_id, 'broker') OR 
   has_organization_role(organization_id, 'admin'))
);

CREATE POLICY "Brokers and admins can update companies"
ON companies FOR UPDATE
USING (
  is_organization_member(organization_id) AND
  (has_organization_role(organization_id, 'broker') OR 
   has_organization_role(organization_id, 'admin'))
);

CREATE POLICY "Only admins can delete companies"
ON companies FOR DELETE
USING (has_organization_role(organization_id, 'admin'));

-- ============================================================================
-- RLS POLICIES: COMPANY_FINANCIALS
-- ============================================================================

CREATE POLICY "Organization members can view financials"
ON company_financials FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM companies
    WHERE companies.id = company_financials.company_id
    AND is_organization_member(companies.organization_id)
  )
);

CREATE POLICY "Buyers with NDA can view financials"
ON company_financials FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM companies
    WHERE companies.id = company_financials.company_id
    AND has_signed_nda(companies.id)
  )
);

CREATE POLICY "Brokers can manage financials"
ON company_financials FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM companies
    WHERE companies.id = company_financials.company_id
    AND is_organization_member(companies.organization_id)
    AND (has_organization_role(companies.organization_id, 'broker') OR
         has_organization_role(companies.organization_id, 'admin'))
  )
);

-- ============================================================================
-- RLS POLICIES: COMPANY_ASSETS
-- ============================================================================

-- Complex access based on asset access_level and user NDA status
CREATE POLICY "Organization members can view their assets"
ON company_assets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM companies
    WHERE companies.id = company_assets.company_id
    AND is_organization_member(companies.organization_id)
  )
);

CREATE POLICY "Public assets visible to all"
ON company_assets FOR SELECT
USING (access_level = 'public');

CREATE POLICY "Teaser assets visible to registered users"
ON company_assets FOR SELECT
USING (
  access_level = 'teaser' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "NDA-required assets visible to buyers with signed NDA"
ON company_assets FOR SELECT
USING (
  access_level IN ('nda_signed', 'due_diligence') AND
  has_signed_nda(company_id)
);

CREATE POLICY "Brokers can manage assets"
ON company_assets FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM companies
    WHERE companies.id = company_assets.company_id
    AND is_organization_member(companies.organization_id)
    AND (has_organization_role(companies.organization_id, 'broker') OR
         has_organization_role(companies.organization_id, 'admin'))
  )
);

-- ============================================================================
-- RLS POLICIES: DOCUMENT_TYPES
-- ============================================================================

-- System table - read-only for all authenticated users
CREATE POLICY "Anyone can view document types"
ON document_types FOR SELECT
USING (true);

-- Only platform admins can modify (via service role)

-- ============================================================================
-- RLS POLICIES: LISTINGS
-- ============================================================================

CREATE POLICY "Anyone can view active listings"
ON listings FOR SELECT
USING (status = 'active' AND published_at IS NOT NULL);

CREATE POLICY "Organization members can view their listings"
ON listings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM companies
    WHERE companies.id = listings.company_id
    AND is_organization_member(companies.organization_id)
  )
);

CREATE POLICY "Brokers can manage listings"
ON listings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM companies
    WHERE companies.id = listings.company_id
    AND is_organization_member(companies.organization_id)
    AND (has_organization_role(companies.organization_id, 'broker') OR
         has_organization_role(companies.organization_id, 'admin'))
  )
);

-- ============================================================================
-- RLS POLICIES: LISTING_PORTALS
-- ============================================================================

CREATE POLICY "Organization members can view portal listings"
ON listing_portals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM listings
    JOIN companies ON companies.id = listings.company_id
    WHERE listings.id = listing_portals.listing_id
    AND is_organization_member(companies.organization_id)
  )
);

CREATE POLICY "Brokers can manage portal listings"
ON listing_portals FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM listings
    JOIN companies ON companies.id = listings.company_id
    WHERE listings.id = listing_portals.listing_id
    AND is_organization_member(companies.organization_id)
    AND (has_organization_role(companies.organization_id, 'broker') OR
         has_organization_role(companies.organization_id, 'admin'))
  )
);

-- ============================================================================
-- RLS POLICIES: DEALS
-- ============================================================================

CREATE POLICY "Organization members can view their deals"
ON deals FOR SELECT
USING (is_organization_member(organization_id));

CREATE POLICY "Buyers can view deals they're involved in"
ON deals FOR SELECT
USING (buyer_id = auth.uid());

CREATE POLICY "Brokers can manage deals"
ON deals FOR ALL
USING (
  is_organization_member(organization_id) AND
  (has_organization_role(organization_id, 'broker') OR
   has_organization_role(organization_id, 'admin'))
);

-- ============================================================================
-- RLS POLICIES: DEAL_STAGES & DEAL_ACTIVITIES
-- ============================================================================

CREATE POLICY "Users can view stages for their deals"
ON deal_stages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM deals
    WHERE deals.id = deal_stages.deal_id
    AND (is_organization_member(deals.organization_id) OR deals.buyer_id = auth.uid())
  )
);

CREATE POLICY "Brokers can manage deal stages"
ON deal_stages FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM deals
    WHERE deals.id = deal_stages.deal_id
    AND is_organization_member(deals.organization_id)
    AND (has_organization_role(deals.organization_id, 'broker') OR
         has_organization_role(deals.organization_id, 'admin'))
  )
);

CREATE POLICY "Users can view activities for their deals"
ON deal_activities FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM deals
    WHERE deals.id = deal_activities.deal_id
    AND (is_organization_member(deals.organization_id) OR deals.buyer_id = auth.uid())
  )
);

CREATE POLICY "Deal participants can add activities"
ON deal_activities FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM deals
    WHERE deals.id = deal_activities.deal_id
    AND (is_organization_member(deals.organization_id) OR deals.buyer_id = auth.uid())
  )
);

-- ============================================================================
-- RLS POLICIES: BUYER_PROFILES
-- ============================================================================

CREATE POLICY "Users can view their own buyer profile"
ON buyer_profiles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Brokers can view buyer profiles in their deals"
ON buyer_profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM deals
    WHERE deals.buyer_id = buyer_profiles.user_id
    AND is_organization_member(deals.organization_id)
  )
);

CREATE POLICY "Users can manage their own buyer profile"
ON buyer_profiles FOR ALL
USING (user_id = auth.uid());

-- ============================================================================
-- RLS POLICIES: NDAS
-- ============================================================================

CREATE POLICY "Organization members can view NDAs for their companies"
ON ndas FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM companies
    WHERE companies.id = ndas.company_id
    AND is_organization_member(companies.organization_id)
  )
);

CREATE POLICY "Buyers can view their own NDAs"
ON ndas FOR SELECT
USING (buyer_id = auth.uid());

CREATE POLICY "Brokers can create NDAs"
ON ndas FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM companies
    WHERE companies.id = ndas.company_id
    AND is_organization_member(companies.organization_id)
    AND (has_organization_role(companies.organization_id, 'broker') OR
         has_organization_role(companies.organization_id, 'admin'))
  )
);

CREATE POLICY "Buyers can update their NDA status (sign)"
ON ndas FOR UPDATE
USING (buyer_id = auth.uid())
WITH CHECK (buyer_id = auth.uid());

-- ============================================================================
-- RLS POLICIES: PAYMENTS
-- ============================================================================

CREATE POLICY "Organization members can view their payments"
ON payments FOR SELECT
USING (is_organization_member(organization_id));

CREATE POLICY "Brokers can manage payments"
ON payments FOR ALL
USING (
  is_organization_member(organization_id) AND
  (has_organization_role(organization_id, 'broker') OR
   has_organization_role(organization_id, 'admin'))
);

-- ============================================================================
-- RLS POLICIES: PARTNERS
-- ============================================================================

CREATE POLICY "Organization members can view their partners"
ON partners FOR SELECT
USING (is_organization_member(organization_id));

CREATE POLICY "Partners can view their own info"
ON partners FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage partners"
ON partners FOR ALL
USING (has_organization_role(organization_id, 'admin'));

-- ============================================================================
-- RLS POLICIES: PORTAL_ADAPTERS
-- ============================================================================

-- System table - read for all authenticated users
CREATE POLICY "Authenticated users can view portal adapters"
ON portal_adapters FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only platform admins can modify (via service role)

-- ============================================================================
-- RLS POLICIES: AUDIT_LOGS
-- ============================================================================

CREATE POLICY "Users can view audit logs for their organization"
ON audit_logs FOR SELECT
USING (
  organization_id IS NULL OR
  is_organization_member(organization_id)
);

CREATE POLICY "System can insert audit logs"
ON audit_logs FOR INSERT
WITH CHECK (true);

-- Audit logs are append-only, no updates or deletes

-- ============================================================================
-- TRIGGERS: UPDATED_AT TIMESTAMPS
-- ============================================================================

-- Function already exists from initial migration, apply to new tables
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_company_financials_updated_at
  BEFORE UPDATE ON company_financials
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_company_assets_updated_at
  BEFORE UPDATE ON company_assets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_listing_portals_updated_at
  BEFORE UPDATE ON listing_portals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_buyer_profiles_updated_at
  BEFORE UPDATE ON buyer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_ndas_updated_at
  BEFORE UPDATE ON ndas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON partners
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_portal_adapters_updated_at
  BEFORE UPDATE ON portal_adapters
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- TRIGGERS: DEAL STAGE TRANSITIONS
-- ============================================================================

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
    
    -- Log activity
    INSERT INTO deal_activities (deal_id, activity_type, title, description, user_id)
    VALUES (
      NEW.id,
      'stage_change',
      'Deal stage changed',
      'Stage changed from ' || OLD.current_stage || ' to ' || NEW.current_stage,
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deal_stage_change_trigger
  BEFORE UPDATE OF current_stage ON deals
  FOR EACH ROW EXECUTE FUNCTION record_deal_stage_change();

-- ============================================================================
-- TRIGGERS: AUDIT LOG HASH CHAIN
-- ============================================================================

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
                 COALESCE(NEW.user_id::text, '') ||
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

-- ============================================================================
-- TRIGGERS: COMPANY EMBEDDING UPDATE FLAG
-- ============================================================================

CREATE OR REPLACE FUNCTION flag_company_embedding_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Set flag to regenerate embedding (actual generation in background job)
  NEW.embedding_updated_at := NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER company_content_changed
  BEFORE UPDATE OF name, description, industry ON companies
  FOR EACH ROW 
  WHEN (OLD IS DISTINCT FROM NEW)
  EXECUTE FUNCTION flag_company_embedding_update();

-- ============================================================================
-- TRIGGERS: LISTING METRICS INCREMENT
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_listing_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE listings
  SET views_count = views_count + 1
  WHERE id IN (
    SELECT listing_id FROM listing_portals
    WHERE id = NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- This would be triggered by application logic tracking views

-- ============================================================================
-- Phase 3 Complete - RLS & Triggers
-- ============================================================================

COMMENT ON SCHEMA public IS 'BizExit Platform - Phase 3 (RLS & Triggers) Complete';

