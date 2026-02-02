-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Clients table
CREATE TABLE clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    business_name TEXT NOT NULL,
    business_entity_type TEXT,
    current_states TEXT[],
    target_states TEXT[],
    business_address JSONB,
    practice_address_new_state JSONB,
    phone TEXT,
    email TEXT,
    fax TEXT,
    tax_id TEXT, -- Will be encrypted at application level
    npi_individual TEXT,
    npi_group TEXT,
    package_type TEXT,
    total_price DECIMAL(10, 2),
    status TEXT DEFAULT 'intake_incomplete' CHECK (status IN ('intake_incomplete', 'intake_complete', 'in_progress', 'completed', 'on_hold'))
);

-- Providers table
CREATE TABLE providers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    full_name TEXT NOT NULL,
    date_of_birth DATE,
    ssn TEXT, -- Will be encrypted at application level
    email TEXT,
    phone TEXT,
    bcba_cert_number TEXT,
    bcba_cert_expiration DATE,
    state_licenses JSONB[], -- Array of {state, number, expiration}
    individual_npi TEXT,
    caqh_id TEXT,
    caqh_last_attestation DATE
);

-- Target Payers table
CREATE TABLE target_payers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    payer_name TEXT NOT NULL,
    payer_type TEXT CHECK (payer_type IN ('medicaid', 'mco', 'commercial')),
    priority INTEGER,
    status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'caqh_setup', 'app_submitted', 'in_review', 'approved', 'denied', 'on_hold')),
    application_date DATE,
    expected_completion_date DATE,
    last_followup_date DATE,
    next_followup_date DATE,
    approval_date DATE,
    notes TEXT
);

-- Documents table
CREATE TABLE documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    document_type TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Supabase Storage path
    file_size INTEGER,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    status TEXT DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'needs_update', 'rejected')),
    version INTEGER DEFAULT 1
);

-- Work History table
CREATE TABLE work_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    employer_name TEXT NOT NULL,
    position TEXT,
    start_date DATE,
    end_date DATE,
    address JSONB,
    reason_for_leaving TEXT
);

-- Education table
CREATE TABLE education (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    institution_name TEXT NOT NULL,
    degree_type TEXT,
    field_of_study TEXT,
    graduation_date DATE,
    institution_address JSONB
);

-- Professional References table
CREATE TABLE professional_references (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    name TEXT NOT NULL,
    title TEXT,
    relationship TEXT,
    phone TEXT,
    email TEXT
);

-- Payer Profiles (Knowledge Base) table
CREATE TABLE payer_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    payer_name TEXT NOT NULL UNIQUE,
    payer_type TEXT,
    states_covered TEXT[],
    portal_url TEXT,
    application_type TEXT,
    typical_timeline_days INTEGER,
    special_requirements TEXT,
    credentialing_contact_name TEXT,
    credentialing_contact_phone TEXT,
    credentialing_contact_email TEXT,
    portal_login_instructions TEXT,
    common_rejection_reasons TEXT[],
    tips_notes TEXT
);

-- State MCOs (Reference data) table
CREATE TABLE state_mcos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    state TEXT NOT NULL,
    mco_name TEXT NOT NULL,
    mco_type TEXT,
    website TEXT,
    UNIQUE(state, mco_name)
);

-- Timeline Events table
CREATE TABLE timeline_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    event_type TEXT NOT NULL,
    event_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    payer_name TEXT,
    description TEXT,
    created_by TEXT
);

-- Communication Log table
CREATE TABLE communication_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    communication_type TEXT CHECK (communication_type IN ('email', 'call', 'sms', 'note', 'internal')),
    direction TEXT CHECK (direction IN ('inbound', 'outbound', 'internal')),
    subject TEXT,
    message TEXT,
    related_payer TEXT,
    created_by TEXT
);

-- Email Templates table
CREATE TABLE email_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    template_name TEXT NOT NULL UNIQUE,
    subject TEXT NOT NULL,
    body TEXT NOT NULL, -- Supports variables like {{client_name}}
    template_type TEXT CHECK (template_type IN ('onboarding', 'document_request', 'status_update', 'reminder', 'approval', 'other'))
);

