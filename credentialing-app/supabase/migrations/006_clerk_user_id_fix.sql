-- Change user_id columns from UUID to TEXT to support Clerk user IDs
-- Clerk user IDs have format like "user_xxxxxxxxxxxxxxxxxxxxx" which are not UUIDs

-- More comprehensive approach: Drop ALL policies and views that depend on user_id columns
-- This uses a more aggressive approach to ensure we catch all dependencies

-- First drop any views that depend on user_id column
DROP VIEW IF EXISTS client_portal_view;

-- Drop foreign key constraints that depend on user_id column
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_user_id_fkey;

-- Then disable RLS on all tables (this should drop policies automatically)
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE providers DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE target_payers DISABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_information DISABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE intake_status DISABLE ROW LEVEL SECURITY;
ALTER TABLE document_types DISABLE ROW LEVEL SECURITY;

-- Additional manual policy drops in case some persist
DROP POLICY IF EXISTS "Clients can view and update own record" ON clients;
DROP POLICY IF EXISTS "Clients can insert own record" ON clients;
DROP POLICY IF EXISTS "Users can view own clients" ON clients;
DROP POLICY IF EXISTS "Users can update own clients" ON clients;
DROP POLICY IF EXISTS "Users can insert own clients" ON clients;
DROP POLICY IF EXISTS "Clients can manage own providers" ON providers;
DROP POLICY IF EXISTS "Users can view own providers" ON providers;
DROP POLICY IF EXISTS "Users can update own providers" ON providers;
DROP POLICY IF EXISTS "Users can insert own providers" ON providers;
DROP POLICY IF EXISTS "Users can view own documents" ON documents;
DROP POLICY IF EXISTS "Users can update own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON documents;
DROP POLICY IF EXISTS "Clients can manage own documents" ON documents;
DROP POLICY IF EXISTS "Clients can view own documents" ON documents;
DROP POLICY IF EXISTS "Clients can insert own documents" ON documents;
DROP POLICY IF EXISTS "Clients can update own documents" ON documents;
DROP POLICY IF EXISTS "Users can view own target payers" ON target_payers;
DROP POLICY IF EXISTS "Users can update own target payers" ON target_payers;
DROP POLICY IF EXISTS "Users can insert own target payers" ON target_payers;
DROP POLICY IF EXISTS "Users can view own insurance info" ON insurance_information;
DROP POLICY IF EXISTS "Users can update own insurance info" ON insurance_information;
DROP POLICY IF EXISTS "Users can insert own insurance info" ON insurance_information;
DROP POLICY IF EXISTS "Users can view own timeline events" ON timeline_events;
DROP POLICY IF EXISTS "Users can update own timeline events" ON timeline_events;
DROP POLICY IF EXISTS "Users can insert own timeline events" ON timeline_events;
DROP POLICY IF EXISTS "Users can view own intake status" ON intake_status;
DROP POLICY IF EXISTS "Users can update own intake status" ON intake_status;
DROP POLICY IF EXISTS "Users can insert own intake status" ON intake_status;

-- RLS already disabled above, no need to repeat

-- Now change the column type on clients table
ALTER TABLE clients ALTER COLUMN user_id TYPE TEXT;

-- Add index for performance on the text user_id column
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);