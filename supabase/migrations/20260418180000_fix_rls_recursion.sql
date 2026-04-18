-- Fix RLS stack-depth recursion on is_circle_member.
-- The helper queries care_circles and supporters, both of which reference
-- this same function from their own policies, which caused Postgres to
-- infinite-loop when anon tried to read whatsapp_messages (which has a
-- permissive member policy plus the demo_anon_r policy, OR-combined).
--
-- Making the helper SECURITY DEFINER bypasses RLS inside the function body,
-- which breaks the cycle.

create or replace function public.is_circle_member(p_circle uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.care_circles cc
    where cc.id = p_circle and cc.patient_id = auth.uid()
  ) or exists(
    select 1 from public.supporters s
    where s.circle_id = p_circle and s.profile_id = auth.uid()
  );
$$;

revoke all on function public.is_circle_member(uuid) from public;
grant execute on function public.is_circle_member(uuid) to anon, authenticated, service_role;
