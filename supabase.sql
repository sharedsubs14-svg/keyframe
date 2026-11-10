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
-- ============ DAILY ALLOWANCE (safe to run again) ============
-- One row per signed-in person per day. `spend` is what that person has cost in Claude calls today, in rupees.
-- It is the only cap: one rupee a day unless DAILY_BUDGET_INR says otherwise. `count` and `reads` are kept for
-- your own stats (prompt reveals and Reverse SLATE reads that day); nothing is limited by them.
alter table public.reveals add column if not exists reads int not null default 0;
alter table public.reveals add column if not exists spend numeric(12,4) not null default 0;

-- Puts `p_amount` rupees on hold against a person's day, in one step, so two requests arriving at the same
-- moment cannot both slip under the cap. Gives back the day's total after the hold, or nothing when the hold
-- would take the day past `p_cap`.
create or replace function public.slate_hold(p_user uuid, p_email text, p_day date, p_amount numeric, p_cap numeric)
returns numeric language plpgsql security definer set search_path = public as $$
declare v numeric;
begin
  insert into public.reveals (user_id, email, day, count) values (p_user, p_email, p_day, 0)
    on conflict (user_id, day) do nothing;
  update public.reveals set spend = spend + p_amount
    where user_id = p_user and day = p_day and spend + p_amount <= p_cap
    returning spend into v;
  return v;
end $$;

-- Swaps a hold for what the call really cost (`p_delta` is the real cost minus the hold, so usually negative)
-- and adds to the day's stats. Gives back the day's total.
create or replace function public.slate_settle(p_user uuid, p_day date, p_delta numeric, p_prompts int, p_reads int)
returns numeric language plpgsql security definer set search_path = public as $$
declare v numeric;
begin
  update public.reveals set spend = greatest(0, spend + p_delta), count = count + p_prompts, reads = reads + p_reads
    where user_id = p_user and day = p_day
    returning spend into v;
  return v;
end $$;

-- Only the backend (service key) may call these two.
revoke all on function public.slate_hold(uuid, text, date, numeric, numeric) from public, anon, authenticated;
revoke all on function public.slate_settle(uuid, date, numeric, int, int) from public, anon, authenticated;
grant execute on function public.slate_hold(uuid, text, date, numeric, numeric) to service_role;
grant execute on function public.slate_settle(uuid, date, numeric, int, int) to service_role;

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
