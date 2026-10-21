-- Separation only goes through separate_promoter, which writes the 90-day protection.

create or replace function commercial.transition_promoter_status(
  p_promoter_id uuid,
  p_to_status text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, commercial
as $$
declare
  v_actor uuid;
  v_from text;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('promoter.review') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;

  if p_to_status = 'active' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'verification_incomplete');
  end if;
  if p_to_status = 'separated' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  select status into v_from from commercial.promoters where id = p_promoter_id;
  if v_from is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;

  if not (
    (v_from = 'registered' and p_to_status = 'pending_verification')
    or (v_from = 'active' and p_to_status = 'suspended')
  ) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  update commercial.promoters
  set status = p_to_status
  where id = p_promoter_id;

  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, before, after
  ) values (
    v_actor, 'internal', 'promoter.status', 'commercial', 'promoters', p_promoter_id, p_promoter_id,
    jsonb_build_object('status', v_from),
    jsonb_build_object('status', p_to_status)
  );

  return jsonb_build_object('ok', true, 'status', p_to_status);
end;
$$;
