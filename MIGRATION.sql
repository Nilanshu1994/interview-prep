-- Safe migration — drops existing policies before recreating them
-- Run this in Supabase SQL Editor

-- 1. Add 'tips' column to questions (safe if already exists)
alter table questions add column if not exists tips jsonb default '[]'::jsonb;

-- 2. JD sessions table
create table if not exists jd_sessions (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  jd_text    text not null,
  analysis   jsonb,
  questions  jsonb,
  created_at timestamptz default now()
);
alter table jd_sessions enable row level security;
drop policy if exists "allow all" on jd_sessions;
create policy "allow all" on jd_sessions for all using (true) with check (true);

-- 3. Comparisons table (drop + recreate policy safely)
create table if not exists comparisons (
  id         uuid primary key default gen_random_uuid(),
  topic_a    text not null,
  topic_b    text not null,
  data       jsonb not null,
  created_at timestamptz default now(),
  unique(topic_a, topic_b)
);
alter table comparisons enable row level security;
drop policy if exists "allow all" on comparisons;
create policy "allow all" on comparisons for all using (true) with check (true);
