-- Storage Bucket Setup Instructions for Document Uploads
-- =====================================================
-- 
-- Storage buckets and policies must be created via Supabase Dashboard.
-- Follow these steps:
--
-- 1. Go to Supabase Dashboard → Storage
-- 2. Click "New Bucket"
-- 3. Name: "documents"
-- 4. Public bucket: OFF (keep it private)
-- 5. Click "Create Bucket"
--
-- 6. After creating the bucket, click on it and go to "Policies"
-- 7. Create the following RLS policies:
--
-- Policy 1: "Allow authenticated uploads"
-- - Allowed operation: INSERT
-- - Target roles: authenticated
-- - WITH CHECK expression:
--   bucket_id = 'documents'
--
-- Policy 2: "Allow users to view all documents"  
-- - Allowed operation: SELECT
-- - Target roles: authenticated
-- - USING expression:
--   bucket_id = 'documents'
--
-- Policy 3: "Allow users to update their own documents"
-- - Allowed operation: UPDATE
-- - Target roles: authenticated
-- - USING expression:
--   bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]
--
-- Policy 4: "Allow users to delete their own documents"
-- - Allowed operation: DELETE
-- - Target roles: authenticated  
-- - USING expression:
--   bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]
--
-- Note: For simpler setup initially, you can create a single policy:
-- "Allow authenticated users full access"
-- - Allowed operations: SELECT, INSERT, UPDATE, DELETE
-- - Target roles: authenticated
-- - USING expression: bucket_id = 'documents'

-- Create a simple file size limit policy (optional)
CREATE POLICY IF NOT EXISTS "Limit file uploads to 10MB"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (octet_length(content) < 10485760) -- 10MB in bytes
);