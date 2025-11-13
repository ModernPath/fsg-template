-- Add INSERT, UPDATE, DELETE policies for company_assets table
-- Allows organization members to manage assets for their companies

-- Drop existing policies if any
DROP POLICY IF EXISTS "Organization members can insert company assets" ON company_assets;
DROP POLICY IF EXISTS "Organization members can update company assets" ON company_assets;
DROP POLICY IF EXISTS "Organization members can delete company assets" ON company_assets;

-- INSERT: Organization members can create assets for their companies
CREATE POLICY "Organization members can insert company assets"
ON company_assets FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM companies
    INNER JOIN user_organizations ON companies.organization_id = user_organizations.organization_id
    WHERE companies.id = company_assets.company_id
    AND user_organizations.user_id = auth.uid()
  )
);

-- UPDATE: Organization members can update assets for their companies
CREATE POLICY "Organization members can update company assets"
ON company_assets FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM companies
    INNER JOIN user_organizations ON companies.organization_id = user_organizations.organization_id
    WHERE companies.id = company_assets.company_id
    AND user_organizations.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM companies
    INNER JOIN user_organizations ON companies.organization_id = user_organizations.organization_id
    WHERE companies.id = company_assets.company_id
    AND user_organizations.user_id = auth.uid()
  )
);

-- DELETE: Organization members can delete assets for their companies
CREATE POLICY "Organization members can delete company assets"
ON company_assets FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM companies
    INNER JOIN user_organizations ON companies.organization_id = user_organizations.organization_id
    WHERE companies.id = company_assets.company_id
    AND user_organizations.user_id = auth.uid()
  )
);

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

