-- Run this in your Supabase SQL editor to set up the database

-- 1. Profiles table (auto-created from auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  created_at timestamptz default now()
);

-- Automatically create a profile when a new user signs up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 2. Sermon notes table
create table if not exists sermon_notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  content text not null,
  published boolean default true,
  created_at timestamptz default now()
);

-- 3. Row Level Security
alter table sermon_notes enable row level security;
alter table profiles enable row level security;

-- Anyone can read published notes (public home page)
create policy "Public can view published notes"
  on sermon_notes for select
  using (published = true);

-- Pastors can manage their own notes
create policy "Pastors can view own notes"
  on sermon_notes for select
  using (auth.uid() = user_id);

create policy "Pastors can insert own notes"
  on sermon_notes for insert
  with check (auth.uid() = user_id);

create policy "Pastors can delete own notes"
  on sermon_notes for delete
  using (auth.uid() = user_id);

-- Anyone can read profiles (for display on home page)
create policy "Public can view profiles"
  on profiles for select
  using (true);
