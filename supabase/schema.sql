-- EduSwap Supabase schema
-- Run this once in Supabase Dashboard -> SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  type text not null check (type in ('swap', 'sell', 'donate', 'resource')),
  subject text not null,
  author_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  author_avatar text,
  file_url text,
  file_name text,
  file_type text,
  file_size bigint,
  student_name text,
  student_year text,
  student_department text,
  contact_phone text,
  contact_whatsapp text,
  contact_instagram text,
  contact_telegram text,
  rating numeric default 5,
  downloads integer default 0,
  price numeric default 0,
  is_verified boolean default false,
  is_community_choice boolean default false,
  icon text default 'description',
  status text default 'available' check (status in ('available', 'completed')),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.downloads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  material_id uuid not null references public.materials(id) on delete cascade,
  material_title text not null,
  material_author text not null,
  downloaded_at timestamptz not null default now(),
  file_url text not null,
  file_name text not null
);

create table if not exists public.swap_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_name text not null,
  user_avatar text,
  title text not null,
  description text not null,
  looking_for text not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id) on delete cascade,
  material_title text not null,
  seller_id uuid not null references auth.users(id) on delete cascade,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null default 0,
  purchased_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;
alter table public.materials enable row level security;
alter table public.downloads enable row level security;
alter table public.swap_requests enable row level security;
alter table public.messages enable row level security;
alter table public.purchases enable row level security;
alter table public.contact_messages enable row level security;

create policy "Profiles are readable" on public.user_profiles for select using (true);
create policy "Users insert own profile" on public.user_profiles for insert with check (auth.uid() = user_id);
create policy "Users update own profile" on public.user_profiles for update using (auth.uid() = user_id);

create policy "Materials are readable" on public.materials for select using (true);
create policy "Users insert own materials" on public.materials for insert with check (auth.uid() = author_id);
create policy "Users update own materials" on public.materials for update using (auth.uid() = author_id);
create policy "Users delete own materials" on public.materials for delete using (auth.uid() = author_id);

create policy "Downloads are readable by owner" on public.downloads for select using (auth.uid() = user_id);
create policy "Users insert own downloads" on public.downloads for insert with check (auth.uid() = user_id);

create policy "Swap requests are readable" on public.swap_requests for select using (true);
create policy "Users insert own swap requests" on public.swap_requests for insert with check (auth.uid() = user_id);
create policy "Users update own swap requests" on public.swap_requests for update using (auth.uid() = user_id);
create policy "Users delete own swap requests" on public.swap_requests for delete using (auth.uid() = user_id);

create policy "Users read own messages" on public.messages
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Users send own messages" on public.messages
  for insert with check (auth.uid() = sender_id);

create policy "Users read own purchases" on public.purchases
  for select using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "Users insert own purchases" on public.purchases
  for insert with check (auth.uid() = buyer_id);

create policy "Anyone can send contact messages" on public.contact_messages for insert with check (true);

insert into storage.buckets (id, name, public)
values ('materials', 'materials', true)
on conflict (id) do nothing;

create policy "Material files are public" on storage.objects
  for select using (bucket_id = 'materials');

create policy "Users upload own material files" on storage.objects
  for insert with check (
    bucket_id = 'materials'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users update own material files" on storage.objects
  for update using (
    bucket_id = 'materials'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users delete own material files" on storage.objects
  for delete using (
    bucket_id = 'materials'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
