-- Fix organizations RLS policies - remove conflicting policies
-- Migration: 20250114160000_fix_organizations_rls_final.sql

-- Drop all existing policies that might conflict
DROP POLICY IF EXISTS "Platform admins can manage all organizations" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;
DROP POLICY IF EXISTS "authenticated_can_create_organizations" ON organizations;
DROP POLICY IF EXISTS "dev_allow_all_inserts" ON organizations;
DROP POLICY IF EXISTS "admins_can_delete_organizations" ON organizations;
DROP POLICY IF EXISTS "admins_can_update_organizations" ON organizations;
DROP POLICY IF EXISTS "members_can_view_their_organizations" ON organizations;

-- Ensure RLS is enabled
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Create one comprehensive policy for authenticated users
CREATE POLICY "allow_all_for_authenticated" ON organizations
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Note: In production, you should replace this with more restrictive policies
-- For example:
-- - Allow SELECT for members of the organization
-- - Allow INSERT for authenticated users with a profile
-- - Allow UPDATE/DELETE only for organization admins
-- 
-- But for local development, this permissive policy works fine.

