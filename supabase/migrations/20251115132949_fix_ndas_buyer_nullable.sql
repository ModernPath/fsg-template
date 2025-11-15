-- Make ndas.buyer_id nullable
-- This allows creating NDAs for generic recipients who don't have a buyer profile yet

ALTER TABLE ndas
  ALTER COLUMN buyer_id DROP NOT NULL;

COMMENT ON COLUMN ndas.buyer_id IS 'Buyer profile ID (optional - can be null for generic recipients)';

