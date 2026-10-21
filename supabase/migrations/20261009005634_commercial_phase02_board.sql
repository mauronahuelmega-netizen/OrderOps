-- P02-T05: read RPCs for the commercial board.
-- Support receives no CRM rows. Grant and onboarding relations do not exist yet.

create or replace function commercial.commercial_session()
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, commercial
as $$
declare
  v_account uuid := commercial.current_account_id();
  v_kind text;
  v_roles jsonb;
begin
  if auth.uid() is null or v_account is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;

  select kind into v_kind from commercial.platform_accounts where id = v_account;
  select coalesce(jsonb_agg(assignment.role), '[]'::jsonb) into v_roles
  from commercial.internal_role_assignments assignment
  where assignment.account_id = v_account
    and assignment.revoked_at is null;

  return jsonb_build_object('ok', true, 'account_id', v_account, 'kind', v_kind, 'roles', v_roles);
end;
$$;

create or replace function commercial.can_read_commercial_board()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, commercial
as $$
  select commercial.has_internal_role('superadmin') or commercial.has_internal_role('commercial');
$$;

create or replace function commercial.list_open_opportunities()
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, commercial
as $$
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  if not commercial.can_read_commercial_board() then
    return jsonb_build_object('ok', true, 'opportunities', '[]'::jsonb);
  end if;

  return jsonb_build_object(
    'ok', true,
    'opportunities', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', opportunity.id,
        'stage', opportunity.stage,
        'display_name', business.display_name,
        'created_at', opportunity.created_at
      ) order by opportunity.created_at desc)
      from commercial.commercial_opportunities opportunity
      join commercial.commercial_businesses business on business.id = opportunity.commercial_business_id
      where opportunity.archived_at is null
        and opportunity.stage not in ('won', 'lost')
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function commercial.opportunity_detail(p_opportunity_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, commercial
as $$
declare
  v_row jsonb;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  if not commercial.can_read_commercial_board() then
    return jsonb_build_object('ok', true, 'opportunity', null);
  end if;

  select jsonb_build_object(
    'id', opportunity.id,
    'stage', opportunity.stage,
    'display_name', business.display_name,
    'contacts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', contact.id,
        'full_name', contact.full_name,
        'role_label', contact.role_label
      ))
      from commercial.commercial_contacts contact
      where contact.commercial_business_id = business.id
    ), '[]'::jsonb),
    'interactions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', interaction.id,
        'kind', interaction.kind,
        'origin', interaction.origin,
        'occurred_at', interaction.occurred_at
      ) order by interaction.occurred_at)
      from commercial.commercial_interactions interaction
      where interaction.opportunity_id = opportunity.id
    ), '[]'::jsonb),
    'tasks', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', task.id,
        'title', task.title,
        'status', task.status,
        'due_at', task.due_at
      ))
      from commercial.commercial_tasks task
      where task.opportunity_id = opportunity.id
    ), '[]'::jsonb)
  ) into v_row
  from commercial.commercial_opportunities opportunity
  join commercial.commercial_businesses business on business.id = opportunity.commercial_business_id
  where opportunity.id = p_opportunity_id
    and opportunity.archived_at is null;

  return jsonb_build_object('ok', true, 'opportunity', v_row);
end;
$$;

revoke all on function commercial.commercial_session() from public, anon, authenticated;
revoke all on function commercial.can_read_commercial_board() from public, anon, authenticated;
revoke all on function commercial.list_open_opportunities() from public, anon, authenticated;
revoke all on function commercial.opportunity_detail(uuid) from public, anon, authenticated;

create or replace function public.commercial_session()
returns jsonb
language sql
security definer
set search_path = pg_catalog, commercial
as $$
  select commercial.commercial_session();
$$;

create or replace function public.list_open_opportunities()
returns jsonb
language sql
security definer
set search_path = pg_catalog, commercial
as $$
  select commercial.list_open_opportunities();
$$;

create or replace function public.opportunity_detail(p_opportunity_id uuid)
returns jsonb
language sql
security definer
set search_path = pg_catalog, commercial
as $$
  select commercial.opportunity_detail(p_opportunity_id);
$$;

create or replace function public.transition_opportunity(
  p_opportunity_id uuid,
  p_to_stage text,
  p_reason text
)
returns jsonb
language sql
security definer
set search_path = pg_catalog, commercial
as $$
  select commercial.transition_opportunity(p_opportunity_id, p_to_stage, p_reason);
$$;

create or replace function public.upsert_task(
  p_opportunity_id uuid,
  p_task_id uuid,
  p_title text,
  p_status text,
  p_due_at timestamptz,
  p_priority text,
  p_cancel_reason text
)
returns jsonb
language sql
security definer
set search_path = pg_catalog, commercial
as $$
  select commercial.upsert_task(p_opportunity_id, p_task_id, p_title, p_status, p_due_at, p_priority, p_cancel_reason);
$$;

revoke all on function public.commercial_session() from public;
revoke all on function public.list_open_opportunities() from public;
revoke all on function public.opportunity_detail(uuid) from public;
revoke all on function public.transition_opportunity(uuid, text, text) from public;
revoke all on function public.upsert_task(uuid, uuid, text, text, timestamptz, text, text) from public;
grant execute on function public.commercial_session() to authenticated;
grant execute on function public.list_open_opportunities() to authenticated;
grant execute on function public.opportunity_detail(uuid) to authenticated;
grant execute on function public.transition_opportunity(uuid, text, text) to authenticated;
grant execute on function public.upsert_task(uuid, uuid, text, text, timestamptz, text, text) to authenticated;
