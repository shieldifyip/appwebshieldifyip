# Shieldify IP – Takedown Portal

New Next.js 16 build (webapp3) with Supabase for auth/Postgres/RLS, Tailwind + shadcn-style UI, and customer/admin portals.

## Tech stack
- Next.js 16 (App Router, TS)
- Supabase (Auth, Postgres, Storage) with RLS
- TailwindCSS + shadcn/ui primitives
- React Hook Form + Zod

## Prerequisites
- Node.js 18+ and npm
- Supabase project

## Setup
1) Copy env:
```bash
cp .env.example .env.local
# fill NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
# optional: SUPABASE_SERVICE_ROLE_KEY for server-side scripts only
```

2) Install & run:
```bash
npm install
npm run dev
```
Visit http://localhost:3000

3) Supabase schema & RLS:
Run `supabase/migrations/001_init.sql` in Supabase SQL editor.

4) Users & roles (no self-register)
- Only `/login` is exposed. Create users via Supabase Auth dashboard/API.
- Ensure each user has a row in `public.user_profiles` (app upserts on first login).
- Promote admin:
```sql
update public.user_profiles
set role = 'admin'
where id = 'your-admin-uuid';
```
Admins go to `/admin`; customers go to `/app`. Only admins can set `report_number` on approval.

5) Optional seed
Edit UUIDs in `supabase/seed.sql` to real `auth.users.id` then run in SQL editor.

## Features
- Customer: dashboard (/app), create report wizard (/app/reports/new), detail view with audit log.
- Admin: list with filters/search (/admin), detail with Approve (requires report_number), Reject, Mark pending, audit logs.
- Platforms: Facebook, Instagram, TikTok, YouTube, Threads, Website.
- Report types: Copyright, Trademark, Counterfeit, Impersonator, Other.
- `date_of_infringement` removed; use `created_at`.
- RLS ensures customers only see their own data; report_number only set by admin.

## Troubleshooting
- Permission denied: ensure migration ran and user_profiles row exists.
- Admin redirect to /app: check role in `user_profiles`.
- Missing report_number: only set via admin Approve dialog.
- Invalid ID/404: verify URL `/app/reports/<uuid>` or `/admin/reports/<uuid>` and that report exists for the user.

## Scripts
- `npm run dev` – start dev server
- `npm run lint` – eslint
