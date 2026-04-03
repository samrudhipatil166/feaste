-- Enable RLS on all tables
-- Run this in the Supabase SQL editor

-- profiles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  goal text not null default 'wellness',
  conditions text[] default '{}',
  diet_style text default 'Balanced',
  cycle_length integer default 28,
  is_irregular boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can upsert their own profile"
  on public.profiles for all
  using (auth.uid() = id);

-- food_preferences
create table if not exists public.food_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null unique,
  allergies text[] default '{}',
  dislikes text[] default '{}',
  cuisines text[] default '{}',
  cooking_time text default '30 min',
  meals_per_day integer default 3,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.food_preferences enable row level security;

create policy "Users can manage their own food preferences"
  on public.food_preferences for all
  using (auth.uid() = user_id);

-- food_log
create table if not exists public.food_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  date date not null default current_date,
  name text not null,
  calories integer not null,
  protein integer default 0,
  carbs integer default 0,
  fat integer default 0,
  source text default 'manual',
  meal_type text default 'lunch',
  logged_at timestamptz default now()
);

alter table public.food_log enable row level security;

create policy "Users can manage their own food log"
  on public.food_log for all
  using (auth.uid() = user_id);

-- daily_summary
create table if not exists public.daily_summary (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  date date not null default current_date,
  total_calories integer default 0,
  total_protein integer default 0,
  total_carbs integer default 0,
  total_fat integer default 0,
  water_glasses integer default 0,
  unique(user_id, date)
);

alter table public.daily_summary enable row level security;

create policy "Users can manage their own daily summary"
  on public.daily_summary for all
  using (auth.uid() = user_id);

-- period_log
create table if not exists public.period_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  start_date date not null,
  end_date date,
  flow text default 'medium',
  symptoms text[] default '{}',
  created_at timestamptz default now()
);

alter table public.period_log enable row level security;

create policy "Users can manage their own period log"
  on public.period_log for all
  using (auth.uid() = user_id);

-- weekly_plans
create table if not exists public.weekly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  week_start_date date not null,
  plan_json jsonb not null,
  created_at timestamptz default now(),
  unique(user_id, week_start_date)
);

alter table public.weekly_plans enable row level security;

create policy "Users can manage their own weekly plans"
  on public.weekly_plans for all
  using (auth.uid() = user_id);

-- vitamin_log
create table if not exists public.vitamin_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  date date not null default current_date,
  supplement_name text not null,
  taken boolean default false,
  created_at timestamptz default now(),
  unique(user_id, date, supplement_name)
);

alter table public.vitamin_log enable row level security;

create policy "Users can manage their own vitamin log"
  on public.vitamin_log for all
  using (auth.uid() = user_id);
