-- Create alias function for update_updated_at()
-- This is needed because migration 20251115110711 uses this function name
-- but the actual function is called update_updated_at_column()
-- This migration must run BEFORE 20251115110711

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at() IS 'Alias for update_updated_at_column() - auto-updates updated_at timestamp';

