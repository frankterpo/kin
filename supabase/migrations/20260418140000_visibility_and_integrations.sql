-- Visibility tier + EmotionGrid home + third-party integrations.
-- Aligns the mobile UX surfaces (Sleep / Heart / Place / Apps cards,
-- the 16x8 self-report tag, supporter "shared by" chips) with the schema.

-- ---------- Visibility enum ----------

do $$ begin
  create type public.visibility as enum ('private', 'circle', 'clinician');
exception when duplicate_object then null; end $$;

alter table public.checkins
  add column if not exists visibility public.visibility not null default 'circle';

alter table public.biomarker_snapshots
  add column if not exists visibility public.visibility not null default 'circle';

create index if not exists checkins_visibility_idx on public.checkins (visibility);
create index if not exists bio_visibility_idx on public.biomarker_snapshots (visibility);

-- ---------- Self-report tags (16x8 EmotionGrid commits) ----------

create table if not exists public.self_report_tags (
  id           uuid primary key default gen_random_uuid(),
  circle_id    uuid not null references public.care_circles(id) on delete cascade,
  author_id    uuid not null references public.profiles(id) on delete cascade,
  subject_id   uuid not null references public.profiles(id) on delete cascade,
  checkin_id   uuid references public.checkins(id) on delete set null,
  emotion      text not null,
  valence      numeric not null,    -- -1..1
  arousal      numeric not null,    -- -1..1
  visibility   public.visibility not null default 'private',
  created_at   timestamptz not null default now()
);
create index if not exists srt_circle_time_idx
  on public.self_report_tags (circle_id, created_at desc);
create index if not exists srt_subject_idx
  on public.self_report_tags (subject_id, created_at desc);

-- ---------- Integration source enum ----------

do $$ begin
  create type public.integration_source as enum
    ('healthkit', 'googlefit', 'fitbit', 'oura', 'manual');
exception when duplicate_object then null; end $$;

-- ---------- Sleep ----------

create table if not exists public.sleep_logs (
  id                     uuid primary key default gen_random_uuid(),
  profile_id             uuid not null references public.profiles(id) on delete cascade,
  source                 public.integration_source not null default 'manual',
  night_of               date not null,
  duration_minutes       integer not null,
  delta_baseline_minutes integer,
  visibility             public.visibility not null default 'circle',
  created_at             timestamptz not null default now(),
  unique (profile_id, night_of)
);

-- ---------- Heart ----------

create table if not exists public.heart_samples (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  source       public.integration_source not null default 'manual',
  bucket_at    timestamptz not null,
  bpm_min      integer,
  bpm_max      integer,
  bpm_avg      integer,
  visibility   public.visibility not null default 'circle',
  created_at   timestamptz not null default now()
);
create index if not exists heart_samples_profile_time_idx
  on public.heart_samples (profile_id, bucket_at desc);

-- ---------- Place ----------

create table if not exists public.place_visits (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  source       public.integration_source not null default 'manual',
  place_label  text not null,         -- 'home' | 'office' | 'mall' | 'out'
  place_name   text,                  -- e.g. "Greecologies"
  started_at   timestamptz not null,
  ended_at     timestamptz,
  visibility   public.visibility not null default 'circle',
  created_at   timestamptz not null default now()
);
create index if not exists place_visits_profile_time_idx
  on public.place_visits (profile_id, started_at desc);

-- ---------- App sessions ----------

create table if not exists public.app_sessions (
  id               uuid primary key default gen_random_uuid(),
  profile_id       uuid not null references public.profiles(id) on delete cascade,
  source           public.integration_source not null default 'manual',
  app_name         text not null,
  bucket_on        date not null,
  duration_minutes integer not null,
  visibility       public.visibility not null default 'private',  -- defaults private
  created_at       timestamptz not null default now()
);
create index if not exists app_sessions_profile_day_idx
  on public.app_sessions (profile_id, bucket_on);

-- ---------- RLS helper: profile in caller's circle ----------

create or replace function public.profile_in_my_circle(p_profile uuid)
returns boolean language sql stable as $$
  select exists(
    select 1 from public.care_circles cc
    where cc.patient_id = p_profile and public.is_circle_member(cc.id)
  ) or exists(
    select 1 from public.supporters s
    where s.profile_id = p_profile and public.is_circle_member(s.circle_id)
  ) or p_profile = auth.uid();
$$;

-- ---------- RLS: visibility-aware policies ----------

-- checkins: drop the existing all-or-nothing, add visibility-aware read + author write
drop policy if exists "checkins_member_rw" on public.checkins;

create policy "checkins_member_r" on public.checkins for select using (
  public.is_circle_member(circle_id) and (
    visibility in ('circle', 'clinician')
    or author_id = auth.uid()
  )
);
create policy "checkins_author_w" on public.checkins for all
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

