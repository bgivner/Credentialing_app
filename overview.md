# ABA Credentialing & Enrollment Management Platform

## Project Overview

Build a tech-enabled credentialing and enrollment management system for ABA (Applied Behavior Analysis) therapy providers expanding to new states. This is a **services business with automation**, not pure SaaS - we handle credentialing as a service while systematically building automation to improve margins over time.

## Business Model

- **Service:** Help ABA practices get credentialed with insurance payers in new states
- **Pricing:** $1,200-$2,200 per provider per payer
- **Timeline:** 60-120 days per credentialing engagement
- **Target Market:** BCBA-owned ABA practices expanding geographically
- **Wedge Strategy:** Credentialing → Billing Services → Full RCM Platform

## Core Problem We're Solving

ABA practices expanding to new states face:
- 90-120 day credentialing delays before they can bill insurance
- Complex, payer-specific application requirements
- High error rates (missing documents, incorrect forms)
- Need for persistent follow-up with payer credentialing departments
- CAQH re-attestation requirements (every 120 days)
- Multi-state complexity (different licenses, MCOs per state)

## MVP Feature Requirements

### Phase 1: Intake & Data Management (Build This First)

#### 1. Client Intake Form
A multi-step form to collect all information needed for credentialing:

**Section 1: Business Information**
- Business name
- Business entity type (LLC, S-Corp, Sole Proprietor)
- Current state(s) of operation
- Target expansion state(s)
- Business address (current state)
- Practice address in new state (if available)
- Phone, email, fax
- Tax ID (EIN or SSN)
- NPI - Individual (Type 1) and/or Group (Type 2)

**Section 2: Provider Information** (repeatable for multiple providers)
- Full legal name
- Date of birth
- SSN (encrypted storage)
- Email
- Phone
- BCBA certification number
- BCBA certification expiration date
- State license(s) - number, state, expiration
- Individual NPI (if different from business)

**Section 3: Target Payers** (checkboxes with priority ranking)
- State Medicaid
- Medicaid MCOs (dynamically shown based on target state)
- Commercial payers:
  - Aetna
  - Cigna
  - Blue Cross Blue Shield
  - UnitedHealthcare
  - Optum
  - Humana
  - Other (specify)

**Section 4: Current Status**
- Do you have CAQH ProView profile? (Yes/No)
- CAQH ID (if yes)
- Last attestation date (if known)
- Do you have professional liability insurance? (Yes/No)
- Insurance carrier name
- Policy number
- Coverage amounts ($1M/$3M standard)
- Expiration date
- Do you have general liability insurance? (Yes/No)

**Section 5: Work History** (repeatable, last 5-7 years)
- Employer name
- Position/title
- Start date
- End date (or "Present")
- Address
- Reason for leaving

**Section 6: Education**
- Institution name
- Degree type (Bachelor's, Master's, Doctoral)
- Field of study
- Graduation date
- Address of institution

**Section 7: Professional References** (3 required)
- Name
- Title/Credentials
- Relationship to applicant
- Phone
- Email

**Section 8: Document Uploads**
File upload fields for:
- BCBA certificate
- State license(s) - front and back
- Professional liability insurance certificate
- General liability insurance certificate (if applicable)
- W-9 form
- CV/Resume
- Diploma(s)
- Driver's license or passport
- Business license/registration
- EIN letter

**Section 9: Service Selection & Pricing**
- Package selection (Launch Package, Multi-State, Custom)
- Display calculated pricing
- Estimated timeline
- Payment terms acceptance

#### 2. Admin Dashboard

**Client Overview**
- List of all active clients
- Status badges: "Intake Complete", "Documents Pending", "In Progress", "Approved", "On Hold"
- Search and filter by name, state, status
- Sort by date added, target state, package type

**Individual Client View**
Tabs for each client:

**Tab 1: Client Info**
- Display all intake form data in organized sections
- Edit capability for each field
- Document preview/download
- Document status (Received, Pending, Approved, Needs Update)

