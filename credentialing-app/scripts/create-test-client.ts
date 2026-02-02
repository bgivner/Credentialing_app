import { createClient } from '@supabase/supabase-js'

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  console.log('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY are set in .env.local')
  process.exit(1)
}

// Use service key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTestClient() {
  const testEmail = 'test@example.com'
  const testPassword = 'TestPassword123!'
  
  console.log('🧪 Creating test client account...\n')
  
  try {
    // Step 1: Create auth user
    console.log('1️⃣  Creating authentication user...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true // Auto-confirm email for testing
    })
    
    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('   ⚠️  User already exists. You can log in with:')
        console.log(`      Email: ${testEmail}`)
        console.log(`      Password: ${testPassword}`)
        return
      }
      throw authError
    }
    
    console.log('   ✅ User created successfully')
    
    // Step 2: Create client record
    console.log('\n2️⃣  Creating client record...')
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .insert({
        user_id: authData.user.id,
        business_name: 'Test ABA Practice',
        email: testEmail,
        phone: '555-0123',
        status: 'intake_incomplete'
      })
      .select()
      .single()
    
    if (clientError) {
      console.log('   ⚠️  Client record may already exist')
    } else {
      console.log('   ✅ Client record created')
    }
    
    // Success message
    console.log('\n✅ Test client account created successfully!\n')
    console.log('📝 Login credentials:')
    console.log(`   Email: ${testEmail}`)
    console.log(`   Password: ${testPassword}`)
    console.log('\n🔗 Access the portal at:')
    console.log('   http://localhost:3000/portal/login')
    console.log('\n📋 Next steps:')
    console.log('   1. Log in with the credentials above')
    console.log('   2. Complete the intake form')
    console.log('   3. Upload test documents')
    console.log('   4. View your dashboard')
    
  } catch (error: any) {
    console.error('❌ Error creating test client:', error.message)
  }
}

// Run the script
createTestClient()