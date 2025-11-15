-- Add fields to ndas table for better NDA management
-- This migration adds content storage and recipient details

ALTER TABLE ndas
  -- Add content field to store full NDA text
  ADD COLUMN IF NOT EXISTS content TEXT,
  
  -- Add recipient information fields
  ADD COLUMN IF NOT EXISTS recipient_name TEXT,
  ADD COLUMN IF NOT EXISTS recipient_email TEXT,
  ADD COLUMN IF NOT EXISTS recipient_company TEXT,
  ADD COLUMN IF NOT EXISTS recipient_address TEXT,
  ADD COLUMN IF NOT EXISTS purpose TEXT,
  
  -- Add creator tracking
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS signed_by UUID REFERENCES profiles(id),
  
  -- Add signature metadata
  ADD COLUMN IF NOT EXISTS signature_ip INET;

-- Make template_version nullable for backward compatibility
ALTER TABLE ndas ALTER COLUMN template_version DROP NOT NULL;

-- Set default template version for existing records
UPDATE ndas SET template_version = 'v1.0' WHERE template_version IS NULL;

-- Add comments
COMMENT ON COLUMN ndas.content IS 'Full NDA document content in Markdown format';
COMMENT ON COLUMN ndas.recipient_name IS 'Full name of the NDA recipient';
COMMENT ON COLUMN ndas.recipient_email IS 'Email address of the NDA recipient';
COMMENT ON COLUMN ndas.recipient_company IS 'Company name of the recipient (optional)';
COMMENT ON COLUMN ndas.recipient_address IS 'Address of the recipient (optional)';
COMMENT ON COLUMN ndas.purpose IS 'Purpose of the NDA (e.g., M&A Due Diligence)';
COMMENT ON COLUMN ndas.created_by IS 'User who created the NDA';
COMMENT ON COLUMN ndas.signed_by IS 'User who signed the NDA';
COMMENT ON COLUMN ndas.signature_ip IS 'IP address from which the NDA was signed';

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_ndas_created_by ON ndas(created_by);
CREATE INDEX IF NOT EXISTS idx_ndas_signed_by ON ndas(signed_by);
CREATE INDEX IF NOT EXISTS idx_ndas_recipient_email ON ndas(recipient_email);

-- Update status check constraint to include 'pending'
ALTER TABLE ndas DROP CONSTRAINT IF EXISTS valid_nda_status;
ALTER TABLE ndas ADD CONSTRAINT valid_nda_status 
  CHECK (status IN ('draft', 'pending', 'sent', 'viewed', 'signed', 'declined', 'expired'));

