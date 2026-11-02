-- Public prospect intake; private admin-only CRM access.
create table if not exists public.prospect_leads (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('accompagnement','guide')),
  full_name text not null check (char_length(full_name) between 2 and 160),
  email text not null check (char_length(email) <= 254),
  phone text not null check (char_length(phone) between 6 and 40),
  company text check (company is null or char_length(company) <= 200),
  needs text check (needs is null or char_length(needs) <= 4000),
  privacy_consent boolean not null default false check (privacy_consent = true),
  stage text not null default 'Nouveau',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists prospect_leads_created_at_idx on public.prospect_leads(created_at desc);
create index if not exists prospect_leads_email_idx on public.prospect_leads(lower(email));
alter table public.prospect_leads enable row level security;
revoke all on public.prospect_leads from anon, authenticated;
grant insert on public.prospect_leads to anon, authenticated;
grant select, update on public.prospect_leads to authenticated;
drop policy if exists "Visitors can submit prospect requests" on public.prospect_leads;
create policy "Visitors can submit prospect requests" on public.prospect_leads
  for insert to anon, authenticated with check (
    source in ('accompagnement','guide') and privacy_consent = true
    and char_length(full_name) between 2 and 160
    and char_length(email) <= 254 and char_length(phone) between 6 and 40
    and (company is null or char_length(company) <= 200)
    and (needs is null or char_length(needs) <= 4000)
    and stage = 'Nouveau'
  );
drop policy if exists "Admins can read prospect requests" on public.prospect_leads;
create policy "Admins can read prospect requests" on public.prospect_leads
  for select to authenticated using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "Admins can update prospect requests" on public.prospect_leads;
create policy "Admins can update prospect requests" on public.prospect_leads
  for update to authenticated using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
