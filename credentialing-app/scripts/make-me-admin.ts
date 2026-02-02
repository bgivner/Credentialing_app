import { clerkClient } from '@clerk/nextjs/server'

/**
 * Quick script to make the first/primary user an admin
 * Run with: npx tsx scripts/make-me-admin.ts
 */

async function makeMeAdmin() {
  console.log('🔧 Setting up admin role for your account...\n')

  try {
    // Get the most recently created user (likely you)
    const users = await clerkClient.users.getUserList({
      orderBy: '-created_at',
      limit: 10
    })

    if (users.data.length === 0) {
      console.error('❌ No users found in Clerk')
      process.exit(1)
    }

    console.log('Found users:')
    users.data.forEach((user, index) => {
      console.log(`${index + 1}. ${user.emailAddresses[0]?.emailAddress} (${user.firstName} ${user.lastName})`)
    })

    // If there's only one user, use that one
    // Otherwise, prompt to select
    let targetUser = users.data[0]
    
    if (users.data.length > 1) {
      console.log('\n⚠️  Multiple users found.')
      console.log('Using the first one. If this is not you, update manually in Clerk Dashboard.')
    }

    console.log(`\n✨ Making ${targetUser.emailAddresses[0]?.emailAddress} an admin...`)

    // Update user metadata to set admin role
    await clerkClient.users.updateUserMetadata(targetUser.id, {
      publicMetadata: {
        role: 'admin'
      }
    })

    console.log('\n✅ Success! You are now an admin.')
    console.log('\n🚀 Next steps:')
    console.log('1. Sign out if you are currently signed in')
    console.log('2. Sign back in at /sign-in')
    console.log('3. You should now be redirected to /dashboard (not /portal)')
    console.log('\nIf you still go to /portal, try clearing your browser cookies for this site.')
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    console.log('\nPlease update your role manually in the Clerk Dashboard:')
    console.log('1. Go to https://dashboard.clerk.com')
    console.log('2. Navigate to Users')
    console.log('3. Click on your user')
    console.log('4. Edit Public Metadata')
    console.log('5. Set: { "role": "admin" }')
    process.exit(1)
  }
}

// Run the script
makeMeAdmin()