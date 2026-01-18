-- Enable required extensions
create extension if not exists "pgcrypto";

-- Helper function to stamp updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- User profiles
create table if not exists public.user_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  role text not null default 'customer' check (role in ('admin', 'customer')),
  full_name text,
  created_at timestamptz not null default now()
);

-- Reports
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.user_profiles (id) on delete cascade,
  platform text not null check (platform in ('facebook','instagram','tiktok','youtube','threads','website')),
  report_type text not null check (report_type in ('copyright','trademark','counterfeit','impersonator','other')),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  report_number text,
  account_page_name text not null,
  infringing_urls text[] not null,
  description text,
  form_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger reports_set_updated_at
before update on public.reports
for each row
execute procedure public.set_updated_at();

-- Audit logs
create table if not exists public.report_audit_logs (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  actor_id uuid not null references public.user_profiles (id) on delete cascade,
  action text not null check (action in ('created','approved','rejected','updated')),
  note text,
  created_at timestamptz not null default now()
);

-- Helper: admin checker (no recursion)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.user_profiles up
    where up.id = auth.uid()
      and up.role = 'admin'
  );
$$;

-- Row Level Security
alter table public.user_profiles enable row level security;
alter table public.reports enable row level security;
alter table public.report_audit_logs enable row level security;

-- user_profiles policies
create policy "Users can read own profile"
  on public.user_profiles
  for select
  using (auth.uid() = id);

create policy "Admins can read all profiles"
  on public.user_profiles
  for select
  using (is_admin());

create policy "Users can insert their profile"
  on public.user_profiles
  for insert
  with check (auth.uid() = id);

create policy "Users can update their profile"
  on public.user_profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Admins can update any profile"
  on public.user_profiles
  for update
  using (is_admin())
  with check (is_admin());

-- reports policies
create policy "Customers insert own reports"
  on public.reports
  for insert
  with check (customer_id = auth.uid());

create policy "Customers read own reports"
  on public.reports
  for select
  using (customer_id = auth.uid());

create policy "Admins read all reports"
  on public.reports
  for select
  using (is_admin());

create policy "Admins can update reports"
  on public.reports
  for update
  using (is_admin())
  with check (is_admin());

-- report_audit_logs policies
create policy "Admins read audit logs"
  on public.report_audit_logs
  for select
  using (is_admin());

create policy "Customers read audit logs for own reports"
  on public.report_audit_logs
  for select
  using (
    exists (
      select 1 from public.reports r
      where r.id = report_id
        and r.customer_id = auth.uid()
    )
  );

create policy "Admins insert audit logs"
  on public.report_audit_logs
  for insert
  with check (is_admin() and actor_id = auth.uid());

-- Indexes to speed up admin search/filter
create index if not exists idx_reports_platform on public.reports (platform);
create index if not exists idx_reports_report_type on public.reports (report_type);
create index if not exists idx_reports_status on public.reports (status);
create index if not exists idx_reports_report_number on public.reports (report_number);
create index if not exists idx_reports_customer_id on public.reports (customer_id);
create index if not exists idx_user_profiles_email on public.user_profiles (email);
