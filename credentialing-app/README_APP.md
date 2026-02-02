# ABA Credentialing Management Platform

A comprehensive credentialing and enrollment management system for ABA (Applied Behavior Analysis) therapy providers expanding to new states.

## Features

- ✅ **Client Management**: Track and manage multiple ABA practice clients
- ✅ **Multi-Step Intake Forms**: Streamlined data collection process
- ✅ **Provider Tracking**: Manage provider credentials and certifications  
- ✅ **Payer Management**: Track credentialing status with insurance payers
- ✅ **Document Storage**: Secure document upload and management
- ✅ **Timeline Tracking**: Monitor credentialing progress and milestones
- ✅ **Authentication**: Secure admin access with Supabase Auth

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Lucide Icons
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Forms**: React Hook Form, Zod validation
- **Deployment**: Vercel

## Quick Start

### Prerequisites

- Node.js 20+ (currently v19.5.0 - upgrade recommended)
- Supabase account (free tier works)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure Supabase:
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Copy your project URL and keys

3. Set up environment variables:
   - Update `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

4. Run database migrations:
   - Go to Supabase SQL Editor
   - Copy contents of `supabase/migrations/001_initial_schema.sql`
   - Execute to create all tables

5. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
/app
  /auth            - Authentication pages
  /dashboard       - Admin dashboard
    /clients       - Client management
    /intake        - Multi-step intake forms
  /api            - API routes
  
/components
  /ui             - Reusable UI components
  /forms          - Form components
  
/lib
  /supabase       - Database client configuration
  /utils          - Utility functions
  
/supabase
  /migrations     - Database schema SQL files
```

## Key Features Walkthrough

### 1. Authentication
- Admin login at `/auth/login`
- Protected dashboard routes
- Session management with Supabase Auth

### 2. Client Intake
- Multi-step form at `/dashboard/intake`
- Collects business and provider information
- Validates and saves to database

### 3. Client Management
- View all clients at `/dashboard/clients`
- Track status and credentialing progress
- Filter and search capabilities

### 4. Dashboard
- Overview statistics
- Recent client activity
- Quick access to key features

## Database Schema

The platform uses a comprehensive schema including:
- `clients` - Business information
- `providers` - BCBA provider details
- `target_payers` - Insurance payer tracking
- `documents` - File management
- `timeline_events` - Progress tracking
- And more...

See `supabase/migrations/001_initial_schema.sql` for full schema.

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project to Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Security

- Row Level Security (RLS) enabled on all tables
- Encrypted sensitive data (SSN, Tax IDs)
- Secure file uploads with Supabase Storage
- Authentication required for all dashboard routes

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run production build
npm run start

# Run linting
npm run lint
```

## Support

For detailed setup instructions, see `SETUP.md`

## License

Private - All rights reserved