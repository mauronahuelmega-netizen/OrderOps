-- P02-T03: audited stage changes and tasks. Won stays blocked until phase 04.

create or replace function commercial.transition_opportunity(
  p_opportunity_id uuid,
  p_to_stage text,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, commercial
as $$
declare
  v_actor uuid;
  v_from text;
  v_open int;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;

  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('crm.write') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;

  if p_to_stage = 'won' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'won_requires_business');
  end if;

  if p_to_stage not in ('new', 'contacting', 'qualified', 'demo_scheduled', 'demo_done', 'follow_up', 'lost') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  if p_to_stage = 'lost' and length(btrim(coalesce(p_reason, ''))) = 0 then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'lost_reason_required');
  end if;

  select stage into v_from
  from commercial.commercial_opportunities
  where id = p_opportunity_id;

  if v_from is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;

  if p_to_stage = 'lost' then
    select count(*) into v_open
    from commercial.commercial_tasks
    where opportunity_id = p_opportunity_id
      and status = 'open';
    if v_open > 0 then
      return jsonb_build_object('ok', false, 'commercial_error_code', 'open_tasks_remaining');
    end if;
  end if;

  update commercial.commercial_opportunities
  set stage = p_to_stage,
      lost_reason = case when p_to_stage = 'lost' then btrim(p_reason) else lost_reason end,
      lost_at = case when p_to_stage = 'lost' then pg_catalog.now() else lost_at end
  where id = p_opportunity_id;

  insert into commercial.opportunity_stage_events (
    opportunity_id, from_stage, to_stage, actor_account_id, reason
  ) values (
    p_opportunity_id, v_from, p_to_stage, v_actor, nullif(btrim(coalesce(p_reason, '')), '')
  );

  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, after
  ) values (
    v_actor,
    'internal',
    'opportunity.stage',
    'commercial',
    'commercial_opportunities',
    p_opportunity_id,
    gen_random_uuid(),
    jsonb_build_object('from_stage', v_from, 'to_stage', p_to_stage)
  );

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function commercial.upsert_task(
  p_opportunity_id uuid,
  p_task_id uuid,
  p_title text,
  p_status text,
  p_due_at timestamptz,
  p_priority text,
  p_cancel_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, commercial
as $$
declare
  v_actor uuid;
  v_id uuid;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;

  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('crm.write') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;

  if p_status not in ('open', 'done', 'cancelled') or length(btrim(coalesce(p_title, ''))) = 0 then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  if p_status = 'cancelled' and length(btrim(coalesce(p_cancel_reason, ''))) = 0 then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  if p_priority is not null and p_priority not in ('low', 'normal', 'high') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  if not exists (
    select 1 from commercial.commercial_opportunities where id = p_opportunity_id
  ) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;

  if p_task_id is null then
    insert into commercial.commercial_tasks (
      opportunity_id, title, status, due_at, priority, cancel_reason, completed_at, created_by
    ) values (
      p_opportunity_id,
      btrim(p_title),
      p_status,
      p_due_at,
      p_priority,
      case when p_status = 'cancelled' then btrim(p_cancel_reason) else null end,
      case when p_status = 'done' then pg_catalog.now() else null end,
      v_actor
    ) returning id into v_id;
  else
    update commercial.commercial_tasks
    set title = btrim(p_title),
        status = p_status,
        due_at = p_due_at,
        priority = p_priority,
        cancel_reason = case when p_status = 'cancelled' then btrim(p_cancel_reason) else null end,
        completed_at = case when p_status = 'done' then coalesce(completed_at, pg_catalog.now()) else null end
    where id = p_task_id
      and opportunity_id = p_opportunity_id
    returning id into v_id;

    if v_id is null then
      return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
    end if;
  end if;

  return jsonb_build_object('ok', true, 'task_id', v_id);
end;
$$;

revoke all on function commercial.transition_opportunity(uuid, text, text) from public, anon, authenticated;
revoke all on function commercial.upsert_task(uuid, uuid, text, text, timestamptz, text, text) from public, anon, authenticated;
grant execute on function commercial.transition_opportunity(uuid, text, text) to authenticated;
grant execute on function commercial.upsert_task(uuid, uuid, text, text, timestamptz, text, text) to authenticated;
