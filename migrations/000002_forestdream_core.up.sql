-- ForestDream core schema
create extension if not exists citext;
create extension if not exists "pgcrypto";

-- profiles: 1:1 with users, public alias
create table profiles (
  user_id uuid primary key references users(id) on delete cascade,
  alias citext unique not null,
  tier text not null default 'free' check (tier in ('free','premium')),
  premium_expires_at timestamptz,
  notifications_enabled boolean default false,
  bedtime_reminder time,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- themes catalog (read-only to clients)
create table themes (
  id text primary key,
  name text not null,
  description text,
  tier text not null check (tier in ('free','premium')),
  preview_key text,
  asset_keys jsonb not null,
  sort_order int default 0
);

-- custom mixes (premium)
create table custom_mixes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  elements jsonb not null,
  created_at timestamptz default now()
);
create index on custom_mixes (user_id);

-- enforce max 10 mixes per user
create or replace function enforce_mix_limit() returns trigger as $$
begin
  if (select count(*) from custom_mixes where user_id = new.user_id) >= 10 then
    raise exception 'mix_limit_exceeded';
  end if;
  return new;
end;
$$ language plpgsql;
create trigger custom_mixes_limit before insert on custom_mixes
  for each row execute function enforce_mix_limit();

-- sleep sessions
create table sleep_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  theme_id text references themes(id),
  custom_mix_id uuid references custom_mixes(id) on delete set null,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds int,
  disturbance_count int default 0,
  quality_score smallint,
  ended_reason text check (ended_reason in ('manual','alarm','force_close')),
  created_at timestamptz default now()
);
create index on sleep_sessions (user_id, started_at desc);

-- disturbance events (no audio, just event metadata)
create table disturbance_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sleep_sessions(id) on delete cascade,
  detected_at timestamptz not null,
  kind text,
  response_layer text
);
create index on disturbance_events (session_id);

-- leaderboard snapshots (materialized by API cron)
create table leaderboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('theme_usage','quality','streak')),
  computed_at timestamptz default now(),
  payload jsonb not null
);
create index on leaderboard_snapshots (kind, computed_at desc);

-- RLS
alter table profiles enable row level security;
alter table sleep_sessions enable row level security;
alter table disturbance_events enable row level security;
alter table custom_mixes enable row level security;
alter table themes enable row level security;
alter table leaderboard_snapshots enable row level security;

create policy profiles_self on profiles for all
  using (user_id = (current_setting('app.end_user_id', true))::uuid)
  with check (user_id = (current_setting('app.end_user_id', true))::uuid);
create policy profiles_public_alias on profiles for select using (true);

create policy sessions_self on sleep_sessions for all
  using (user_id = (current_setting('app.end_user_id', true))::uuid)
  with check (user_id = (current_setting('app.end_user_id', true))::uuid);

create policy events_self on disturbance_events for all using (
  session_id in (select id from sleep_sessions
                 where user_id = (current_setting('app.end_user_id', true))::uuid)
);

create policy mixes_self on custom_mixes for all
  using (user_id = (current_setting('app.end_user_id', true))::uuid)
  with check (user_id = (current_setting('app.end_user_id', true))::uuid);
create policy themes_read on themes for select using (true);
create policy leaderboard_read on leaderboard_snapshots for select using (true);

-- seed free themes
insert into themes (id, name, description, tier, asset_keys, sort_order) values
  ('rainforest','Rainforest','Lush canopy with distant birdsong and light rain','free','{"rain":"themes/rainforest/rain.m4a","birds":"themes/rainforest/birds.m4a"}',1),
  ('mediterranean','Mediterranean','Warm coastal breeze through olive groves','free','{"wind":"themes/mediterranean/wind.m4a","cicadas":"themes/mediterranean/cicadas.m4a"}',2),
  ('nordic','Nordic','Quiet pine forest with gentle snowfall','free','{"wind":"themes/nordic/wind.m4a","owl":"themes/nordic/owl.m4a"}',3),
  ('tropical_storm','Tropical Storm','Heavy rain with distant thunder','premium','{"rain":"themes/tropical_storm/rain.m4a","thunder":"themes/tropical_storm/thunder.m4a"}',4),
  ('alpine_meadow','Alpine Meadow','High meadow with cowbells and streams','premium','{"stream":"themes/alpine_meadow/stream.m4a","bells":"themes/alpine_meadow/bells.m4a"}',5),
  ('coastal_fog','Coastal Fog','Foghorn and soft surf','premium','{"surf":"themes/coastal_fog/surf.m4a","foghorn":"themes/coastal_fog/foghorn.m4a"}',6);
