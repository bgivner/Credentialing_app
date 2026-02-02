import { clerkClient } from '@clerk/nextjs/server'

/**
 * Script to create test admin and client users
 * Run with: npx tsx scripts/create-test-users.ts
 */

async function createTestUsers() {
  console.log('🧪 Creating test users...\n')

  try {
    // Create Admin User
    console.log('1️⃣  Creating admin user...')
    try {
      const admin = await clerkClient.users.createUser({
        emailAddress: ['admin@test.com'],
        password: 'AdminTest123!',
        firstName: 'Admin',
        lastName: 'User',
        publicMetadata: {
          role: 'admin'
        }
      })
      console.log('   ✅ Admin created:', admin.emailAddresses[0]?.emailAddress)
    } catch (error: any) {
      if (error.errors?.[0]?.code === 'form_identifier_exists') {
        console.log('   ⚠️  Admin user already exists')
        
        // Update existing user to have admin role
        const users = await clerkClient.users.getUserList({
          emailAddress: ['admin@test.com'],
          limit: 1
        })
        
        if (users.data.length > 0) {
          await clerkClient.users.updateUserMetadata(users.data[0].id, {
            publicMetadata: { role: 'admin' }
          })
          console.log('   ✅ Updated existing admin user role')
        }
      } else {
        throw error
      }
    }

    // Create Client User
    console.log('\n2️⃣  Creating client user...')
    try {
      const client = await clerkClient.users.createUser({
        emailAddress: ['client@test.com'],
        password: 'ClientTest123!',
        firstName: 'Test',
        lastName: 'Client',
        publicMetadata: {
          role: 'client',
          businessName: 'Test ABA Practice LLC'
        }
      })
      console.log('   ✅ Client created:', client.emailAddresses[0]?.emailAddress)
    } catch (error: any) {
      if (error.errors?.[0]?.code === 'form_identifier_exists') {
        console.log('   ⚠️  Client user already exists')
        
        // Update existing user to have client role
        const users = await clerkClient.users.getUserList({
          emailAddress: ['client@test.com'],
          limit: 1
        })
        
        if (users.data.length > 0) {
          await clerkClient.users.updateUserMetadata(users.data[0].id, {
            publicMetadata: { 
              role: 'client',
              businessName: 'Test ABA Practice LLC'
            }
          })
          console.log('   ✅ Updated existing client user role')
        }
      } else {
        throw error
      }
    }

    console.log('\n✅ Test users ready!\n')
    console.log('📝 Login Credentials:')
    console.log('─────────────────────')
    console.log('Admin User:')
    console.log('  Email: admin@test.com')
    console.log('  Password: AdminTest123!')
    console.log('  Access: /dashboard\n')
    
    console.log('Client User:')
    console.log('  Email: client@test.com')
    console.log('  Password: ClientTest123!')
    console.log('  Access: /portal\n')
    
    console.log('🚀 Test the authentication:')
    console.log('1. Sign in as admin at /sign-in → Should go to /dashboard')
    console.log('2. Sign out')
    console.log('3. Sign in as client at /sign-in → Should go to /portal')

  } catch (error: any) {
    console.error('❌ Error creating test users:', error.message)
    if (error.errors) {
      console.error('Details:', JSON.stringify(error.errors, null, 2))
    }
    process.exit(1)
  }
}

// Run the script
createTestUsers()