import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import InviteUserForm from '@/components/InviteUserForm'
import UsersList from '@/components/UsersList'

export default async function UsersManagementPage() {
  const { userId, sessionClaims } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  // Check if user is admin
  const userRole = sessionClaims?.metadata?.role as string
  if (userRole !== 'admin') {
    redirect('/portal')
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
        <p className="mt-2 text-sm text-gray-600">
          Invite and manage client access to the portal
        </p>
      </div>

      {/* Invite New User Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Invite New Client</h2>
        <InviteUserForm />
      </div>

      {/* Existing Users List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Existing Users</h2>
        </div>
        <UsersList />
      </div>
    </div>
  )
}