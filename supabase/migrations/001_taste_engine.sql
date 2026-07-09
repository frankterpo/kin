create extension if not exists "pgcrypto";

create table if not exists public.inspiration (
  id uuid primary key default gen_random_uuid(),
  storage_url text not null,
  attrs jsonb not null,
  hues jsonb not null default '[]'::jsonb,
  source text,
  created_at timestamptz not null default now()
);

create table if not exists public.sessions (
  id uuid primary key,
  taste jsonb not null,
  confidence jsonb not null,
  swipes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.inspiration enable row level security;
alter table public.sessions enable row level security;

create policy "Public corpus is readable"
  on public.inspiration for select using (true);

create policy "Anonymous demo sessions can be created"
  on public.sessions for insert with check (true);

create policy "Anonymous demo sessions can be updated"
  on public.sessions for update using (true) with check (true);

insert into storage.buckets (id, name, public)
values ('inspiration', 'inspiration', true)
on conflict (id) do update set public = true;

create policy "Inspiration images are public"
  on storage.objects for select
  using (bucket_id = 'inspiration');
