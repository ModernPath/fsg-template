-- Fix user_organizations RLS policies to allow INSERT, UPDATE, DELETE operations
-- Migration: 20250114150000_fix_user_organizations_rls.sql

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "users_can_insert_own_memberships" ON user_organizations;
DROP POLICY IF EXISTS "users_can_update_own_memberships" ON user_organizations;
DROP POLICY IF EXISTS "users_can_delete_own_memberships" ON user_organizations;

-- Ensure RLS is enabled
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

-- INSERT: Users can insert their own memberships or admins can insert any
CREATE POLICY "users_can_insert_own_memberships" ON user_organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- UPDATE: Users can update their own memberships or admins can update any
CREATE POLICY "users_can_update_own_memberships" ON user_organizations
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- DELETE: Users can delete their own memberships or admins can delete any
CREATE POLICY "users_can_delete_own_memberships" ON user_organizations
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Verify policies were created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_organizations' 
    AND policyname = 'users_can_insert_own_memberships'
  ) THEN
    RAISE EXCEPTION 'INSERT policy creation failed';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_organizations' 
    AND policyname = 'users_can_update_own_memberships'
  ) THEN
    RAISE EXCEPTION 'UPDATE policy creation failed';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_organizations' 
    AND policyname = 'users_can_delete_own_memberships'
  ) THEN
    RAISE EXCEPTION 'DELETE policy creation failed';
  END IF;
  
  RAISE NOTICE 'user_organizations RLS policies created successfully';
END $$;

