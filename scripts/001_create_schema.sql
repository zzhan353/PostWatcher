-- Create profiles table for user data
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  subscription_tier text default 'free' check (subscription_tier in ('free', 'pro', 'enterprise')),
  stripe_customer_id text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Create watchers table for monitoring configurations
create table if not exists public.watchers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null check (category in ('jobs', 'shopping', 'real_estate', 'stocks', 'social_media', 'news')),
  keywords text[] default '{}',
  filters jsonb default '{}',
  notification_email boolean default true,
  notification_push boolean default false,
  is_active boolean default true,
  last_checked_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.watchers enable row level security;

create policy "watchers_select_own" on public.watchers for select using (auth.uid() = user_id);
create policy "watchers_insert_own" on public.watchers for insert with check (auth.uid() = user_id);
create policy "watchers_update_own" on public.watchers for update using (auth.uid() = user_id);
create policy "watchers_delete_own" on public.watchers for delete using (auth.uid() = user_id);

-- Create alerts table for matched posts
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  watcher_id uuid not null references public.watchers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  url text,
  source text,
  matched_keywords text[],
  is_read boolean default false,
  created_at timestamp with time zone default now()
);

alter table public.alerts enable row level security;

create policy "alerts_select_own" on public.alerts for select using (auth.uid() = user_id);
create policy "alerts_update_own" on public.alerts for update using (auth.uid() = user_id);
create policy "alerts_delete_own" on public.alerts for delete using (auth.uid() = user_id);

-- Create trigger to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', null)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Create function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Add triggers for updated_at
drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.update_updated_at_column();

drop trigger if exists update_watchers_updated_at on public.watchers;
create trigger update_watchers_updated_at
  before update on public.watchers
  for each row
  execute function public.update_updated_at_column();
