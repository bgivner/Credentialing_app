import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // Verify admin authentication
    const { userId, sessionClaims } = await auth()
    
    if (!userId || sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, firstName, lastName, businessName, role } = await request.json()

    // Validate required fields
    if (!email || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, first name, and last name are required' },
        { status: 400 }
      )
    }

    // Create the user in Clerk with invitation
    const invitation = await clerkClient.invitations.createInvitation({
      emailAddress: email,
      publicMetadata: {
        role: role || 'client',
        businessName: businessName || null,
        invitedBy: userId,
        invitedAt: new Date().toISOString()
      },
      redirectUrl: role === 'admin' ? '/dashboard' : '/portal',
      notify: true, // Send email invitation
    })

    return NextResponse.json({
      success: true,
      invitationId: invitation.id,
      message: `Invitation sent to ${email}`
    })
  } catch (error: any) {
    console.error('Error creating invitation:', error)
    
    // Handle specific Clerk errors
    if (error.errors && error.errors[0]) {
      const clerkError = error.errors[0]
      if (clerkError.code === 'form_identifier_exists') {
        return NextResponse.json(
          { error: 'This email address is already registered' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to create invitation' },
      { status: 500 }
    )
  }
}