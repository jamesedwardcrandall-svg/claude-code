# Client Dashboard — Advisory Portal

A Next.js + Supabase dashboard for CPA/financial advisory firms serving commercial real estate brokers.

## Tech Stack

- **Next.js 16** (App Router) — React framework
- **Supabase** — Auth, database, and row-level security
- **Tailwind CSS 3** — Styling
- **TypeScript** — Type safety
- **Vercel** — Deployment target (zero-maintenance)

## Getting Started

### 1. Create a Supabase Project

Go to [supabase.com](https://supabase.com) and create a new project.

### 2. Run the Database Migration

Open the SQL Editor in your Supabase dashboard and run the contents of:

```
supabase/migrations/001_initial_schema.sql
```

This creates all tables, RLS policies, and seeds 3 demo clients.

### 3. Set Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Get the values from: Supabase Dashboard > Settings > API

### 4. Create an Admin User

In Supabase Dashboard > Authentication > Users, create a new user with:
- Your email and password
- User metadata: `{"role": "admin"}`

### 5. Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in.

### 6. (Optional) Set Up Client Access

To give a client portal access:
1. Create a Supabase auth user for the client (with their email from the clients table)
2. In the admin dashboard, update the client record's `user_id` to match their auth user ID
3. Or: update the `user_id` directly in the Supabase table editor

## Project Structure

```
app/
  login/page.tsx          — Login page
  page.tsx                — Root redirect (admin → /admin, client → /dashboard)
  admin/
    layout.tsx            — Admin sidebar layout
    page.tsx              — Client pipeline view
    clients/[id]/page.tsx — Client detail with all CRUD sections
  dashboard/
    layout.tsx            — Client header layout
    page.tsx              — Client dashboard (7 read-only views)
  auth/callback/route.ts  — OAuth callback handler
lib/
  supabase/client.ts      — Browser Supabase client
  supabase/server.ts      — Server Supabase client
  types.ts                — TypeScript interfaces
middleware.ts             — Auth & role-based route protection
supabase/
  migrations/             — SQL schema, RLS policies, seed data
```

## Features

### Admin Dashboard
- Client pipeline with search, add/delete
- Per-client management: services, tasks, financials, milestones, projections, tax deadlines
- All data entry via admin UI

### Client Dashboard (read-only)
1. Tax Savings vs W-2
2. S-Corp Salary vs Distributions
3. YTD Income & Estimated Taxes
4. Entity Setup Milestones
5. Projected Income & Expenses
6. Tax as % of Commission Income
7. Upcoming Tax Due Dates

## Deploy to Vercel

1. Push to GitHub
2. Import in Vercel
3. Add environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
4. Deploy
