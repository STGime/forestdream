-- Rollback: forestdream_core
drop table if exists leaderboard_snapshots cascade;
drop table if exists disturbance_events cascade;
drop table if exists sleep_sessions cascade;
drop table if exists custom_mixes cascade;
drop function if exists enforce_mix_limit();
drop table if exists themes cascade;
drop table if exists profiles cascade;