**Tab 2: Payer Tracking**
Table with columns:
- Payer Name
- Status (Not Started, CAQH Setup, App Submitted, In Review, Approved, Denied)
- Application Date
- Expected Completion Date
- Last Follow-up Date
- Next Follow-up Date
- Notes
- Action buttons (Update Status, Add Note, Set Reminder)

**Tab 3: Timeline & Milestones**
- Visual timeline showing:
  - Intake completed
  - CAQH profile setup
  - Each payer application submitted
  - Follow-up calls/emails
  - Approvals received
  - Contract signed
- Automated milestone tracking

**Tab 4: Documents**
- All uploaded documents organized by category
- Upload additional documents
- Document version control
- Share documents with client (secure link)

**Tab 5: Communication Log**
- Email/call log with client
- Email/call log with payers
- Internal notes
- Automated reminders sent

**Tab 6: Billing**
- Package details
- Payment schedule
- Invoices sent
- Payments received
- Outstanding balance

#### 3. Payer Knowledge Base

**Payer Profiles Table**
Store information about each payer for quick reference:

Fields:
- Payer name
- Payer type (Commercial, Medicaid, MCO)
- States covered
- Portal URL
- Application type (Online Portal, PDF, Email)
- Typical timeline (days)
- Special requirements (notes field)
- Credentialing contact name
- Credentialing contact phone
- Credentialing contact email
- Portal login instructions
- Common rejection reasons
- Tips/notes from experience

**State-Specific MCO Lists**
- Link states to their active MCOs
- Auto-populate MCO options based on target state

Example:
- South Carolina → Molina Healthcare SC, Healthy Blue SC, Select Health SC, Absolute Total Care
- New Jersey → Horizon NJ Health, Amerigroup NJ, WellCare NJ, UnitedHealthcare Community Plan NJ

#### 4. Automation Readiness Features

**CAQH Re-Attestation Tracker**
- Automatic reminders 30, 14, 7 days before 120-day expiration
- Track last attestation date per provider
- Send email/SMS reminders to client
- Dashboard alert for admin

**Follow-Up Cadence System**
- Set default follow-up schedules per payer (e.g., Week 2, Week 4, Week 6, Week 8)
- Automated reminders for admin to make follow-up calls
- Log follow-up outcomes
- Adjust schedule based on payer responsiveness

**Document Checklist Generator**
- Auto-generate payer-specific document checklist based on:
  - Target state
  - Payer selected
  - Business entity type
- Mark items as complete/incomplete
- Alert when all items ready for submission

**Email Templates**
Store templates for:
- Client onboarding welcome
- Document request emails
- Status update emails
- Approval confirmation
- Payer follow-up emails

## Technical Stack Recommendations

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- React Hook Form (for intake form)
- Zod (form validation)

**Backend:**
- Supabase (PostgreSQL database)
- Supabase Auth (admin login)
- Supabase Storage (document uploads)
- Supabase Row Level Security

**Future Automation:**
- n8n workflows (hosted separately or embedded)
- Puppeteer/Playwright for browser automation
- Resend or SendGrid for transactional emails
- Twilio for SMS reminders (optional)

## Database Schema

### Tables

**clients**
```sql
id: uuid (primary key)
created_at: timestamp
business_name: text
business_entity_type: text
current_states: text[] (array)
target_states: text[] (array)
business_address: jsonb
practice_address_new_state: jsonb
phone: text
email: text
fax: text
tax_id: text (encrypted)
npi_individual: text
npi_group: text
package_type: text
total_price: decimal
status: text (intake_complete, in_progress, completed)
```

**providers**
```sql
id: uuid (primary key)
client_id: uuid (foreign key → clients.id)
full_name: text
date_of_birth: date
ssn: text (encrypted)
email: text
phone: text
bcba_cert_number: text
bcba_cert_expiration: date
state_licenses: jsonb[] (array of {state, number, expiration})
individual_npi: text
```

