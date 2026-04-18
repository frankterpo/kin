-- Kin V1 schema
-- Patient + care-circle + voice check-in biomarker timeline.

create extension if not exists "pgcrypto";

-- ---------- People ----------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  condition    text,                              -- e.g. "parkinsons", "long_covid"
  created_at   timestamptz not null default now()
);

-- A care circle has one patient and many supporters
create table if not exists public.care_circles (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null references public.profiles(id) on delete cascade,
  name        text not null default 'My care circle',
  created_at  timestamptz not null default now()
);

create type public.supporter_role as enum ('partner','child','sibling','friend','clinician','other');

create table if not exists public.supporters (
  id             uuid primary key default gen_random_uuid(),
  circle_id      uuid not null references public.care_circles(id) on delete cascade,
  profile_id     uuid not null references public.profiles(id) on delete cascade,
  role           public.supporter_role not null default 'friend',
  relationship   text,
  created_at     timestamptz not null default now(),
  unique (circle_id, profile_id)
);

-- ---------- Voice check-ins ----------
create type public.checkin_source as enum ('patient','supporter');

create table if not exists public.checkins (
  id             uuid primary key default gen_random_uuid(),
  circle_id      uuid not null references public.care_circles(id) on delete cascade,
  author_id      uuid not null references public.profiles(id) on delete cascade,
  source         public.checkin_source not null default 'patient',
  duration_ms    integer,
  transcript     text,
  audio_path     text,              -- Supabase Storage key
  started_at     timestamptz not null default now(),
  finished_at    timestamptz
);
create index if not exists checkins_circle_time_idx
  on public.checkins (circle_id, started_at desc);

-- Biomarker snapshot — one row per policy-result from Sentinel
create table if not exists public.biomarker_snapshots (
  id             uuid primary key default gen_random_uuid(),
  checkin_id     uuid not null references public.checkins(id) on delete cascade,
  t_offset_ms    integer not null default 0,
  helios         jsonb,             -- distress/stress/burnout/fatigue/low_self_esteem
  apollo         jsonb,             -- depression + anxiety sub-scores
  psyche         jsonb,             -- affect dist (happy/sad/angry/…)
  policy_result  jsonb,             -- raw wellbeing-awareness output
  concordance    jsonb,             -- {scenario, agreement_level}
  created_at     timestamptz not null default now()
);
create index if not exists bio_checkin_idx on public.biomarker_snapshots (checkin_id, t_offset_ms);

-- ---------- Supporter briefs (daily guidance) ----------
create table if not exists public.supporter_briefs (
  id           uuid primary key default gen_random_uuid(),
  circle_id    uuid not null references public.care_circles(id) on delete cascade,
  supporter_id uuid not null references public.supporters(id) on delete cascade,
  for_date     date not null default current_date,
  headline     text not null,
  guidance     text not null,
  tone_cues    text[] not null default '{}',
  derived_from uuid references public.checkins(id) on delete set null,
  created_at   timestamptz not null default now(),
  unique (supporter_id, for_date)
);

-- ---------- Network pulse view ----------
create or replace view public.network_pulse as
  select
    c.circle_id,
    c.id             as checkin_id,
    c.source,
    c.started_at,
    c.transcript,
    bs.helios,
    bs.apollo,
    bs.psyche,
    bs.concordance
  from public.checkins c
  left join lateral (
    select helios, apollo, psyche, concordance
    from public.biomarker_snapshots
    where checkin_id = c.id
    order by t_offset_ms desc
    limit 1
  ) bs on true;

-- ---------- Row-level security ----------
alter table public.profiles            enable row level security;
alter table public.care_circles        enable row level security;
alter table public.supporters          enable row level security;
alter table public.checkins            enable row level security;
alter table public.biomarker_snapshots enable row level security;
alter table public.supporter_briefs    enable row level security;

-- Helper: is auth.uid() a member of a circle?
create or replace function public.is_circle_member(p_circle uuid)
returns boolean language sql stable as $$
  select exists(
    select 1 from public.care_circles cc
    where cc.id = p_circle and cc.patient_id = auth.uid()
  ) or exists(
    select 1 from public.supporters s
    where s.circle_id = p_circle and s.profile_id = auth.uid()
  );
$$;

create policy "profiles_self_rw"
  on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());

create policy "care_circles_member_r"
  on public.care_circles for select using (public.is_circle_member(id));
create policy "care_circles_patient_rw"
  on public.care_circles for all using (patient_id = auth.uid()) with check (patient_id = auth.uid());

create policy "supporters_member_r"
  on public.supporters for select using (public.is_circle_member(circle_id));
create policy "supporters_patient_rw"
  on public.supporters for all using (
    exists (select 1 from public.care_circles c where c.id = circle_id and c.patient_id = auth.uid())
  );

create policy "checkins_member_rw"
  on public.checkins for all using (public.is_circle_member(circle_id));

create policy "bio_member_r"
  on public.biomarker_snapshots for select using (
    exists (select 1 from public.checkins c
            where c.id = checkin_id and public.is_circle_member(c.circle_id))
  );
create policy "bio_service_write"
  on public.biomarker_snapshots for insert with check (true);  -- pipeline uses service role

create policy "briefs_member_r"
  on public.supporter_briefs for select using (public.is_circle_member(circle_id));

-- ---------- Seed demo circle ----------
-- Only runs if no demo circle yet. The pipeline uses service role, so it bypasses RLS.
do $$
declare
  demo_patient uuid := '00000000-0000-0000-0000-000000000001';
  demo_partner uuid := '00000000-0000-0000-0000-000000000002';
  demo_circle  uuid := '00000000-0000-0000-0000-0000000000aa';
begin
  insert into public.profiles(id, display_name, condition)
    values
      (demo_patient, 'Demo Patient', 'parkinsons'),
      (demo_partner, 'Demo Partner', null)
  on conflict (id) do nothing;

  insert into public.care_circles(id, patient_id, name)
    values (demo_circle, demo_patient, 'Demo Circle')
  on conflict (id) do nothing;

  insert into public.supporters(circle_id, profile_id, role, relationship)
    values (demo_circle, demo_partner, 'partner', 'Spouse')
  on conflict (circle_id, profile_id) do nothing;
end $$;
