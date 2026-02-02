# ABA Credentialing Platform Setup Guide

## Prerequisites
- Node.js 20+ (currently using v19.5.0 - upgrade recommended)
- Supabase account (free tier works)
- Vercel account (for deployment)

## Supabase Setup

### 1. Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Save your project URL and anon key

### 2. Configure Environment Variables
Update `.env.local` with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Run Database Migrations
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Run the query to create all tables and initial data

### 4. Set Up Authentication
1. In Supabase dashboard, go to Authentication > Providers
2. Enable Email provider
3. Configure email templates as needed

### 5. Storage Setup
1. Go to Storage in Supabase dashboard
2. Create a new bucket called "documents"
3. Set it to private (authenticated users only)

## Local Development

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
/app
  /auth            - Authentication pages (login, signup)
  /dashboard       - Admin dashboard
    /clients       - Client management
    /intake        - Intake forms
  /api            - API routes
  
/components
  /ui             - shadcn/ui components
  /forms          - Form components
  
/lib
  /supabase       - Supabase client configuration
  /utils          - Utility functions
  
/supabase
  /migrations     - Database schema SQL files
```

## Features Implemented

✅ Next.js 14 with App Router
✅ TypeScript configuration
✅ Tailwind CSS with shadcn/ui
✅ Supabase integration
✅ Database schema with all required tables
✅ Authentication setup
✅ Middleware for session management

## Next Steps

1. Create admin user in Supabase Auth
2. Build intake form components
3. Implement client dashboard views
4. Add document upload functionality
5. Create payer tracking interface

## Testing Credentials

For local development, create a test admin user:
1. Go to Supabase Dashboard > Authentication > Users
2. Click "Invite User"
3. Use a test email address

## Deployment to Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## Security Notes

- Never commit `.env.local` to version control
- Use Row Level Security (RLS) policies in production
- Encrypt sensitive data (SSN, Tax ID) at application level
- Regular backups of database

## Support

For issues or questions about the setup, please refer to:
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)