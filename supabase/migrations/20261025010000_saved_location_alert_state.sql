-- Track unhealthy-air email alerts for each saved location.
-- The scheduled server job uses the Supabase service role; users cannot read this table.
create table if not exists public.saved_location_alert_state (
  location_id uuid primary key references public.saved_locations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  is_unhealthy boolean not null default false,
  last_alert_at timestamptz,
  last_aqi integer,
  updated_at timestamptz not null default now()
);

create index if not exists saved_location_alert_state_user_idx
  on public.saved_location_alert_state (user_id);

alter table public.saved_location_alert_state enable row level security;
revoke all on public.saved_location_alert_state from anon, authenticated;
