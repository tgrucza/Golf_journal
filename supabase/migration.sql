-- Buckhorn Springs Shot Journal — Supabase schema (Phase 3)
--
-- How to run: Supabase Dashboard → your project → SQL Editor → New query →
-- paste this whole file → Run. Safe to re-run (uses IF NOT EXISTS / OR REPLACE).

-- ============================================================
-- profiles — one row per user
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create a profile row the moment someone signs up, so the client
-- never has to race to insert one itself.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, null)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- courses — editable course definitions, one (or more) per user
-- ============================================================
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  tee_name text not null default 'Black',
  holes jsonb not null, -- [{number, par, yards, handicap_index}, ...]
  created_at timestamptz not null default now()
);

alter table public.courses enable row level security;

drop policy if exists "courses: crud own" on public.courses;
create policy "courses: crud own" on public.courses
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ============================================================
-- rounds — one row per round
-- ============================================================
create table if not exists public.rounds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  local_id text not null,          -- client-generated id (e.g. "r1a2b3c"), used to reconcile with localStorage
  date_played timestamptz not null,
  holes_played integer not null default 0,
  total_score integer not null default 0,
  total_par integer not null default 0,
  finished boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, local_id)
);

alter table public.rounds enable row level security;

drop policy if exists "rounds: crud own" on public.rounds;
create policy "rounds: crud own" on public.rounds
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- hole_results — one row per hole per round (the AI-facing table)
-- ============================================================
create table if not exists public.hole_results (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.rounds(id) on delete cascade,
  hole_number integer not null,
  par integer,
  yards integer,
  handicap_index integer,
  score integer,
  tee_shot text,           -- fairway | left | right | null
  tee_trouble text,        -- bunker | water | ob | null
  approach text,           -- green | short | long | left | right | null
  approach_trouble text,   -- bunker | water | ob | null
  short_sided boolean not null default false,
  chip_result text,        -- short | pinhigh | long | holed | null
  putts integer,
  first_putt text,         -- short | long | holed | null
  first_putt_break text,   -- high | low | null
  unique (round_id, hole_number)
);

alter table public.hole_results enable row level security;

drop policy if exists "hole_results: crud via own round" on public.hole_results;
create policy "hole_results: crud via own round" on public.hole_results
  for all using (
    exists (select 1 from public.rounds r where r.id = round_id and r.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.rounds r where r.id = round_id and r.user_id = auth.uid())
  );

-- ============================================================
-- Helpful indexes
-- ============================================================
create index if not exists rounds_user_id_idx on public.rounds (user_id);
create index if not exists hole_results_round_id_idx on public.hole_results (round_id);
create index if not exists courses_owner_id_idx on public.courses (owner_id);
