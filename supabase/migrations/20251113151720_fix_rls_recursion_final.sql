-- ============================================================================
-- Fix infinite recursion in RLS policies
-- Created: 2025-11-13 15:17:20
-- Description: Remove recursive function calls and make helper functions SECURITY DEFINER
-- ============================================================================

-- ===========================================================================
-- PART 1: Make helper functions SECURITY DEFINER to bypass RLS
-- ===========================================================================

DROP FUNCTION IF EXISTS is_organization_member(uuid) CASCADE;
DROP FUNCTION IF EXISTS has_organization_role(uuid, text) CASCADE;

-- is_organization_member - SECURITY DEFINER bypasses RLS and prevents recursion
CREATE OR REPLACE FUNCTION is_organization_member(org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- This bypasses RLS!
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_id = auth.uid()
    AND organization_id = org_id
    AND active = true
  );
END;
$$;

-- has_organization_role - SECURITY DEFINER bypasses RLS and prevents recursion
CREATE OR REPLACE FUNCTION has_organization_role(org_id uuid, required_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- This bypasses RLS!
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_id = auth.uid()
    AND organization_id = org_id
    AND role = required_role
    AND active = true
  );
END;
$$;

-- ===========================================================================
-- PART 2: Fix user_organizations policies (remove self-reference)
-- ===========================================================================

-- Drop old recursive policies
DROP POLICY IF EXISTS "Users can view their organization memberships" ON user_organizations;
DROP POLICY IF EXISTS "users_can_view_own_memberships" ON user_organizations;

-- Create simpler policy without self-reference
CREATE POLICY "users_can_view_own_memberships"
ON user_organizations
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id  -- Users see only their own memberships
  OR 
  -- Platform admins can see all (check profiles directly, no recursion)
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  )
);

-- ===========================================================================
-- PART 3: Fix companies policies (replace function calls with direct queries)
-- ===========================================================================

-- Drop all companies policies
DROP POLICY IF EXISTS "Organization members can view their companies" ON companies CASCADE;
DROP POLICY IF EXISTS "Brokers and admins can create companies" ON companies CASCADE;
DROP POLICY IF EXISTS "Brokers and admins can update companies" ON companies CASCADE;
DROP POLICY IF EXISTS "Only admins can delete companies" ON companies CASCADE;

-- SELECT: Organization members can view companies
CREATE POLICY "Organization members can view their companies"
ON companies
FOR SELECT
TO public
USING (
  -- Direct user_organizations check - NO FUNCTIONS
  organization_id IN (
    SELECT organization_id 
    FROM user_organizations
    WHERE user_id = auth.uid()
  )
);

-- INSERT: Brokers and admins can create
CREATE POLICY "Brokers and admins can create companies"
ON companies
FOR INSERT
TO public
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM user_organizations
    WHERE user_id = auth.uid()
    AND role IN ('broker', 'admin')
  )
);

-- UPDATE: Brokers and admins can update
CREATE POLICY "Brokers and admins can update companies"
ON companies
FOR UPDATE
TO public
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_organizations
    WHERE user_id = auth.uid()
    AND role IN ('broker', 'admin')
  )
);

-- DELETE: Only admins can delete
CREATE POLICY "Only admins can delete companies"
ON companies
FOR DELETE
TO public
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_organizations
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- ===========================================================================
-- PART 4: Fix organizations policies (remove self-reference)
-- ===========================================================================

DROP POLICY IF EXISTS "members_can_view_their_organizations" ON organizations CASCADE;

CREATE POLICY "members_can_view_their_organizations"
ON organizations
FOR SELECT
TO public
USING (
  -- Platform admins see all
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  )
  OR
  -- Organization members see their org - direct check, no recursion
  id IN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
  )
);

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

COMMENT ON FUNCTION is_organization_member(uuid) 
  IS 'Check if user is member of organization. SECURITY DEFINER to prevent RLS recursion.';
COMMENT ON FUNCTION has_organization_role(uuid, text) 
  IS 'Check if user has specific role in organization. SECURITY DEFINER to prevent RLS recursion.';

