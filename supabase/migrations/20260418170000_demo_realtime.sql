-- Demo realtime: permissive anon SELECT policies scoped to the demo circle only,
-- and ensure realtime publication includes the tables the demo UI subscribes to.
--
-- This is hackathon-safe: the policies only expose rows for the hard-coded demo
-- circle_id. Production tenants are unaffected (still gated by member policies).

-- Demo circle id (matches apps/web/lib/supabase.ts DEMO_CIRCLE_ID)
-- 00000000-0000-0000-0000-0000000000aa

do $$
begin
  -- checkins
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'checkins' and policyname = 'demo_anon_r'
  ) then
    execute $p$
      create policy "demo_anon_r" on public.checkins
      for select to anon
      using (circle_id = '00000000-0000-0000-0000-0000000000aa'::uuid)
    $p$;
  end if;

  -- biomarker_snapshots (via checkins.circle_id)
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'biomarker_snapshots' and policyname = 'demo_anon_r'
  ) then
    execute $p$
      create policy "demo_anon_r" on public.biomarker_snapshots
      for select to anon
      using (
        exists (
          select 1 from public.checkins c
          where c.id = biomarker_snapshots.checkin_id
            and c.circle_id = '00000000-0000-0000-0000-0000000000aa'::uuid
        )
      )
    $p$;
  end if;

  -- supporter_briefs
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'supporter_briefs' and policyname = 'demo_anon_r'
  ) then
    execute $p$
      create policy "demo_anon_r" on public.supporter_briefs
      for select to anon
      using (circle_id = '00000000-0000-0000-0000-0000000000aa'::uuid)
    $p$;
  end if;

  -- whatsapp_messages
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'whatsapp_messages' and policyname = 'demo_anon_r'
  ) then
    execute $p$
      create policy "demo_anon_r" on public.whatsapp_messages
      for select to anon
      using (circle_id = '00000000-0000-0000-0000-0000000000aa'::uuid)
    $p$;
  end if;

  -- profiles (only the two demo profiles; phone-only "auth" already happens in pipeline)
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'demo_anon_r'
  ) then
    execute $p$
      create policy "demo_anon_r" on public.profiles
      for select to anon
      using (id in (
        '00000000-0000-0000-0000-000000000001'::uuid,
        '00000000-0000-0000-0000-000000000002'::uuid,
        '00000000-0000-0000-0000-000000000003'::uuid,
        '00000000-0000-0000-0000-000000000004'::uuid
      ))
    $p$;
  end if;
end$$;

-- Ensure the tables are in the realtime publication
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin execute 'alter publication supabase_realtime add table public.checkins';
    exception when duplicate_object then null; end;
    begin execute 'alter publication supabase_realtime add table public.biomarker_snapshots';
    exception when duplicate_object then null; end;
    begin execute 'alter publication supabase_realtime add table public.supporter_briefs';
    exception when duplicate_object then null; end;
    begin execute 'alter publication supabase_realtime add table public.whatsapp_messages';
    exception when duplicate_object then null; end;
  end if;
end$$;
