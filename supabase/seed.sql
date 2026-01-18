-- Replace the UUIDs with real auth user IDs from your Supabase project
-- Run after creating users via the Auth dashboard or API
insert into public.user_profiles (id, email, full_name, role)
values
  ('00000000-0000-0000-0000-000000000001', 'demo.admin@example.com', 'Demo Admin', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'demo.customer@example.com', 'Demo Customer', 'customer')
on conflict (id) do update set email = excluded.email, full_name = excluded.full_name, role = excluded.role;

-- Optional sample report for the demo customer
insert into public.reports (
  customer_id,
  platform,
  report_type,
  status,
  account_page_name,
  infringing_urls,
  description,
  form_payload
) values (
  '00000000-0000-0000-0000-000000000002',
  'facebook',
  'copyright',
  'pending',
  'Fake Page',
  array['https://facebook.com/fake-page'],
  'Copied our marketing copy and product photos.',
  '{"work_description": "Original marketing copy"}'
);
