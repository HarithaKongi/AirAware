-- AirAware saved locations: durable per-user storage with row-level security.
create extension if not exists pgcrypto;

create table if not exists public.saved_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  created_at timestamptz not null default now()
);

create index if not exists saved_locations_user_created_idx
  on public.saved_locations (user_id, created_at desc);

alter table public.saved_locations enable row level security;

drop policy if exists "Users can read their own saved locations" on public.saved_locations;
create policy "Users can read their own saved locations"
  on public.saved_locations for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can save their own locations" on public.saved_locations;
create policy "Users can save their own locations"
  on public.saved_locations for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own saved locations" on public.saved_locations;
create policy "Users can delete their own saved locations"
  on public.saved_locations for delete to authenticated
  using (auth.uid() = user_id);

grant select, insert, delete on public.saved_locations to authenticated;
