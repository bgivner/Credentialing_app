import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { CheckCircle, Clock, FileText, Upload, AlertCircle, User } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function ClientPortalDashboard() {
  const { userId } = await auth()
  const user = await currentUser()
  
  if (!userId) {
    redirect('/sign-in')
  }

  // Get client data from Supabase using Clerk user ID
  const supabase = await createClient()
  
  const { data: client } = await supabase
    .from('clients')
    .select(`
      *,
      providers (count),
      documents (count),
      target_payers (
        id,
        payer_name,
        status,
        payer_type
      )
    `)
    .eq('user_id', userId)
    .single()

  if (!client) {
    redirect('/portal/onboarding')
  }

  // Get document types and check which are uploaded
  const { data: documents } = await supabase
    .from('documents')
    .select('document_type, status')
    .eq('client_id', client.id)

  const { data: requiredDocs } = await supabase
    .from('document_types')
    .select('*')
    .eq('required', true)
    .order('sort_order')

  // Calculate completion status
  const uploadedDocTypes = documents?.map(d => d.document_type) || []
  const requiredDocTypes = requiredDocs?.map(d => d.name) || []
  const missingDocs = requiredDocTypes.filter(doc => !uploadedDocTypes.includes(doc))
  const completionPercentage = requiredDocTypes.length > 0 
    ? Math.round((uploadedDocTypes.filter(d => requiredDocTypes.includes(d)).length / requiredDocTypes.length) * 100)
    : 0

  // Status indicators
  const statusConfig = {
    'intake_incomplete': { color: 'yellow', icon: Clock, label: 'Intake Incomplete' },
    'intake_complete': { color: 'blue', icon: CheckCircle, label: 'Intake Complete' },
    'in_progress': { color: 'indigo', icon: Clock, label: 'In Progress' },
    'completed': { color: 'green', icon: CheckCircle, label: 'Completed' },
    'on_hold': { color: 'gray', icon: AlertCircle, label: 'On Hold' }
  }

  const status = statusConfig[client.status as keyof typeof statusConfig] || statusConfig['intake_incomplete']

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.firstName || 'Client'}!
        </h1>
        <p className="mt-2 text-gray-600">
          Track your credentialing progress and manage your documents
        </p>
      </div>

      {/* Status Overview */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Credentialing Status</h2>
            <div className="mt-2 flex items-center">
              <status.icon className={`h-5 w-5 text-${status.color}-500 mr-2`} />
              <span className={`text-${status.color}-700 font-medium`}>
                {status.label}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">{completionPercentage}%</div>
            <div className="text-sm text-gray-500">Documentation Complete</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {missingDocs.length > 0 && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>Action Required:</strong> {missingDocs.length} required document{missingDocs.length > 1 ? 's' : ''} missing
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Link
          href="/portal/intake"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <FileText className="h-8 w-8 text-blue-500 mb-2" />
              <h3 className="font-semibold text-gray-900">Intake Form</h3>
              <p className="text-sm text-gray-600 mt-1">
                {client.status === 'intake_incomplete' ? 'Complete your intake' : 'View or update info'}
              </p>
            </div>
            <span className="text-gray-400">→</span>
          </div>
        </Link>

        <Link
          href="/portal/documents"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <Upload className="h-8 w-8 text-green-500 mb-2" />
              <h3 className="font-semibold text-gray-900">Documents</h3>
              <p className="text-sm text-gray-600 mt-1">
                Upload required documents
              </p>
            </div>
            <span className="text-gray-400">→</span>
          </div>
        </Link>

        <Link
          href="/portal/profile"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <User className="h-8 w-8 text-purple-500 mb-2" />
              <h3 className="font-semibold text-gray-900">Profile</h3>
              <p className="text-sm text-gray-600 mt-1">
                Manage your information
              </p>
            </div>
            <span className="text-gray-400">→</span>
          </div>
        </Link>
      </div>

      {/* Payer Status */}
      {client.target_payers && client.target_payers.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payer Credentialing Status</h2>
          <div className="space-y-3">
            {client.target_payers.map((payer: any) => (
              <div key={payer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div>
                  <span className="font-medium text-gray-900">{payer.payer_name}</span>
                  <span className="ml-2 text-xs text-gray-500">({payer.payer_type})</span>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  payer.status === 'approved' 
                    ? 'bg-green-100 text-green-800'
                    : payer.status === 'in_review'
                    ? 'bg-yellow-100 text-yellow-800'
                    : payer.status === 'app_submitted'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {payer.status?.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div className="mt-6 bg-blue-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Next Steps</h3>
        <ol className="space-y-2 text-sm text-gray-700">
          {client.status === 'intake_incomplete' && (
            <li className="flex items-start">
              <span className="font-bold mr-2">1.</span>
              Complete your intake form with all required information
            </li>
          )}
          {missingDocs.length > 0 && (
            <li className="flex items-start">
              <span className="font-bold mr-2">2.</span>
              Upload the {missingDocs.length} missing required document{missingDocs.length > 1 ? 's' : ''}
            </li>
          )}
          <li className="flex items-start">
            <span className="font-bold mr-2">3.</span>
            Keep your CAQH profile updated (re-attest every 120 days)
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-2">4.</span>
            Respond promptly to any requests from our team
          </li>
        </ol>
      </div>
    </div>
  )
}