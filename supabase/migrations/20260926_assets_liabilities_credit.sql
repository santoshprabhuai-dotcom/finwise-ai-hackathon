-- FinWise AI: assets, liabilities and credit profile tables
-- Run this once in Supabase SQL Editor before using the new Financial Position features.

create extension if not exists pgcrypto;

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null default 'Other',
  current_value numeric(14,2) not null default 0,
  purchase_value numeric(14,2),
  as_of_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.liabilities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null default 'Other',
  outstanding_amount numeric(14,2) not null default 0,
  original_amount numeric(14,2),
  interest_rate numeric(6,3),
  monthly_payment numeric(14,2),
  credit_limit numeric(14,2),
  as_of_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.credit_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_date date not null default current_date,
  cibil_score integer,
  other_score_name text,
  other_score integer,
  late_payments_12m integer not null default 0,
  total_credit_limit numeric(14,2),
  total_credit_used numeric(14,2),
  notes text,
  created_at timestamptz not null default now(),
  constraint credit_profiles_cibil_range check (cibil_score is null or cibil_score between 300 and 900),
  constraint credit_profiles_other_range check (other_score is null or other_score between 0 and 9999),
  constraint credit_profiles_late_range check (late_payments_12m >= 0)
);

create index if not exists assets_user_id_idx on public.assets(user_id);
create index if not exists liabilities_user_id_idx on public.liabilities(user_id);
create index if not exists credit_profiles_user_id_idx on public.credit_profiles(user_id);

alter table public.assets enable row level security;
alter table public.liabilities enable row level security;
alter table public.credit_profiles enable row level security;

drop policy if exists "Users can view own assets" on public.assets;
create policy "Users can view own assets" on public.assets for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own assets" on public.assets;
create policy "Users can insert own assets" on public.assets for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own assets" on public.assets;
create policy "Users can update own assets" on public.assets for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete own assets" on public.assets;
create policy "Users can delete own assets" on public.assets for delete using (auth.uid() = user_id);

drop policy if exists "Users can view own liabilities" on public.liabilities;
create policy "Users can view own liabilities" on public.liabilities for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own liabilities" on public.liabilities;
create policy "Users can insert own liabilities" on public.liabilities for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own liabilities" on public.liabilities;
create policy "Users can update own liabilities" on public.liabilities for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete own liabilities" on public.liabilities;
create policy "Users can delete own liabilities" on public.liabilities for delete using (auth.uid() = user_id);

drop policy if exists "Users can view own credit profiles" on public.credit_profiles;
create policy "Users can view own credit profiles" on public.credit_profiles for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own credit profiles" on public.credit_profiles;
create policy "Users can insert own credit profiles" on public.credit_profiles for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own credit profiles" on public.credit_profiles;
create policy "Users can update own credit profiles" on public.credit_profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete own credit profiles" on public.credit_profiles;
create policy "Users can delete own credit profiles" on public.credit_profiles for delete using (auth.uid() = user_id);

-- Keep goal planner fields compatible with the current dashboard.
alter table public.goals add column if not exists target_date date;
alter table public.goals add column if not exists inflation_rate numeric(6,3) default 6;
alter table public.goals add column if not exists return_rate numeric(6,3) default 8;
alter table public.goals add column if not exists risk_profile text default 'Balanced';

notify pgrst, 'reload schema';
