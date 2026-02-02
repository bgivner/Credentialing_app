import { auth, currentUser } from '@clerk/nextjs/server'
import { UserButton } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FileText, Upload, User, Home } from 'lucide-react'

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  const user = await currentUser()

  if (!userId) {
    redirect('/sign-in')
  }

  // Get client info from Supabase using Clerk user ID
  const supabase = await createClient()
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Credentialing Portal</h1>
              {client && (
                <span className="ml-4 text-sm text-gray-600">
                  {client.business_name}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user?.emailAddresses?.[0]?.emailAddress}
              </span>
              <UserButton afterSignOutUrl="/sign-in" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Sidebar - Only show if client exists */}
        {client && (
          <nav className="w-64 bg-white shadow-sm">
            <div className="p-4 space-y-2">
              <Link
                href="/portal"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
              >
                <Home className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/portal/intake"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
              >
                <FileText className="h-5 w-5" />
                <span>Intake Form</span>
              </Link>
              <Link
                href="/portal/documents"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
              >
                <Upload className="h-5 w-5" />
                <span>Documents</span>
              </Link>
              <Link
                href="/portal/profile"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
              >
                <User className="h-5 w-5" />
                <span>Profile</span>
              </Link>
            </div>
          </nav>
        )}

        {/* Main Content */}
        <main className={`flex-1 p-8 ${!client ? 'max-w-4xl mx-auto w-full' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  )
}