-- Insurance Information table
CREATE TABLE insurance_information (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    has_professional_liability BOOLEAN DEFAULT FALSE,
    prof_liability_carrier TEXT,
    prof_liability_policy_number TEXT,
    prof_liability_coverage_amounts TEXT,
    prof_liability_expiration DATE,
    has_general_liability BOOLEAN DEFAULT FALSE,
    gen_liability_carrier TEXT,
    gen_liability_policy_number TEXT,
    gen_liability_coverage_amounts TEXT,
    gen_liability_expiration DATE
);

-- Billing Information table
CREATE TABLE billing_information (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    invoice_number TEXT,
    invoice_date DATE,
    amount DECIMAL(10, 2),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue', 'cancelled')),
    payment_date DATE,
    payment_method TEXT,
    notes TEXT
);

-- Create indexes for better performance
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_providers_client_id ON providers(client_id);
CREATE INDEX idx_target_payers_client_id ON target_payers(client_id);
CREATE INDEX idx_target_payers_status ON target_payers(status);
CREATE INDEX idx_documents_client_id ON documents(client_id);
CREATE INDEX idx_documents_provider_id ON documents(provider_id);
CREATE INDEX idx_timeline_events_client_id ON timeline_events(client_id);
CREATE INDEX idx_communication_log_client_id ON communication_log(client_id);
CREATE INDEX idx_work_history_provider_id ON work_history(provider_id);
CREATE INDEX idx_education_provider_id ON education(provider_id);
CREATE INDEX idx_professional_references_provider_id ON professional_references(provider_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables with updated_at column
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_target_payers_updated_at BEFORE UPDATE ON target_payers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_history_updated_at BEFORE UPDATE ON work_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_education_updated_at BEFORE UPDATE ON education
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_professional_references_updated_at BEFORE UPDATE ON professional_references
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payer_profiles_updated_at BEFORE UPDATE ON payer_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_state_mcos_updated_at BEFORE UPDATE ON state_mcos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insurance_information_updated_at BEFORE UPDATE ON insurance_information
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billing_information_updated_at BEFORE UPDATE ON billing_information
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_payers ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_information ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_information ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (to be refined based on auth setup)
-- For now, these allow authenticated users to access all data
CREATE POLICY "Allow authenticated access to clients" ON clients
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated access to providers" ON providers
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated access to target_payers" ON target_payers
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated access to documents" ON documents
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated access to work_history" ON work_history
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated access to education" ON education
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated access to professional_references" ON professional_references
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated access to timeline_events" ON timeline_events
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated access to communication_log" ON communication_log
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated access to insurance_information" ON insurance_information
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated access to billing_information" ON billing_information
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Public read access for reference tables
CREATE POLICY "Allow public read access to payer_profiles" ON payer_profiles
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to state_mcos" ON state_mcos
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to email_templates" ON email_templates
    FOR SELECT USING (true);

-- Insert some initial reference data for State MCOs
INSERT INTO state_mcos (state, mco_name, mco_type, website) VALUES
-- South Carolina MCOs
('SC', 'Molina Healthcare SC', 'Medicaid', 'https://www.molinahealthcare.com/'),
('SC', 'Healthy Blue SC', 'Medicaid', 'https://www.healthybluesc.com/'),
('SC', 'Select Health SC', 'Medicaid', 'https://www.selecthealthofsc.com/'),
('SC', 'Absolute Total Care', 'Medicaid', 'https://www.absolutetotalcare.com/'),
-- North Carolina MCOs
('NC', 'Carolina Complete Health', 'Medicaid', 'https://www.carolinacompletehealth.com/'),
('NC', 'WellCare NC', 'Medicaid', 'https://www.wellcare.com/north-carolina'),
('NC', 'AmeriHealth Caritas NC', 'Medicaid', 'https://www.amerihealthcaritasnc.com/'),
('NC', 'Blue Cross Blue Shield NC', 'Medicaid', 'https://www.bluecrossnc.com/'),
('NC', 'UnitedHealthcare Community Plan NC', 'Medicaid', 'https://www.uhccommunityplan.com/nc'),
-- New Jersey MCOs
('NJ', 'Horizon NJ Health', 'Medicaid', 'https://www.horizonnjhealth.com/'),
('NJ', 'Amerigroup NJ', 'Medicaid', 'https://www.amerigroup.com/nj/'),
('NJ', 'WellCare NJ', 'Medicaid', 'https://www.wellcare.com/new-jersey'),
('NJ', 'UnitedHealthcare Community Plan NJ', 'Medicaid', 'https://www.uhccommunityplan.com/nj'),
('NJ', 'Aetna Better Health NJ', 'Medicaid', 'https://www.aetnabetterhealth.com/newjersey/');

-- Insert sample email templates
INSERT INTO email_templates (template_name, subject, body, template_type) VALUES
('welcome_onboarding', 
 'Welcome to ABA Credentialing Services - Getting Started',
 'Dear {{client_name}},

Welcome to our credentialing services! We''re excited to help you expand your ABA practice to {{target_state}}.

Your dedicated credentialing specialist will be reaching out within 24 hours to schedule your intake call. In the meantime, please begin gathering the following documents:

- BCBA certification
- State licenses
- Professional liability insurance certificate
- CV/Resume
- W-9 form

If you have any questions, please don''t hesitate to reach out.

Best regards,
The Credentialing Team',
 'onboarding'),

('document_request',
 'Documents Needed for {{payer_name}} Application',
 'Dear {{client_name}},

We''re making progress on your credentialing applications! To proceed with {{payer_name}}, we need the following documents:

{{document_list}}

Please upload these documents to your portal or reply with attachments by {{due_date}}.

Thank you,
The Credentialing Team',
 'document_request'),

('status_update',
 'Credentialing Status Update - {{client_name}}',
 'Dear {{client_name}},

Here''s your weekly credentialing status update:

{{status_summary}}

Next steps:
{{next_steps}}

Expected completion dates:
{{timeline}}

If you have any questions, please let us know.

Best regards,
The Credentialing Team',
 'status_update');

-- Insert sample payer profiles
INSERT INTO payer_profiles (
    payer_name, 
    payer_type, 
    states_covered, 
    portal_url, 
    application_type, 
    typical_timeline_days,
    special_requirements,
    credentialing_contact_phone,
    common_rejection_reasons
) VALUES
('Aetna',
 'commercial',
 ARRAY['NC', 'SC', 'NJ', 'GA', 'FL'],
 'https://www.aetna.com/health-care-professionals/claims-payment-reimbursement/availity.html',
 'Online Portal',
 90,
 'Must have CAQH profile complete and attested within 120 days',
 '1-800-624-0756',
 ARRAY['CAQH not attested', 'Missing liability insurance', 'Incomplete work history']),

('Cigna',
 'commercial',
 ARRAY['NC', 'SC', 'NJ', 'GA', 'FL'],
 'https://cignaforhcp.cigna.com/',
 'Online Portal',
 75,
 'Requires 5-year work history with no gaps greater than 30 days',
 '1-800-882-4462',
 ARRAY['Work history gaps', 'Missing references', 'License expired']),

('Blue Cross Blue Shield',
 'commercial',
 ARRAY['NC', 'SC', 'NJ', 'GA', 'FL'],
 'https://www.availity.com/',
 'Online Portal',
 60,
 'State-specific applications required',
 '1-800-262-2583',
 ARRAY['Wrong application form', 'Missing state license', 'NPI not active']),

('UnitedHealthcare',
 'commercial',
 ARRAY['NC', 'SC', 'NJ', 'GA', 'FL'],
 'https://www.uhcprovider.com/',
 'Online Portal',
 90,
 'Requires both individual and group NPIs',
 '1-877-842-3210',
 ARRAY['Missing group NPI', 'Taxonomy code incorrect', 'CAQH expired']);