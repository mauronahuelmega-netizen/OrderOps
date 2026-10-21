-- B3: persisted welcome preference. Independent of promoter_overview.

create table commercial.promoter_portal_preferences (
  promoter_id uuid primary key references commercial.promoters (id),
  welcome_dismissed_at timestamptz
);

alter table commercial.promoter_portal_preferences enable row level security;
alter table commercial.promoter_portal_preferences force row level security;
revoke all on table commercial.promoter_portal_preferences from public, anon, authenticated;
grant select, insert, update on table commercial.promoter_portal_preferences to authenticated;

create policy promoter_portal_preferences_select
  on commercial.promoter_portal_preferences
  for select to authenticated
  using (promoter_id = commercial.current_promoter_id());

create policy promoter_portal_preferences_insert
  on commercial.promoter_portal_preferences
  for insert to authenticated
  with check (promoter_id = commercial.current_promoter_id());

create policy promoter_portal_preferences_update
  on commercial.promoter_portal_preferences
  for update to authenticated
  using (promoter_id = commercial.current_promoter_id())
  with check (promoter_id = commercial.current_promoter_id());

create or replace function public.read_own_welcome_preference()
returns jsonb
language sql
stable
security invoker
set search_path = pg_catalog, public, commercial
as $$
  select case
    when auth.uid() is null then jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated')
    when commercial.current_promoter_id() is null then jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden')
    else jsonb_build_object(
      'ok', true,
      'welcome_dismissed_at', (
        select preference.welcome_dismissed_at
        from commercial.promoter_portal_preferences preference
        where preference.promoter_id = commercial.current_promoter_id()
      )
    )
  end;
$$;

create or replace function public.set_own_welcome_dismissed(p_dismissed boolean)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public, commercial
as $$
declare
  v_promoter uuid;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_promoter := commercial.current_promoter_id();
  if v_promoter is null or p_dismissed is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  insert into commercial.promoter_portal_preferences (promoter_id, welcome_dismissed_at)
  values (v_promoter, case when p_dismissed then pg_catalog.now() else null end)
  on conflict (promoter_id) do update
    set welcome_dismissed_at = excluded.welcome_dismissed_at;
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.read_own_welcome_preference() from public, anon, authenticated, service_role;
revoke all on function public.set_own_welcome_dismissed(boolean) from public, anon, authenticated, service_role;
grant execute on function public.read_own_welcome_preference() to authenticated;
grant execute on function public.set_own_welcome_dismissed(boolean) to authenticated;