-- biomarker_snapshots: visibility-aware read; pipeline (service role) writes
drop policy if exists "bio_member_r" on public.biomarker_snapshots;

create policy "bio_member_r" on public.biomarker_snapshots for select using (
  exists (
    select 1 from public.checkins c
    where c.id = checkin_id
      and public.is_circle_member(c.circle_id)
      and (
        visibility in ('circle', 'clinician')
        or c.author_id = auth.uid()
      )
  )
);

-- self_report_tags
alter table public.self_report_tags enable row level security;

create policy "srt_visibility_r" on public.self_report_tags for select using (
  public.is_circle_member(circle_id) and (
    visibility in ('circle', 'clinician')
    or author_id = auth.uid()
  )
);
create policy "srt_author_w" on public.self_report_tags for all
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

-- Integration tables — readable by circle if visibility allows, writable by owner
alter table public.sleep_logs    enable row level security;
alter table public.heart_samples enable row level security;
alter table public.place_visits  enable row level security;
alter table public.app_sessions  enable row level security;

create policy "sleep_visibility_r" on public.sleep_logs for select using (
  public.profile_in_my_circle(profile_id) and (
    visibility in ('circle', 'clinician')
    or profile_id = auth.uid()
  )
);
create policy "sleep_owner_w" on public.sleep_logs for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "heart_visibility_r" on public.heart_samples for select using (
  public.profile_in_my_circle(profile_id) and (
    visibility in ('circle', 'clinician')
    or profile_id = auth.uid()
  )
);
create policy "heart_owner_w" on public.heart_samples for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "place_visibility_r" on public.place_visits for select using (
  public.profile_in_my_circle(profile_id) and (
    visibility in ('circle', 'clinician')
    or profile_id = auth.uid()
  )
);
create policy "place_owner_w" on public.place_visits for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "app_visibility_r" on public.app_sessions for select using (
  public.profile_in_my_circle(profile_id) and (
    visibility in ('circle', 'clinician')
    or profile_id = auth.uid()
  )
);
create policy "app_owner_w" on public.app_sessions for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- ---------- Demo seed for new tables ----------

do $$
declare
  demo_patient uuid := '00000000-0000-0000-0000-000000000001';
  demo_partner uuid := '00000000-0000-0000-0000-000000000002';
  demo_circle  uuid := '00000000-0000-0000-0000-0000000000aa';
  yesterday    date := current_date - 1;
  today        date := current_date;
begin
  -- Sleep: last night, slightly under baseline
  insert into public.sleep_logs (profile_id, source, night_of, duration_minutes, delta_baseline_minutes, visibility)
    values (demo_patient, 'healthkit', yesterday, 312, -108, 'circle')
  on conflict (profile_id, night_of) do nothing;

  -- Heart: 6 buckets across today
  insert into public.heart_samples (profile_id, source, bucket_at, bpm_min, bpm_max, bpm_avg, visibility)
  select demo_patient, 'healthkit',
         (today + (h * interval '4 hour'))::timestamptz,
         48 + (h * 3),
         62 + (h * 12),
         55 + (h * 5),
         'circle'
  from generate_series(0, 5) as h
  on conflict do nothing;

  -- Place: home → mall → home today
  insert into public.place_visits (profile_id, source, place_label, place_name, started_at, ended_at, visibility) values
    (demo_patient, 'healthkit', 'home', 'Home',
       today::timestamptz,
       (today + interval '9 hour')::timestamptz, 'circle'),
    (demo_patient, 'healthkit', 'mall', 'Greecologies',
       (today + interval '9 hour')::timestamptz,
       (today + interval '13 hour')::timestamptz, 'circle'),
    (demo_patient, 'healthkit', 'home', 'Home',
       (today + interval '13 hour')::timestamptz,
       (today + interval '24 hour')::timestamptz, 'circle')
  on conflict do nothing;

  -- App sessions: today, private by default
  insert into public.app_sessions (profile_id, source, app_name, bucket_on, duration_minutes, visibility) values
    (demo_patient, 'manual', 'Slack',    today, 63, 'private'),
    (demo_patient, 'manual', 'Calendar', today, 59, 'private'),
    (demo_patient, 'manual', 'Facebook', today, 72, 'private')
  on conflict do nothing;

  -- A self-report tag from this morning, marked private
  insert into public.self_report_tags (circle_id, author_id, subject_id, emotion, valence, arousal, visibility)
    values (demo_circle, demo_patient, demo_patient, 'Bright', 0.43, 0.29, 'private')
  on conflict do nothing;

  -- A supporter observation tagging the patient, shared with the circle
  insert into public.self_report_tags (circle_id, author_id, subject_id, emotion, valence, arousal, visibility)
    values (demo_circle, demo_partner, demo_patient, 'Quiet', -0.10, -0.30, 'circle')
  on conflict do nothing;
end $$;
