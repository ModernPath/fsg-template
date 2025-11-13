-- Fix RLS policies for deals and payments tables
-- These tables need to allow organization members to access data

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Buyers can view deals they're involved in" ON deals;

-- Deals: Organization-based access
CREATE POLICY "Organization members can view deals"
  ON deals FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can create deals"
  ON deals FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can update deals"
  ON deals FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Payments: Organization-based access
CREATE POLICY "Organization members can view payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can create payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can update payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );
