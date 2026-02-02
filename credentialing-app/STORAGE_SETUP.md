# Supabase Storage Setup Guide

This guide walks you through setting up the storage bucket for document uploads in your Supabase project.

## Prerequisites
- Access to your Supabase Dashboard
- Project already created and running

## Step 1: Create the Documents Bucket

1. **Navigate to Storage**
   - Go to your Supabase Dashboard
   - Click on "Storage" in the left sidebar

2. **Create New Bucket**
   - Click the "New Bucket" button
   - Configure with these settings:
     - **Name:** `documents`
     - **Public bucket:** ❌ OFF (keep it private)
     - **Allowed MIME types:** Leave empty to allow all types
     - **Max file size:** 10MB (10485760 bytes)
   - Click "Create Bucket"

## Step 2: Configure RLS Policies

After creating the bucket, you need to set up Row Level Security (RLS) policies to control access.

### Option A: Simple Setup (Recommended for Initial Development)

1. Click on the `documents` bucket
2. Go to the "Policies" tab
3. Click "New Policy"
4. Select "For full customization" 

Create this single policy:

**Policy Name:** Allow authenticated users full access
- **Allowed operations:** SELECT, INSERT, UPDATE, DELETE
- **Target roles:** authenticated
- **USING expression:** 
  ```sql
  bucket_id = 'documents'
  ```
- **WITH CHECK expression:**
  ```sql
  bucket_id = 'documents'
  ```

### Option B: Production Setup (More Restrictive)

Create these four separate policies for better security:

#### Policy 1: Allow authenticated uploads
- **Allowed operation:** INSERT
- **Target roles:** authenticated
- **WITH CHECK expression:**
  ```sql
  bucket_id = 'documents'
  ```

#### Policy 2: Allow users to view all documents
- **Allowed operation:** SELECT
- **Target roles:** authenticated
- **USING expression:**
  ```sql
  bucket_id = 'documents'
  ```

#### Policy 3: Allow users to update their own documents
- **Allowed operation:** UPDATE
- **Target roles:** authenticated
- **USING expression:**
  ```sql
  bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]
  ```

#### Policy 4: Allow users to delete their own documents
- **Allowed operation:** DELETE
- **Target roles:** authenticated
- **USING expression:**
  ```sql
  bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]
  ```

## Step 3: Configure File Size Limits

File size limits in Supabase Storage are configured at the bucket level:

1. **In the Supabase Dashboard:**
   - Go to Storage → Click on the `documents` bucket
   - Click on "Configuration" (gear icon)
   - Set "Max file size" to `10485760` (10MB in bytes)
   - Click "Save"

2. **Alternative: Update bucket via SQL Editor:**
   ```sql
   -- Update the bucket configuration to set max file size
   UPDATE storage.buckets 
   SET file_size_limit = 10485760  -- 10MB in bytes
   WHERE name = 'documents';
   ```

Note: File size validation is also implemented client-side in the application for better user experience.

## Step 4: Test the Setup

1. **Via Dashboard:**
   - Navigate to Storage → documents bucket
   - Try uploading a test file
   - Verify it uploads successfully

2. **Via Application:**
   - Log into the client portal
   - Go to Documents section
   - Try uploading a document
   - Verify it appears in both the app and Supabase Dashboard

## Troubleshooting

### Common Issues:

1. **"Policy violation" errors when uploading:**
   - Ensure you're logged in as an authenticated user
   - Check that RLS policies are correctly configured
   - Verify the bucket name matches exactly (`documents`)

2. **Files upload but don't appear:**
   - Check the file path structure in your code
   - Verify SELECT policy is properly configured
   - Check browser console for errors

3. **Large files fail to upload:**
   - Verify file size limits in bucket settings
   - Check your Supabase plan limits
   - Consider implementing client-side file size validation

## File Structure

Documents are organized in the bucket as:
```
documents/
├── {client_id}/
│   ├── BCBA_Certificate_{timestamp}.pdf
│   ├── State_License_{timestamp}.pdf
│   ├── Insurance_Certificate_{timestamp}.pdf
│   └── ...
```

## Security Notes

- All documents are private by default
- Access requires authentication
- Files are organized by client_id for isolation
- Consider implementing virus scanning for production
- Regular backups recommended for important documents

## Next Steps

After setting up storage:
1. Test document uploads from the client portal
2. Verify document viewing/downloading works
3. Test document deletion
4. Monitor storage usage in Supabase Dashboard