import { clerkClient } from '@clerk/nextjs/server'

/**
 * Script to check the current user's role
 */

async function checkUserRole() {
  console.log('🔍 Checking user roles...\n')

  try {
    // Get all users
    const users = await clerkClient().users.getUserList({
      orderBy: '-created_at',
      limit: 10
    })

    if (users.data.length === 0) {
      console.error('❌ No users found')
      process.exit(1)
    }

    console.log('Current users and their roles:')
    console.log('════════════════════════════════════════════════════════════════')

    users.data.forEach((user, index) => {
      const email = user.emailAddresses[0]?.emailAddress || 'No email'
      const role = user.publicMetadata?.role || 'NO ROLE SET'
      const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'No name'
      
      console.log(`${index + 1}. ${email}`)
      console.log(`   Name: ${name}`)
      console.log(`   Role: ${role}`)
      console.log(`   User ID: ${user.id}`)
      console.log(`   Public Metadata: ${JSON.stringify(user.publicMetadata)}`)
      console.log(`   Created: ${new Date(user.createdAt).toLocaleDateString()}`)
      console.log('   ────────────────────────────────────────────────────────────')
    })

    // Find users without admin role
    const usersWithoutRole = users.data.filter(user => !user.publicMetadata?.role)
    const admins = users.data.filter(user => user.publicMetadata?.role === 'admin')
    const clients = users.data.filter(user => user.publicMetadata?.role === 'client')

    console.log('\n📊 Summary:')
    console.log(`   Admins: ${admins.length}`)
    console.log(`   Clients: ${clients.length}`)
    console.log(`   Users without role: ${usersWithoutRole.length}`)

    if (usersWithoutRole.length > 0) {
      console.log('\n⚠️  Users without roles (defaulting to client):')
      usersWithoutRole.forEach(user => {
        console.log(`   - ${user.emailAddresses[0]?.emailAddress}`)
      })
    }

    if (admins.length === 0) {
      console.log('\n❌ No admin users found!')
      console.log('Run: npx tsx scripts/make-me-admin.ts')
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

// Run the script
checkUserRole()