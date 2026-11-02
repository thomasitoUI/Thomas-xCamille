-- Gestion des administrateurs Thomas × Camille
create table if not exists public.team_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'admin' check (role = 'admin'),
  status text not null default 'active' check (status in ('active', 'invited', 'suspended')),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.team_members enable row level security;
revoke all on public.team_members from anon, authenticated;
grant select on public.team_members to authenticated;

drop policy if exists "Admins can read team members" on public.team_members;
create policy "Admins can read team members"
  on public.team_members for select to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create index if not exists team_members_status_role_idx
  on public.team_members (status, role);
