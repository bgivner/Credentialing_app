-- Update clients table to use Clerk user IDs
-- First, let's alter the clients table to use Clerk IDs

-- Drop the existing foreign key constraint to Supabase auth.users
ALTER TABLE clients 
DROP CONSTRAINT IF EXISTS clients_user_id_fkey;

-- Change user_id column to store Clerk user IDs (string format)
ALTER TABLE clients 
ALTER COLUMN user_id TYPE VARCHAR(255);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);

-- Update RLS policies to work without Supabase auth
-- We'll need to pass the Clerk user ID from the application layer

-- Drop existing RLS policies that depend on auth.uid()
DROP POLICY IF EXISTS "Users can view their own client data" ON clients;
DROP POLICY IF EXISTS "Users can update their own client data" ON clients;
DROP POLICY IF EXISTS "Users can insert their own client data" ON clients;

-- Create new RLS policies that work with application-provided user IDs
-- Note: These will rely on the application layer for authentication

-- For now, we'll disable RLS on these tables since authentication is handled by Clerk
-- The application layer will ensure proper access control
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE providers DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE target_payers DISABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_information DISABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events DISABLE ROW LEVEL SECURITY;

-- Add a column to track Clerk metadata
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS clerk_metadata JSONB DEFAULT '{}';

-- Add audit columns if not present
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

-- Create an invitations tracking table (for audit purposes)
CREATE TABLE IF NOT EXISTS user_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_invitation_id VARCHAR(255) UNIQUE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'client',
  business_name VARCHAR(255),
  invited_by VARCHAR(255), -- Clerk user ID of admin
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, expired
  metadata JSONB DEFAULT '{}'
);

-- Create index for invitation lookups
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_status ON user_invitations(status);

-- Comments for documentation
COMMENT ON TABLE user_invitations IS 'Tracks user invitations sent via Clerk';
COMMENT ON COLUMN clients.user_id IS 'Clerk user ID (not Supabase auth.users.id)';
COMMENT ON COLUMN clients.clerk_metadata IS 'Additional metadata from Clerk user profile';