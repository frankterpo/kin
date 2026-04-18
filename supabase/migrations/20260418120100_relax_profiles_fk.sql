-- Relax profiles.id FK so we can seed demo data without creating auth.users rows.
alter table public.profiles
  drop constraint if exists profiles_id_fkey;

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
