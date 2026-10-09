-- P03-T07: promoter panel reads and writes. No service role. No won. No attribution confirm.

create or replace function commercial.promoter_session()
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, commercial
as $$
declare
  v_promoter uuid;
  v_status text;
  v_name text;
  v_code text;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_promoter := commercial.current_promoter_id();
  if v_promoter is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  select status, legal_name, public_code into v_status, v_name, v_code
  from commercial.promoters where id = v_promoter;
  return jsonb_build_object(
    'ok', true,
    'promoter_id', v_promoter,
    'status', v_status,
    'legal_name', v_name,
    'public_code', v_code,
    'can_operate', commercial.promoter_can_operate(v_status)
  );
end;
$$;

create or replace function commercial.promoter_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, commercial
as $$
declare
  v_promoter uuid;
  v_account uuid;
begin
  v_promoter := commercial.current_promoter_id();
  if auth.uid() is null or v_promoter is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  select account_id into v_account from commercial.promoters where id = v_promoter;
  return jsonb_build_object(
    'ok', true,
    'businesses', coalesce((
      select jsonb_agg(jsonb_build_object('id', business.id, 'display_name', business.display_name) order by business.created_at)
      from commercial.commercial_businesses business
      where business.id in (
        select claim.commercial_business_id from commercial.attribution_claims claim where claim.promoter_id = v_promoter
        union
        select opportunity.commercial_business_id from commercial.commercial_opportunities opportunity where opportunity.owner_account_id = v_account
      )
    ), '[]'::jsonb),
    'opportunities', coalesce((
      select jsonb_agg(jsonb_build_object('id', opportunity.id, 'stage', opportunity.stage, 'business_id', opportunity.commercial_business_id) order by opportunity.created_at)
      from commercial.commercial_opportunities opportunity
      where opportunity.owner_account_id = v_account
        or opportunity.id in (
          select claim.opportunity_id from commercial.attribution_claims claim
          where claim.promoter_id = v_promoter and claim.opportunity_id is not null
        )
    ), '[]'::jsonb),
    'claims', coalesce((
      select jsonb_agg(jsonb_build_object('id', claim.id, 'status', claim.status, 'business_id', claim.commercial_business_id) order by claim.created_at)
      from commercial.attribution_claims claim
      where claim.promoter_id = v_promoter
    ), '[]'::jsonb),
    'tasks', coalesce((
      select jsonb_agg(jsonb_build_object('id', task.id, 'title', task.title, 'status', task.status, 'due_at', task.due_at, 'opportunity_id', task.opportunity_id))
      from commercial.commercial_tasks task
      where task.opportunity_id in (
        select opportunity.id from commercial.commercial_opportunities opportunity where opportunity.owner_account_id = v_account
      )
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function commercial.register_promoter_business(
  p_trade_name text,
  p_whatsapp text,
  p_trade_category text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, commercial
as $$
declare
  v_promoter uuid;
  v_account uuid;
  v_prepared jsonb;
  v_business uuid;
  v_opportunity uuid;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_promoter := commercial.current_promoter_id();
  if v_promoter is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  select account_id into v_account from commercial.promoters where id = v_promoter and status = 'active';
  if v_account is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'promoter_not_active');
  end if;
  if length(btrim(coalesce(p_trade_name, ''))) = 0 or length(btrim(coalesce(p_whatsapp, ''))) = 0 or length(btrim(coalesce(p_trade_category, ''))) = 0 then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  v_prepared := commercial.find_or_prepare_business(btrim(p_trade_name), p_whatsapp, null, 'promoter');
  if v_prepared->>'ok' is distinct from 'true' then
    return v_prepared;
  end if;
  v_business := (v_prepared->>'business_id')::uuid;
  select id into v_opportunity
  from commercial.commercial_opportunities
  where commercial_business_id = v_business and stage not in ('won', 'lost') and archived_at is null
  limit 1;
  if v_opportunity is null then
    insert into commercial.commercial_opportunities (commercial_business_id, stage, owner_account_id)
    values (v_business, 'new', v_account)
    returning id into v_opportunity;
  end if;
  return jsonb_build_object('ok', true, 'business_id', v_business, 'opportunity_id', v_opportunity);
end;
$$;

create or replace function commercial.promoter_add_note(p_opportunity_id uuid, p_body text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, commercial
as $$
declare
  v_promoter uuid;
  v_account uuid;
  v_business uuid;
begin
  v_promoter := commercial.current_promoter_id();
  if v_promoter is null or not commercial.promoter_can_operate((select status from commercial.promoters where id = v_promoter)) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'promoter_not_active');
  end if;
  select account_id into v_account from commercial.promoters where id = v_promoter;
  select commercial_business_id into v_business
  from commercial.commercial_opportunities
  where id = p_opportunity_id and owner_account_id = v_account;
  if v_business is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  insert into commercial.commercial_interactions (
    commercial_business_id, opportunity_id, kind, channel, origin, actor_account_id, body, occurred_at
  )
  select v_business, p_opportunity_id, 'note', 'web', promoter.public_code, v_account, btrim(p_body), pg_catalog.now()
  from commercial.promoters promoter where promoter.id = v_promoter;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function commercial.promoter_transition_opportunity(
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
  v_promoter uuid;
  v_account uuid;
  v_from text;
  v_open int;
begin
  v_promoter := commercial.current_promoter_id();
  if auth.uid() is null or v_promoter is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if not commercial.promoter_can_operate((select status from commercial.promoters where id = v_promoter)) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'promoter_not_active');
  end if;
  if p_to_stage = 'won' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if p_to_stage not in ('contacting', 'qualified', 'demo_scheduled', 'demo_done', 'follow_up', 'lost') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  if p_to_stage = 'lost' and length(btrim(coalesce(p_reason, ''))) = 0 then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'lost_reason_required');
  end if;
  select account_id into v_account from commercial.promoters where id = v_promoter;
  select stage into v_from
  from commercial.commercial_opportunities
  where id = p_opportunity_id and owner_account_id = v_account;
  if v_from is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if p_to_stage = 'lost' then
    select count(*) into v_open from commercial.commercial_tasks
    where opportunity_id = p_opportunity_id and status = 'open';
    if v_open > 0 then
      return jsonb_build_object('ok', false, 'commercial_error_code', 'open_tasks_remaining');
    end if;
  end if;
  update commercial.commercial_opportunities
  set stage = p_to_stage,
      lost_reason = case when p_to_stage = 'lost' then btrim(p_reason) else lost_reason end,
      lost_at = case when p_to_stage = 'lost' then pg_catalog.now() else lost_at end
  where id = p_opportunity_id;
  insert into commercial.opportunity_stage_events (opportunity_id, from_stage, to_stage, actor_account_id, reason)
  values (p_opportunity_id, v_from, p_to_stage, v_account, nullif(btrim(coalesce(p_reason, '')), ''));
  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, after
  ) values (
    v_account, 'promoter', 'opportunity.stage', 'commercial', 'commercial_opportunities', p_opportunity_id,
    gen_random_uuid(), jsonb_build_object('from_stage', v_from, 'to_stage', p_to_stage)
  );
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function commercial.promoter_upsert_task(
  p_opportunity_id uuid,
  p_task_id uuid,
  p_title text,
  p_status text,
  p_due_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, commercial
as $$
declare
  v_promoter uuid;
  v_account uuid;
begin
  v_promoter := commercial.current_promoter_id();
  if v_promoter is null or not commercial.promoter_can_operate((select status from commercial.promoters where id = v_promoter)) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'promoter_not_active');
  end if;
  select account_id into v_account from commercial.promoters where id = v_promoter;
  if not exists (
    select 1 from commercial.commercial_opportunities
    where id = p_opportunity_id and owner_account_id = v_account
  ) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if p_status not in ('open', 'done', 'cancelled') or length(btrim(coalesce(p_title, ''))) = 0 then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  if p_task_id is null then
    insert into commercial.commercial_tasks (opportunity_id, title, status, due_at, assignee_account_id, priority)
    values (p_opportunity_id, btrim(p_title), p_status, p_due_at, v_account, 'normal');
  else
    update commercial.commercial_tasks
    set title = btrim(p_title), status = p_status, due_at = p_due_at
    where id = p_task_id and opportunity_id = p_opportunity_id;
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function commercial.promoter_session() from public, anon, service_role;
revoke all on function commercial.promoter_overview() from public, anon, service_role;
revoke all on function commercial.register_promoter_business(text, text, text) from public, anon, authenticated, service_role;
revoke all on function commercial.promoter_add_note(uuid, text) from public, anon, authenticated, service_role;
revoke all on function commercial.promoter_transition_opportunity(uuid, text, text) from public, anon, authenticated, service_role;
revoke all on function commercial.promoter_upsert_task(uuid, uuid, text, text, timestamptz) from public, anon, authenticated, service_role;
grant execute on function commercial.promoter_session() to authenticated;
grant execute on function commercial.promoter_overview() to authenticated;

create or replace function public.promoter_session()
returns jsonb language sql security definer set search_path = pg_catalog, commercial
as $$ select commercial.promoter_session(); $$;
create or replace function public.promoter_overview()
returns jsonb language sql security definer set search_path = pg_catalog, commercial
as $$ select commercial.promoter_overview(); $$;
create or replace function public.register_promoter_business(p_trade_name text, p_whatsapp text, p_trade_category text)
returns jsonb language sql security definer set search_path = pg_catalog, commercial
as $$ select commercial.register_promoter_business(p_trade_name, p_whatsapp, p_trade_category); $$;
create or replace function public.promoter_add_note(p_opportunity_id uuid, p_body text)
returns jsonb language sql security definer set search_path = pg_catalog, commercial
as $$ select commercial.promoter_add_note(p_opportunity_id, p_body); $$;
create or replace function public.promoter_transition_opportunity(p_opportunity_id uuid, p_to_stage text, p_reason text)
returns jsonb language sql security definer set search_path = pg_catalog, commercial
as $$ select commercial.promoter_transition_opportunity(p_opportunity_id, p_to_stage, p_reason); $$;
create or replace function public.promoter_upsert_task(
  p_opportunity_id uuid, p_task_id uuid, p_title text, p_status text, p_due_at timestamptz
)
returns jsonb language sql security definer set search_path = pg_catalog, commercial
as $$ select commercial.promoter_upsert_task(p_opportunity_id, p_task_id, p_title, p_status, p_due_at); $$;
create or replace function public.create_claim(p_commercial_business_id uuid, p_opportunity_id uuid)
returns jsonb language sql security definer set search_path = pg_catalog, commercial
as $$ select commercial.create_claim(p_commercial_business_id, p_opportunity_id); $$;

revoke all on function public.promoter_session() from public, anon, service_role;
revoke all on function public.promoter_overview() from public, anon, service_role;
revoke all on function public.register_promoter_business(text, text, text) from public, anon, service_role;
revoke all on function public.promoter_add_note(uuid, text) from public, anon, service_role;
revoke all on function public.promoter_transition_opportunity(uuid, text, text) from public, anon, service_role;
grant execute on function public.promoter_session() to authenticated;
grant execute on function public.promoter_overview() to authenticated;
grant execute on function public.register_promoter_business(text, text, text) to authenticated;
grant execute on function public.promoter_add_note(uuid, text) to authenticated;
revoke all on function public.promoter_upsert_task(uuid, uuid, text, text, timestamptz) from public, anon, service_role;
grant execute on function public.promoter_transition_opportunity(uuid, text, text) to authenticated;
grant execute on function public.promoter_upsert_task(uuid, uuid, text, text, timestamptz) to authenticated;
