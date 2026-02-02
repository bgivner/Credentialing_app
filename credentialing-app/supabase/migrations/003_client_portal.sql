-- Client Portal Authentication and Access Control
-- This migration adds support for client self-service portal

-- Add user authentication fields to clients table
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS invite_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS invite_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS invite_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS portal_access_enabled BOOLEAN DEFAULT TRUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_invite_token ON clients(invite_token);

-- Create client invitations table for tracking
CREATE TABLE IF NOT EXISTS client_invitations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    created_by TEXT,
    UNIQUE(client_id, email)
);

-- Create index for invitation lookups
CREATE INDEX IF NOT EXISTS idx_client_invitations_token ON client_invitations(token);
CREATE INDEX IF NOT EXISTS idx_client_invitations_email ON client_invitations(email);

-- Update RLS policies for client access
DROP POLICY IF EXISTS "Allow authenticated access to clients" ON clients;

-- Create separate policies for admin and client access
CREATE POLICY "Admin full access to clients" ON clients
    FOR ALL 
    TO authenticated
    USING (
        auth.jwt() ->> 'role' = 'admin' OR
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "Clients can view and update own record" ON clients
    FOR ALL 
    TO authenticated
    USING (
        user_id = auth.uid()
    )
    WITH CHECK (
        user_id = auth.uid()
    );

-- Update providers table RLS
DROP POLICY IF EXISTS "Allow authenticated access to providers" ON providers;

CREATE POLICY "Admin full access to providers" ON providers
    FOR ALL 
    TO authenticated
    USING (
        auth.jwt() ->> 'role' = 'admin' OR
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "Clients can manage own providers" ON providers
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = providers.client_id 
            AND clients.user_id = auth.uid()
        )
    );

-- Update documents table RLS
DROP POLICY IF EXISTS "Allow authenticated access to documents" ON documents;

CREATE POLICY "Admin full access to documents" ON documents
    FOR ALL 
    TO authenticated
    USING (
        auth.jwt() ->> 'role' = 'admin' OR
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "Clients can manage own documents" ON documents
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = documents.client_id 
            AND clients.user_id = auth.uid()
        )
    );

-- Create document types reference table
CREATE TABLE IF NOT EXISTS document_types (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    required BOOLEAN DEFAULT FALSE,
    applies_to TEXT CHECK (applies_to IN ('business', 'provider', 'both')),
    sort_order INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    UNIQUE(category, name)
);

-- Insert standard document types
INSERT INTO document_types (category, name, description, required, applies_to, sort_order) VALUES
-- Business Documents
('business', 'W-9 Form', 'IRS W-9 tax form', true, 'business', 1),
('business', 'Business License', 'State business license/registration', true, 'business', 2),
('business', 'EIN Letter', 'IRS EIN assignment letter', false, 'business', 3),
('business', 'Bank Letter', 'Bank letter or voided check for EFT setup', true, 'business', 4),
('business', 'Operating Agreement', 'LLC operating agreement or corporate bylaws', false, 'business', 5),

-- Professional Credentials
('credentials', 'BCBA Certificate', 'Current BCBA certification', true, 'provider', 10),
('credentials', 'State License', 'Current state license (front and back)', true, 'provider', 11),
('credentials', 'CV/Resume', 'Current curriculum vitae or resume', true, 'provider', 12),
('credentials', 'Diploma', 'Highest degree diploma (Masters/Doctoral)', true, 'provider', 13),

-- Insurance Documents
('insurance', 'Professional Liability', 'Professional liability insurance certificate', true, 'both', 20),
('insurance', 'General Liability', 'General liability insurance certificate', false, 'both', 21),
('insurance', 'Workers Compensation', 'Workers comp certificate if applicable', false, 'business', 22),

-- Personal Documents
('personal', 'Photo ID', 'Driver license or passport', true, 'provider', 30),
('personal', 'SSN Card', 'Social Security card (optional)', false, 'provider', 31),

-- Other
('other', 'CAQH Attestation', 'CAQH ProView attestation confirmation', false, 'provider', 40),
('other', 'Reference Letters', 'Professional reference letters', false, 'provider', 41),
('other', 'Other', 'Other supporting documents', false, 'both', 50);

-- Create view for client portal data
CREATE OR REPLACE VIEW client_portal_view AS
SELECT 
    c.id,
    c.business_name,
    c.email,
    c.phone,
    c.status,
    c.user_id,
    c.portal_access_enabled,
    COUNT(DISTINCT p.id) as provider_count,
    COUNT(DISTINCT d.id) as document_count,
    COUNT(DISTINCT tp.id) as payer_count,
    MAX(d.uploaded_at) as last_document_upload
FROM clients c
LEFT JOIN providers p ON p.client_id = c.id
LEFT JOIN documents d ON d.client_id = c.id
LEFT JOIN target_payers tp ON tp.client_id = c.id
GROUP BY c.id;

-- Grant access to the view
GRANT SELECT ON client_portal_view TO authenticated;

-- Add comments
COMMENT ON TABLE client_invitations IS 'Tracks invitation links sent to clients for portal access';
COMMENT ON TABLE document_types IS 'Reference table for required document types in credentialing';
COMMENT ON VIEW client_portal_view IS 'Simplified view for client portal dashboard';
COMMENT ON COLUMN clients.user_id IS 'Links client to their Supabase auth user for portal access';
COMMENT ON COLUMN clients.portal_access_enabled IS 'Whether client can access the self-service portal';