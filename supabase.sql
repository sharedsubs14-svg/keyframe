-- Run this once in Supabase → SQL Editor. It creates the two tables the backend uses.
create table if not exists public.users (
  id uuid primary key,
  email text,
  name text,
  created_at timestamptz default now()
);
create table if not exists public.reveals (
  user_id uuid not null,
  email text,
  day date not null,
  count int not null default 0,
  primary key (user_id, day)
);
-- Lock both tables so only the backend (service key) can touch them.
alter table public.users enable row level security;
alter table public.reveals enable row level security;

-- ============ DAILY FRAME wall (added later; safe to run again) ============
-- Every posted frame. user_id is kept only to enforce the daily limit and reports; it is never shown.
create table if not exists public.entries (
  id uuid primary key,
  day date not null,
  user_id uuid not null,
  img_path text not null,
  tile_path text not null,
  w int, h int,
  model text,
  slop int,
  slate jsonb,
  lines jsonb,
  status text not null default 'live',
  created_at timestamptz default now()
);
create index if not exists entries_day_idx on public.entries (day, created_at desc);
create table if not exists public.wall_reports (
  entry_id uuid not null,
  user_id uuid not null,
  created_at timestamptz default now(),
  primary key (entry_id, user_id)
);
alter table public.entries enable row level security;
alter table public.wall_reports enable row level security;
-- The public window onto the wall: live frames only, and no user_id column at all.
create or replace view public.wall_public as
  select id, day, img_path, tile_path, w, h, model, slop, slate, lines, created_at
  from public.entries where status = 'live';
grant select on public.wall_public to anon, authenticated;
-- A public folder for the images (anyone can view, only the backend can upload).
insert into storage.buckets (id, name, public) values ('wall', 'wall', true) on conflict (id) do nothing;
