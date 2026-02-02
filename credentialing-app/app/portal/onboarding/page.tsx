import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import IntakeFormClient from '@/components/IntakeFormClient'

export default async function OnboardingPage() {
  const { userId } = await auth()
  const user = await currentUser()
  
  if (!userId) {
    redirect('/sign-in')
  }

  // Check if client already exists in Supabase
  const supabase = await createClient()
  const { data: existingClient } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (existingClient) {
    redirect('/portal')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to Your Credentialing Portal
          </h1>
          <p className="mt-2 text-gray-600">
            Let's get started by collecting your information
          </p>
        </div>

        <IntakeFormClient 
          userId={userId} 
          userEmail={user?.emailAddresses?.[0]?.emailAddress || ''} 
        />
      </div>
    </div>
  )
}