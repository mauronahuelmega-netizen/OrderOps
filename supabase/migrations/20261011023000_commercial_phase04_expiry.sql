-- P04-T04. Marks elapsed grants expired and keeps the rows.

create or replace function commercial.expire_onboarding_grants()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_id uuid;
  v_count integer := 0;
begin
  if auth.uid() is not null and not commercial.has_internal_role('superadmin') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if auth.uid() is null and session_user not in ('postgres', 'supabase_admin') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  for v_id in
    select id from commercial.onboarding_grants
    where status = 'active' and ends_at <= pg_catalog.now()
  loop
    update commercial.onboarding_grants set status = 'expired' where id = v_id and status = 'active';
    insert into commercial.onboarding_grant_events (grant_id, event_type, reason)
    values (v_id, 'expired', 'ends_at elapsed');
    v_count := v_count + 1;
  end loop;
  return jsonb_build_object('ok', true, 'expired_count', v_count);
end;
$$;

revoke all on function commercial.expire_onboarding_grants() from public, anon, authenticated, service_role;

create or replace function public.expire_onboarding_grants()
returns jsonb
language sql
security definer
set search_path = pg_catalog, commercial
as $$
  select commercial.expire_onboarding_grants();
$$;

revoke all on function public.expire_onboarding_grants() from public, anon, service_role;
grant execute on function public.expire_onboarding_grants() to authenticated;
