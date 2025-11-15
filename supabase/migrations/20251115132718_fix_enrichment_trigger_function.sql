-- Fix enrichment trigger function name
-- The migration 20251115110711 calls update_updated_at() which doesn't exist
-- The correct function name is update_updated_at_column()
-- This migration fixes the triggers created by that migration

-- Drop the incorrect triggers created by previous migration
DROP TRIGGER IF EXISTS update_company_enriched_data_updated_at ON company_enriched_data;
DROP TRIGGER IF EXISTS update_enrichment_jobs_updated_at ON enrichment_jobs;

-- Recreate them with the correct function name
CREATE TRIGGER update_company_enriched_data_updated_at
  BEFORE UPDATE ON company_enriched_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrichment_jobs_updated_at
  BEFORE UPDATE ON enrichment_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Note: data_sources table doesn't exist yet, so no trigger needed for it

