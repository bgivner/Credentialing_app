-- Additional fields for comprehensive intake form
-- Run this after 001_initial_schema.sql

-- Add missing fields to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS credentialing_type TEXT CHECK (credentialing_type IN ('individual', 'group')),
ADD COLUMN IF NOT EXISTS has_npi BOOLEAN,
ADD COLUMN IF NOT EXISTS npi_type TEXT CHECK (npi_type IN ('individual', 'group', 'both')),
ADD COLUMN IF NOT EXISTS tax_id_type TEXT CHECK (tax_id_type IN ('ssn', 'ein')),
ADD COLUMN IF NOT EXISTS has_business_entity_new_state BOOLEAN,
ADD COLUMN IF NOT EXISTS needs_entity_setup BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_physical_location TEXT CHECK (has_physical_location IN ('yes', 'remote')),
ADD COLUMN IF NOT EXISTS office_hours TEXT,
ADD COLUMN IF NOT EXISTS services_provided TEXT[],
ADD COLUMN IF NOT EXISTS providers_count INTEGER DEFAULT 1;

-- Add contact information to clients table
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS contact_name TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT CHECK (preferred_contact_method IN ('email', 'phone', 'text'));

-- Add documentation status fields to providers table
ALTER TABLE providers
ADD COLUMN IF NOT EXISTS has_caqh BOOLEAN,
ADD COLUMN IF NOT EXISTS caqh_updated BOOLEAN,
ADD COLUMN IF NOT EXISTS has_current_cv BOOLEAN,
ADD COLUMN IF NOT EXISTS has_references BOOLEAN,
ADD COLUMN IF NOT EXISTS references_count INTEGER;

-- Create a separate table for intake form status tracking
CREATE TABLE IF NOT EXISTS intake_status (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    has_bcba_cert_docs BOOLEAN,
    has_state_licenses BOOLEAN,
    has_current_cv BOOLEAN,
    has_references BOOLEAN,
    wants_medicaid BOOLEAN,
    medicaid_mcos TEXT[],
    commercial_payers TEXT[],
    payer_priority TEXT,
    documents_needed TEXT[],
    documents_received TEXT[],
    UNIQUE(client_id)
);

-- Create index for intake status
CREATE INDEX IF NOT EXISTS idx_intake_status_client_id ON intake_status(client_id);

-- Add trigger for intake_status updated_at
CREATE TRIGGER update_intake_status_updated_at BEFORE UPDATE ON intake_status
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on intake_status
ALTER TABLE intake_status ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for intake_status
CREATE POLICY "Allow authenticated access to intake_status" ON intake_status
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Add comment to explain the purpose of this migration
COMMENT ON TABLE intake_status IS 'Tracks the status of documentation and preferences from the intake form';
COMMENT ON COLUMN clients.credentialing_type IS 'Whether credentialing as individual provider or group practice';
COMMENT ON COLUMN clients.has_physical_location IS 'Whether practice has physical location in new state or operates remotely';
COMMENT ON COLUMN clients.services_provided IS 'Array of service types: assessment, treatment, supervision, telehealth';
COMMENT ON COLUMN providers.has_caqh IS 'Whether provider has existing CAQH ProView profile';
COMMENT ON COLUMN providers.caqh_updated IS 'Whether CAQH profile has been attested within last 120 days';
COMMENT ON COLUMN intake_status.wants_medicaid IS 'Whether client wants to be credentialed with Medicaid';
COMMENT ON COLUMN intake_status.medicaid_mcos IS 'List of selected Medicaid MCOs for target state';
COMMENT ON COLUMN intake_status.commercial_payers IS 'List of selected commercial insurance payers';
COMMENT ON COLUMN intake_status.documents_needed IS 'Checklist of required documents';
COMMENT ON COLUMN intake_status.documents_received IS 'List of documents already received';