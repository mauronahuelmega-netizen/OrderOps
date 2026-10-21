-- P02-T06: manual merge. Does not touch later-phase attribution tables.

create or replace function commercial.merge_commercial_businesses(
  p_survivor_id uuid,
  p_absorbed_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, commercial
as $$
declare
  v_actor uuid;
  v_merge uuid;
  v_open_survivor int;
  v_open_absorbed int;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;

  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('crm.write') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;

  if length(btrim(coalesce(p_reason, ''))) = 0 then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  if p_survivor_id = p_absorbed_id
    or not exists (select 1 from commercial.commercial_businesses where id = p_survivor_id and merged_into_id is null)
    or not exists (select 1 from commercial.commercial_businesses where id = p_absorbed_id and merged_into_id is null) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'merge_forbidden');
  end if;

  select count(*) into v_open_survivor
  from commercial.commercial_opportunities
  where commercial_business_id = p_survivor_id
    and stage not in ('won', 'lost')
    and archived_at is null;
  select count(*) into v_open_absorbed
  from commercial.commercial_opportunities
  where commercial_business_id = p_absorbed_id
    and stage not in ('won', 'lost')
    and archived_at is null;
  if v_open_survivor > 0 and v_open_absorbed > 0 then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'merge_forbidden');
  end if;

  update commercial.commercial_contacts
  set commercial_business_id = p_survivor_id
  where commercial_business_id = p_absorbed_id;

  update commercial.commercial_interactions
  set commercial_business_id = p_survivor_id
  where commercial_business_id = p_absorbed_id;

  update commercial.commercial_opportunities
  set commercial_business_id = p_survivor_id
  where commercial_business_id = p_absorbed_id;

  update commercial.demo_submissions
  set resolved_business_id = p_survivor_id
  where resolved_business_id = p_absorbed_id;

  update commercial.commercial_businesses
  set merged_into_id = p_survivor_id
  where id = p_absorbed_id;

  insert into commercial.commercial_merges (survivor_id, absorbed_id, actor_account_id, reason)
  values (p_survivor_id, p_absorbed_id, v_actor, btrim(p_reason))
  returning id into v_merge;

  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, reason, correlation_id, after
  ) values (
    v_actor,
    'internal',
    'business.merged',
    'commercial',
    'commercial_merges',
    v_merge,
    btrim(p_reason),
    gen_random_uuid(),
    jsonb_build_object('survivor_id', p_survivor_id, 'absorbed_id', p_absorbed_id)
  );

  return jsonb_build_object('ok', true, 'merge_id', v_merge);
end;
$$;

revoke all on function commercial.merge_commercial_businesses(uuid, uuid, text) from public, anon, authenticated;
grant execute on function commercial.merge_commercial_businesses(uuid, uuid, text) to authenticated;

create or replace function public.merge_commercial_businesses(
  p_survivor_id uuid,
  p_absorbed_id uuid,
  p_reason text
)
returns jsonb
language sql
security definer
set search_path = pg_catalog, commercial
as $$
  select commercial.merge_commercial_businesses(p_survivor_id, p_absorbed_id, p_reason);
$$;

revoke all on function public.merge_commercial_businesses(uuid, uuid, text) from public;
grant execute on function public.merge_commercial_businesses(uuid, uuid, text) to authenticated;
