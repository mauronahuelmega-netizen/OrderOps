-- P05-T03: commission availability window and setup release.
-- Does not assign founder slots or create settlements.

create or replace function commercial.refresh_commission_availability()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_actor uuid;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_row commercial.promoter_commissions%rowtype;
  v_collection commercial.platform_collections%rowtype;
  v_terms commercial.conversion_terms%rowtype;
  v_available_at timestamptz;
  v_hold boolean;
  v_completed boolean;
  v_next text;
  v_changed int := 0;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('collection.write') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;

  for v_row in
    select * from commercial.promoter_commissions
    where status in ('pending', 'available', 'held')
    order by id
    for update
  loop
    select * into v_collection from commercial.platform_collections where id = v_row.collection_id;
    select * into v_terms from commercial.conversion_terms where id = v_row.conversion_terms_id;
    v_available_at := coalesce(v_row.available_at, v_collection.posted_at + interval '15 days');
    v_hold := exists (
      select 1
      from commercial.attribution_disputes dispute
      where dispute.opportunity_id = v_terms.opportunity_id
        and dispute.economic_effect = 'hold_unpaid_commissions'
        and dispute.status <> 'closed'
    );
    v_completed := exists (
      select 1
      from commercial.onboarding_grants grant_row
      where grant_row.business_id = v_terms.won_business_id
        and grant_row.promoter_id = v_row.promoter_id
        and grant_row.status = 'completed'
    );
    if v_hold then
      v_next := 'held';
    elsif v_row.release_exception_by is not null and v_row.right_kind = 'setup' then
      v_next := 'available';
    elsif v_now < v_available_at then
      v_next := 'pending';
    elsif v_row.right_kind = 'recurring' then
      v_next := 'available';
    elsif v_completed then
      v_next := 'available';
    else
      v_next := 'pending';
    end if;

    if v_row.status is distinct from v_next or v_row.available_at is distinct from v_available_at then
      update commercial.promoter_commissions
      set status = v_next,
          available_at = v_available_at
      where id = v_row.id;
      v_changed := v_changed + 1;
    end if;
  end loop;

  return jsonb_build_object('ok', true, 'changed', v_changed, 'as_of', v_now);
end;
$$;

create or replace function commercial.release_setup_commission(
  p_commission_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_actor uuid;
  v_row commercial.promoter_commissions%rowtype;
  v_reason text := nullif(btrim(p_reason), '');
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('commission.release_exception') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if p_commission_id is null or v_reason is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  select * into v_row
  from commercial.promoter_commissions
  where id = p_commission_id
  for update;
  if v_row.id is null or v_row.right_kind <> 'setup' or v_row.status in ('paid', 'voided', 'in_settlement') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  update commercial.promoter_commissions
  set release_exception_reason = v_reason,
      release_exception_by = v_actor,
      status = 'available'
  where id = p_commission_id;

  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, reason, after
  ) values (
    v_actor, 'internal', 'commission.release_exception', 'commercial', 'promoter_commissions',
    p_commission_id, v_row.collection_id, v_reason,
    jsonb_build_object('status', 'available', 'right_kind', 'setup')
  );

  return jsonb_build_object('ok', true, 'commission_id', p_commission_id, 'status', 'available');
end;
$$;

revoke all on function commercial.refresh_commission_availability() from public, anon, authenticated, service_role;
revoke all on function commercial.release_setup_commission(uuid, text) from public, anon, authenticated, service_role;

create or replace function public.refresh_commission_availability()
returns jsonb
language sql
security definer
set search_path = pg_catalog, public, commercial
as $$ select commercial.refresh_commission_availability(); $$;

create or replace function public.release_setup_commission(p_commission_id uuid, p_reason text)
returns jsonb
language sql
security definer
set search_path = pg_catalog, public, commercial
as $$ select commercial.release_setup_commission(p_commission_id, p_reason); $$;

revoke all on function public.refresh_commission_availability() from public, anon, service_role;
revoke all on function public.release_setup_commission(uuid, text) from public, anon, service_role;
grant execute on function public.refresh_commission_availability() to authenticated;
grant execute on function public.release_setup_commission(uuid, text) to authenticated;
