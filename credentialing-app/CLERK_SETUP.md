# Clerk Authentication Setup Guide

## Overview
This application uses Clerk for authentication, providing separate access for:
- **Admins**: Full access to dashboard and user management
- **Clients**: Access to their portal for credentialing management

## 1. Clerk Dashboard Setup

### Get Your API Keys
1. Go to your Clerk Dashboard: https://dashboard.clerk.com
2. Select your application
3. Navigate to "API Keys" in the sidebar
4. Copy your keys:
   - **Publishable Key**: Starts with `pk_test_` or `pk_live_`
   - **Secret Key**: Starts with `sk_test_` or `sk_live_`

### Update Environment Variables
Edit `.env.local` and replace the placeholder values:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_actual_publishable_key_here
CLERK_SECRET_KEY=your_actual_secret_key_here
```

## 2. Configure Clerk Settings

### Set Up User Metadata
In Clerk Dashboard → Users → Metadata:

1. **Public Metadata Schema**:
   ```json
   {
     "role": "client" | "admin",
     "businessName": "string (optional)"
   }
   ```

2. **Private Metadata** (optional):
   ```json
   {
     "supabaseClientId": "uuid",
     "invitedBy": "clerk_user_id",
     "invitedAt": "iso_date_string"
   }
   ```

### Configure Email Templates
1. Go to Clerk Dashboard → Customization → Email templates
2. Customize the invitation email template
3. Add your branding and messaging

### Set Up Redirects
In Clerk Dashboard → Paths:
- Sign in URL: `/sign-in`
- Sign up URL: `/sign-up` (disabled - redirect to sign-in)
- After sign in URL: `/dashboard` (for admins) or `/portal` (for clients)

## 3. Database Migration

Run the Clerk migration to update your database:

```bash
# Apply the Clerk auth migration
npx supabase db push --file supabase/migrations/005_clerk_auth_update.sql
```

## 4. User Management Flow

### Creating Your First Admin User

1. **Via Clerk Dashboard**:
   - Go to Users → Create User
   - Enter email and password
   - After creation, click on the user
   - Edit Public Metadata and add: `{ "role": "admin" }`

2. **Via Code** (one-time setup script):
   ```typescript
   // scripts/create-admin.ts
   import { clerkClient } from '@clerk/nextjs/server'

   async function createAdmin() {
     const user = await clerkClient.users.createUser({
       emailAddress: 'admin@example.com',
       password: 'SecurePassword123!',
       publicMetadata: {
         role: 'admin'
       }
     })
     console.log('Admin created:', user.id)
   }
   ```

### Inviting Client Users (Admin Only)

1. Log in as admin
2. Navigate to Dashboard → Users
3. Click "Invite New Client"
4. Fill in client details
5. Client receives email invitation
6. Client clicks link and sets password
7. Client is redirected to portal

## 5. Authentication Flow

### Admin Flow:
```
/sign-in → Check role → /dashboard
```

### Client Flow:
```
Invitation Email → Set Password → /sign-in → Check role → /portal
```

### Middleware Protection:
- `/dashboard/*` - Admin only
- `/portal/*` - Clients only
- `/api/admin/*` - Admin only
- `/sign-in` - Public
- `/` - Public landing page

## 6. Testing the Setup

### Test Admin Access:
1. Sign in with admin credentials
2. Should redirect to `/dashboard`
3. Can access user management at `/dashboard/users`
4. Can invite new clients

### Test Client Access:
1. Create invitation as admin
2. Check email for invitation
3. Set password via invitation link
4. Sign in with new credentials
5. Should redirect to `/portal`
6. Cannot access `/dashboard`

## 7. API Integration

### Getting User Info in Server Components:
```typescript
import { auth, currentUser } from '@clerk/nextjs/server'

export default async function Page() {
  const { userId } = await auth()
  const user = await currentUser()
  const role = user?.publicMetadata?.role
  // Use userId for database queries
}
```

### Getting User Info in Client Components:
```typescript
import { useAuth, useUser } from '@clerk/nextjs'

export default function Component() {
  const { userId, isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  const role = user?.publicMetadata?.role
  // Use in client-side logic
}
```

## 8. Troubleshooting

### Common Issues:

1. **"Unauthorized" errors**:
   - Check that Clerk keys are correctly set in `.env.local`
   - Ensure user has correct role in publicMetadata

2. **Redirect loops**:
   - Check middleware.ts configuration
   - Verify role assignments in Clerk Dashboard

3. **Invitations not sending**:
   - Check email settings in Clerk Dashboard
   - Verify SMTP configuration if using custom domain

4. **Database connection issues**:
   - Run migration script
   - Check Supabase connection string
   - Verify RLS policies are disabled (handled by Clerk now)

## 9. Production Checklist

- [ ] Use production Clerk keys (`pk_live_` and `sk_live_`)
- [ ] Configure custom domain in Clerk
- [ ] Set up proper email templates with branding
- [ ] Enable 2FA for admin accounts
- [ ] Configure webhook endpoints if needed
- [ ] Set up proper CORS settings
- [ ] Review and test all user flows
- [ ] Monitor Clerk dashboard for failed sign-ins

## 10. Support

- Clerk Documentation: https://clerk.com/docs
- Clerk Support: https://clerk.com/support
- Application Issues: Check GitHub repository

---

**Note**: Never commit your actual API keys to version control. Always use environment variables.