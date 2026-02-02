import { clerkClient } from '@clerk/nextjs/server'

/**
 * Script to set up admin role for a user
 * Run with: npx tsx scripts/setup-admin.ts
 */

async function setupAdmin() {
  const adminEmail = process.argv[2]
  
  if (!adminEmail) {
    console.error('❌ Please provide an email address')
    console.log('Usage: npx tsx scripts/setup-admin.ts your-email@example.com')
    process.exit(1)
  }

  try {
    console.log(`🔍 Looking for user with email: ${adminEmail}`)
    
    // Get all users and find the one with matching email
    const users = await clerkClient.users.getUserList({
      emailAddress: [adminEmail],
      limit: 1
    })

    if (users.data.length === 0) {
      console.error(`❌ No user found with email: ${adminEmail}`)
      console.log('\nMake sure to create the user in Clerk Dashboard first')
      process.exit(1)
    }

    const user = users.data[0]
    console.log(`✅ Found user: ${user.firstName} ${user.lastName} (${user.id})`)

    // Update user metadata to set admin role
    const updatedUser = await clerkClient.users.updateUserMetadata(user.id, {
      publicMetadata: {
        role: 'admin',
        ...(user.publicMetadata || {})
      }
    })

    console.log('\n✅ Successfully set admin role!')
    console.log('📝 User metadata updated:')
    console.log(JSON.stringify(updatedUser.publicMetadata, null, 2))
    
    console.log('\n🚀 Next steps:')
    console.log('1. Sign in at /sign-in')
    console.log('2. You should be redirected to /dashboard')
    console.log('3. You can now invite client users from /dashboard/users')
    
  } catch (error: any) {
    console.error('❌ Error setting up admin:', error.message)
    process.exit(1)
  }
}

// Run the script
setupAdmin()