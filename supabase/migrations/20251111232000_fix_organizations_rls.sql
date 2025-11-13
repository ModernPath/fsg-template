-- ============================================================================
-- Fix organizations RLS policies for onboarding
-- Created: 2025-11-11 23:20:00
-- Description: Allow authenticated users to create organizations during onboarding
-- ============================================================================

-- Drop ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view organizations" ON organizations;
DROP POLICY IF EXISTS "Organization members can view" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Organization admins can update" ON organizations;
DROP POLICY IF EXISTS "Platform admins can manage all organizations" ON organizations;
DROP POLICY IF EXISTS "members_can_view_their_organizations" ON organizations;
DROP POLICY IF EXISTS "authenticated_can_create_organizations" ON organizations;
DROP POLICY IF EXISTS "admins_can_update_organizations" ON organizations;
DROP POLICY IF EXISTS "admins_can_delete_organizations" ON organizations;

-- 1. Allow authenticated users to CREATE organizations during onboarding
CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 2. Users can view organizations they are members of
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    -- User is a member of this organization
    id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- 3. Organization admins can update their organizations
CREATE POLICY "Organization admins can update"
  ON organizations FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  )
  WITH CHECK (
    id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 4. Platform admins can do everything
CREATE POLICY "Platform admins can manage all organizations"
  ON organizations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

COMMENT ON POLICY "Authenticated users can create organizations" ON organizations 
  IS 'Allows users to create organizations during onboarding';
COMMENT ON POLICY "Users can view their organizations" ON organizations 
  IS 'Users can only see organizations they belong to';
COMMENT ON POLICY "Organization admins can update" ON organizations 
  IS 'Organization admins can modify their organization details';
COMMENT ON POLICY "Platform admins can manage all organizations" ON organizations 
  IS 'Platform admins have full access to all organizations';

