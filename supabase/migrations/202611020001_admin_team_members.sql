-- Permettre la suppression définitive d'un compte Auth et de sa ligne d'équipe associée.
alter table public.team_members
  drop constraint if exists team_members_user_id_fkey;

alter table public.team_members
  add constraint team_members_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

create index if not exists team_members_status_role_idx
  on public.team_members (status, role);
