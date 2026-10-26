-- Thomas × Camille site configuration and public media
-- Apply in the Supabase SQL Editor for this project.
create table if not exists public.site_settings (
  id text primary key check (id = 'main'),
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;
revoke all on public.site_settings from anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant insert, update on public.site_settings to authenticated;

drop policy if exists "Public can read published site settings" on public.site_settings;
create policy "Public can read published site settings"
  on public.site_settings for select to anon, authenticated
  using (id = 'main');

drop policy if exists "Admins can insert site settings" on public.site_settings;
create policy "Admins can insert site settings"
  on public.site_settings for insert to authenticated
  with check (
    id = 'main'
    and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

drop policy if exists "Admins can update site settings" on public.site_settings;
create policy "Admins can update site settings"
  on public.site_settings for update to authenticated
  using (
    id = 'main'
    and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  with check (
    id = 'main'
    and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

insert into public.site_settings (id, settings)
values ('main', '{}'::jsonb)
on conflict (id) do nothing;

-- Publicly readable image bucket; only admin-role users can write.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-media', 'site-media', true, 10485760, array['image/jpeg','image/png','image/webp','image/gif','image/svg+xml','image/avif'])
on conflict (id) do update set public = true, file_size_limit = 10485760;

drop policy if exists "Public can read site media" on storage.objects;
create policy "Public can read site media"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'site-media');

drop policy if exists "Admins can upload site media" on storage.objects;
create policy "Admins can upload site media"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'site-media'
    and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

drop policy if exists "Admins can update site media" on storage.objects;
create policy "Admins can update site media"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'site-media'
    and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  with check (
    bucket_id = 'site-media'
    and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

drop policy if exists "Admins can delete site media" on storage.objects;
create policy "Admins can delete site media"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'site-media'
    and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
