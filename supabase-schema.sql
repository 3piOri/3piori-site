create table if not exists public.sets (
  id text primary key,
  title text not null,
  subtitle text not null default '',
  published_at date not null default current_date,
  duration_label text not null default '01:00:00',
  genre text not null default 'Electronic mix',
  cover_url text not null,
  cover_path text,
  audio_url text not null default '',
  audio_key text,
  featured boolean not null default false,
  published boolean not null default true
);

alter table public.sets add column if not exists cover_path text;
alter table public.sets add column if not exists audio_key text;
alter table public.sets alter column audio_url set default '';
alter table public.sets enable row level security;

create table if not exists public.site_settings (
  id boolean primary key default true check (id),
  bio text not null default '',
  artist_image_url text not null default '',
  artist_image_path text not null default '',
  contact_email text not null default 'booking@3piori.com',
  instagram_url text not null default '',
  soundcloud_url text not null default '',
  mixcloud_url text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.site_settings add column if not exists artist_image_path text not null default '';
insert into public.site_settings (id) values (true) on conflict (id) do nothing;
alter table public.site_settings enable row level security;

create table if not exists public.site_admins (
  email text primary key
);
alter table public.site_admins enable row level security;

create or replace function public.is_site_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.site_admins
    where lower(email) = lower(auth.jwt() ->> 'email')
  );
$$;
revoke all on function public.is_site_admin() from public;
grant execute on function public.is_site_admin() to anon, authenticated;

drop policy if exists "Public can read published sets" on public.sets;
drop policy if exists "Admins can read all sets" on public.sets;
drop policy if exists "Admins can insert sets" on public.sets;
drop policy if exists "Admins can update sets" on public.sets;
drop policy if exists "Admins can delete sets" on public.sets;
create policy "Public can read published sets" on public.sets
  for select using (published = true or public.is_site_admin());
create policy "Admins can insert sets" on public.sets
  for insert with check (public.is_site_admin());
create policy "Admins can update sets" on public.sets
  for update using (public.is_site_admin()) with check (public.is_site_admin());
create policy "Admins can delete sets" on public.sets
  for delete using (public.is_site_admin());

drop policy if exists "Public can read site settings" on public.site_settings;
drop policy if exists "Admins can update site settings" on public.site_settings;
create policy "Public can read site settings" on public.site_settings
  for select using (true);
create policy "Admins can update site settings" on public.site_settings
  for all using (public.is_site_admin()) with check (public.is_site_admin());
grant select on public.site_settings to anon, authenticated;
grant insert, update, delete on public.site_settings to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('covers', 'covers', true, 10485760, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public = true;

drop policy if exists "Public can view covers" on storage.objects;
drop policy if exists "Admins can manage covers" on storage.objects;
create policy "Public can view covers" on storage.objects
  for select using (bucket_id = 'covers');
create policy "Admins can manage covers" on storage.objects
  for all using (bucket_id = 'covers' and public.is_site_admin())
  with check (bucket_id = 'covers' and public.is_site_admin());

-- Add the administrator's Supabase Auth email after running this schema:
-- insert into public.site_admins (email) values ('you@example.com');
-- The administrator must also exist in Supabase Auth with email/password sign-in enabled.

insert into public.sets (id,title,subtitle,published_at,duration_label,genre,cover_url,audio_url,featured,published)
values ('001','ORION / 001','A journey through deep space','2026-11-19','01:00:00','Electronic mix','/covers/orion-001.svg','',true,true)
on conflict (id) do nothing;
