-- WhatsApp integration: phone numbers + message log.

alter table public.profiles
  add column if not exists phone_e164 text;

create unique index if not exists profiles_phone_e164_uidx
  on public.profiles (phone_e164)
  where phone_e164 is not null;

create type public.wa_direction as enum ('inbound', 'outbound');
create type public.wa_msg_type  as enum ('text', 'audio', 'voice', 'image', 'other');

create table if not exists public.whatsapp_messages (
  id            uuid primary key default gen_random_uuid(),
  direction     public.wa_direction not null,
  msg_type      public.wa_msg_type  not null default 'text',
  wa_message_id text,
  from_e164     text,
  to_e164       text,
  body          text,
  media_id      text,
  media_mime    text,
  profile_id    uuid references public.profiles(id) on delete set null,
  circle_id     uuid references public.care_circles(id) on delete set null,
  checkin_id    uuid references public.checkins(id) on delete set null,
  payload       jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists wa_msgs_circle_time_idx
  on public.whatsapp_messages (circle_id, created_at desc);
create index if not exists wa_msgs_wa_id_idx
  on public.whatsapp_messages (wa_message_id);

alter table public.whatsapp_messages enable row level security;

create policy "wa_member_r"
  on public.whatsapp_messages for select
  using (circle_id is null or public.is_circle_member(circle_id));

-- Seed demo phones so we can test fanout without touching the DB.
-- Override these with real E.164 numbers (no +, no spaces) via UPDATE after running migrations.
update public.profiles
  set phone_e164 = coalesce(phone_e164, '000000000001')
  where id = '00000000-0000-0000-0000-000000000001';
update public.profiles
  set phone_e164 = coalesce(phone_e164, '000000000002')
  where id = '00000000-0000-0000-0000-000000000002';
