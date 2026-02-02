import { SignIn } from '@clerk/nextjs'
import { Heart } from 'lucide-react'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
      <div className="max-w-md w-full">
        {/* Client Portal Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
            <Heart className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Client Portal
          </h1>
          <p className="text-gray-600">
            Access your credentialing progress
          </p>
        </div>

        {/* Clerk Sign In Component */}
        <SignIn 
          appearance={{
            elements: {
              formButtonPrimary: 'bg-green-600 hover:bg-green-700 text-white',
              card: 'shadow-xl bg-white',
              headerTitle: 'hidden',
              headerSubtitle: 'hidden',
              socialButtonsBlockButton: 'border-gray-300 hover:bg-gray-50',
              formFieldInput: 'border-gray-300 focus:ring-green-500 focus:border-green-500',
              footerActionLink: 'text-green-600 hover:text-green-700'
            }
          }}
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          forceRedirectUrl="/portal"
        />

        {/* Admin Login Link */}
        <div className="mt-6 text-center">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700 mb-2">
              Are you an administrator?
            </p>
            <a 
              href="/admin/login"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium underline"
            >
              Admin Login
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}