-- Promoter task cancellation sends the required reason. No default reason.

drop function if exists public.promoter_upsert_task(uuid, uuid, text, text, timestamptz);
drop function if exists commercial.promoter_upsert_task(uuid, uuid, text, text, timestamptz);

create or replace function commercial.promoter_upsert_task(
  p_opportunity_id uuid,
  p_task_id uuid,
  p_title text,
  p_status text,
  p_due_at timestamptz,
  p_cancel_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, commercial
as $$
declare
  v_promoter uuid;
  v_account uuid;
  v_reason text;
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
  v_reason := nullif(btrim(coalesce(p_cancel_reason, '')), '');
  if p_status = 'cancelled' and v_reason is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  if p_task_id is null then
    insert into commercial.commercial_tasks (opportunity_id, title, status, due_at, assignee_account_id, priority, cancel_reason)
    values (p_opportunity_id, btrim(p_title), p_status, p_due_at, v_account, 'normal', case when p_status = 'cancelled' then v_reason else null end);
  else
    update commercial.commercial_tasks
    set title = btrim(p_title),
        status = p_status,
        due_at = p_due_at,
        cancel_reason = case when p_status = 'cancelled' then v_reason else cancel_reason end
    where id = p_task_id and opportunity_id = p_opportunity_id;
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.promoter_upsert_task(
  p_opportunity_id uuid,
  p_task_id uuid,
  p_title text,
  p_status text,
  p_due_at timestamptz,
  p_cancel_reason text default null
)
returns jsonb
language sql
security definer
set search_path = pg_catalog, commercial
as $$
  select commercial.promoter_upsert_task(
    p_opportunity_id, p_task_id, p_title, p_status, p_due_at, p_cancel_reason
  );
$$;

revoke all on function commercial.promoter_upsert_task(uuid, uuid, text, text, timestamptz, text) from public, anon, authenticated, service_role;
revoke all on function public.promoter_upsert_task(uuid, uuid, text, text, timestamptz, text) from public, anon, service_role;
grant execute on function public.promoter_upsert_task(uuid, uuid, text, text, timestamptz, text) to authenticated;
