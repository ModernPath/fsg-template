-- Add gamma_edit_url column to company_assets
ALTER TABLE company_assets
  ADD COLUMN IF NOT EXISTS gamma_edit_url TEXT;

-- Add comment
COMMENT ON COLUMN company_assets.gamma_edit_url IS 'Editable URL for Gamma presentation';
