import { redirect } from 'next/navigation'

// Disable public sign-ups - only admin-invited users can access
export default function SignUpPage() {
  redirect('/sign-in')
}