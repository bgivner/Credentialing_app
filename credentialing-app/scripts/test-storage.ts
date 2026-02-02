import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testStorage() {
  console.log('🧪 Testing Supabase Storage Configuration...\n')

  try {
    // Step 1: Check if bucket exists
    console.log('1️⃣  Checking if documents bucket exists...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('   ❌ Error listing buckets:', bucketsError.message)
      return
    }

    const documentsBucket = buckets?.find(b => b.name === 'documents')
    if (!documentsBucket) {
      console.error('   ❌ Documents bucket not found. Please create it in Supabase Dashboard.')
      console.log('   📖 See STORAGE_SETUP.md for instructions')
      return
    }
    console.log('   ✅ Documents bucket exists\n')

    // Step 2: Test authentication
    console.log('2️⃣  Testing authentication...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (!user) {
      console.log('   ⚠️  No authenticated user. Storage operations require authentication.')
      console.log('   📝 To test with authentication, log in via the client portal first.\n')
    } else {
      console.log(`   ✅ Authenticated as: ${user.email}\n`)
    }

    // Step 3: List files in bucket (if authenticated)
    if (user) {
      console.log('3️⃣  Testing file listing...')
      const { data: files, error: listError } = await supabase.storage
        .from('documents')
        .list('', {
          limit: 5,
          offset: 0
        })

      if (listError) {
        console.error('   ❌ Error listing files:', listError.message)
        console.log('   📝 This might indicate RLS policies need configuration.')
      } else {
        console.log(`   ✅ Successfully listed files. Found ${files?.length || 0} items.\n`)
      }
    }

    // Step 4: Check storage policies
    console.log('4️⃣  Storage Policy Recommendations:')
    console.log('   📋 Ensure these policies are configured in Supabase Dashboard:')
    console.log('      - SELECT: Allow authenticated users to view documents')
    console.log('      - INSERT: Allow authenticated users to upload documents')
    console.log('      - UPDATE: Allow users to update their own documents')
    console.log('      - DELETE: Allow users to delete their own documents')
    console.log('\n   📖 See STORAGE_SETUP.md for detailed policy configurations\n')

    // Summary
    console.log('📊 Storage Test Summary:')
    console.log('   ✅ Bucket configuration: OK')
    console.log(`   ${user ? '✅' : '⚠️ '} Authentication: ${user ? 'OK' : 'Not authenticated (optional for this test)'}`)
    console.log('   📝 Next steps:')
    console.log('      1. Configure RLS policies via Supabase Dashboard')
    console.log('      2. Test file upload from the client portal')
    console.log('      3. Monitor uploads in Supabase Dashboard → Storage')
    
  } catch (error) {
    console.error('❌ Unexpected error during storage test:', error)
  }
}

// Run the test
testStorage()