**target_payers**
```sql
id: uuid (primary key)
client_id: uuid (foreign key → clients.id)
payer_name: text
payer_type: text (medicaid, mco, commercial)
priority: integer
status: text (not_started, caqh_setup, app_submitted, in_review, approved, denied)
application_date: date
expected_completion_date: date
last_followup_date: date
next_followup_date: date
approval_date: date
notes: text
```

**documents**
```sql
id: uuid (primary key)
client_id: uuid (foreign key → clients.id)
provider_id: uuid (foreign key → providers.id, nullable)
document_type: text
file_name: text
file_path: text (Supabase Storage path)
file_size: integer
uploaded_at: timestamp
status: text (pending_review, approved, needs_update)
version: integer
```

**work_history**
```sql
id: uuid (primary key)
provider_id: uuid (foreign key → providers.id)
employer_name: text
position: text
start_date: date
end_date: date (nullable)
address: jsonb
reason_for_leaving: text
```

**education**
```sql
id: uuid (primary key)
provider_id: uuid (foreign key → providers.id)
institution_name: text
degree_type: text
field_of_study: text
graduation_date: date
institution_address: jsonb
```

**professional_references**
```sql
id: uuid (primary key)
provider_id: uuid (foreign key → providers.id)
name: text
title: text
relationship: text
phone: text
email: text
```

**payer_profiles** (Knowledge Base)
```sql
id: uuid (primary key)
payer_name: text
payer_type: text
states_covered: text[]
portal_url: text
application_type: text
typical_timeline_days: integer
special_requirements: text
credentialing_contact_name: text
credentialing_contact_phone: text
credentialing_contact_email: text
portal_login_instructions: text
common_rejection_reasons: text[]
tips_notes: text
```

**state_mcos** (Reference data)
```sql
id: uuid (primary key)
state: text
mco_name: text
mco_type: text
website: text
```

**timeline_events**
```sql
id: uuid (primary key)
client_id: uuid (foreign key → clients.id)
event_type: text (intake_complete, caqh_setup, app_submitted, followup, approval, etc.)
event_date: timestamp
payer_name: text (nullable)
description: text
created_by: text (admin user id)
```

**communication_log**
```sql
id: uuid (primary key)
client_id: uuid (foreign key → clients.id)
communication_type: text (email, call, sms, note)
direction: text (inbound, outbound, internal)
subject: text
message: text
related_payer: text (nullable)
created_at: timestamp
created_by: text (admin user id)
```

**email_templates**
```sql
id: uuid (primary key)
template_name: text
subject: text
body: text (supports variables like {{client_name}})
template_type: text (onboarding, document_request, status_update, etc.)
```

## User Stories

**As an admin, I want to:**
1. Send intake form link to new clients
2. View all submitted intake forms in one dashboard
3. Track credentialing progress for each payer per client
4. Set follow-up reminders so I don't miss calls
5. Upload/download client documents easily
6. Generate status update emails for clients
7. See which clients have CAQH profiles expiring soon
8. Store payer contact information for quick reference
9. Log all communications with payers and clients
10. Know exactly which documents are missing for each client

**As a client (future feature), I want to:**
1. Fill out intake form without creating an account
2. Upload documents securely
3. Receive email updates on my credentialing status
4. View my credentialing timeline
5. See which payers are approved

## MVP Scope (Build This First)

**Week 1-2:**
1. Supabase project setup
2. Database schema implementation
3. Basic Next.js app structure
4. Authentication (admin only for now)

**Week 3-4:**
5. Multi-step intake form
6. Form validation with Zod
7. Supabase integration for form submission
8. Document upload to Supabase Storage

**Week 5-6:**
9. Admin dashboard - client list view
10. Individual client detail page
11. Payer tracking table with status updates
12. Document management interface

**Week 7-8:**
13. Timeline/milestone tracker
14. Communication log
15. Basic email template system
16. CAQH re-attestation reminder system

## Future Automation Phases

**Phase 2: Semi-Automation (Month 3-4)**
- Email automation for client communications
- Automated reminder system for follow-ups
- CAQH expiration alerts
- Document completeness checker

**Phase 3: Browser Automation (Month 5-6)**
- CAQH ProView auto-fill (Puppeteer)
- Common payer portal form filling
- Status checking automation
- Document uploading automation

**Phase 4: AI-Powered (Month 7-12)**
- Document validation using Claude API
- Payer requirement extraction from PDFs
- Smart follow-up timing predictions
- Auto-generate payer-specific applications from CAQH data

## Key Features That Differentiate Us

1. **Payer-Specific Intelligence:** We learn each payer's quirks and build a knowledge base
2. **Proactive Follow-Up:** Automated reminders ensure nothing falls through cracks
3. **Document Validation:** Check completeness before submission
4. **Timeline Predictability:** Show clients exactly where they are in the process
5. **Multi-State Optimization:** Reuse documents across states, track state-specific requirements

## Design Principles

1. **Speed over perfection:** MVP should be functional, not beautiful
2. **Mobile-responsive:** Admin will use on phone during follow-up calls
3. **Data integrity:** Critical fields (SSN, Tax ID) must be encrypted
4. **Audit trail:** Track every status change, document upload, communication
5. **Scalable:** Design database for 100+ clients, not just 5

## Security Requirements

- Row Level Security on all Supabase tables
- Encrypted storage for SSN and Tax IDs
- Secure document upload (pre-signed URLs)
- Admin authentication required
- No client-facing login for MVP (future feature)
- HTTPS only
- Regular automated backups

## Success Metrics

**For the business:**
- Time to complete intake: <10 minutes
- Time to find client info: <30 seconds
- Follow-up adherence rate: >95%
- Document error rate: <5%
- Average credentialing time: 75 days (vs 120 industry standard)

**For automation:**
- Hours saved per client (start at 25hrs, reduce to 5hrs over 12 months)
- Percentage of workflow automated (track monthly)
- Error rate in automated submissions

## Brand/Naming

**Product Name Ideas:**
- Birdi Credentialing
- CredentialFlow
- PayerPath
- NetConnect
- TherapyPanel (credential panel = getting on insurance panels)

**Positioning:**
"Tech-enabled credentialing services for ABA practices expanding geographically"

## Domain Knowledge Context

**ABA Industry Specifics:**
- BCBAs (Board Certified Behavior Analysts) are the primary providers
- Autism insurance mandates exist in all 50 states
- Medicaid is huge revenue source (50-70% of clients)
- Each state has 3-6 Medicaid MCOs (Managed Care Organizations)
- Commercial payers: Aetna, Cigna, BCBS, United are top 4
- Average ABA practice: 2-5 BCBAs, 10-20 RBTs
- Typical expansion: Start in 1 state, expand to neighboring states

**Credentialing Process:**
1. Setup CAQH ProView (2-3 hours)
2. Submit applications to payers (30-60 min each)
3. Wait for payer review (30-90 days)
4. Follow up weekly (15 min per payer)
5. Handle document requests (varies)
6. Receive approval + contract
7. Begin billing

**Common Pain Points:**
- Missing documents delay everything
- CAQH expiration causes denials
- Each payer has different requirements
- No visibility into payer review status
- Forgetting to follow up = 30+ day delays

## Initial Client (Test Case)

We have a real client to test with:
- BCBA in North Carolina
- Expanding to South Carolina  
- Solo practitioner
- Wants: SC Medicaid + 3 commercial payers
- Timeline: ASAP

Use this as the test case for building features.

---

## Getting Started Prompt for Claude Code

"Build an MVP credentialing management platform for ABA therapy providers using Next.js 14, TypeScript, Supabase, and Tailwind CSS. 

Start with:
1. Supabase project setup with the database schema above
2. Multi-step intake form with all fields listed in 'Section 1-9'
3. Basic admin dashboard showing list of clients
4. Individual client view with payer tracking table

Focus on functionality over design. Use shadcn/ui components. Make it mobile-responsive. Prioritize data integrity and security."