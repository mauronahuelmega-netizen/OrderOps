-- P05-T05: reverse a collection without deleting history.
-- An unpaid commission is voided and its slot number is not reused.
-- A paid commission stays paid and a negative adjustment stays available for a later manual settlement.

create table commercial.commission_adjustments (
  id uuid primary key default gen_random_uuid(),
  commission_id uuid not null references commercial.promoter_commissions (id),
  amount_cents bigint not null,
  reason text not null,
  source text not null check (source in ('refund', 'chargeback', 'void', 'duplicate', 'correction', 'dispute')),
  status text not null check (status in ('pending', 'available', 'in_settlement', 'applied')),
  created_by uuid not null references commercial.platform_accounts (id),
  created_at timestamptz not null default pg_catalog.now()
);

alter table commercial.commission_adjustments enable row level security;
alter table commercial.commission_adjustments force row level security;
revoke all on table commercial.commission_adjustments from public, anon, authenticated;
grant select on table commercial.commission_adjustments to authenticated;

create policy commission_adjustments_select on commercial.commission_adjustments
  for select to authenticated
  using (
    commercial.has_permission('collection.write')
    or exists (
      select 1
      from commercial.promoter_commissions commission
      where commission.id = commission_adjustments.commission_id
        and commission.promoter_id = commercial.current_promoter_id()
    )
  );

create or replace function commercial.reverse_collection(p_collection_id uuid, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_actor uuid;
  v_collection commercial.platform_collections%rowtype;
  v_commission commercial.promoter_commissions%rowtype;
  v_adjustment uuid;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('collection.write') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if p_collection_id is null or p_reason is null or btrim(p_reason) = '' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  select * into v_collection from commercial.platform_collections where id = p_collection_id for update;
  if v_collection.id is null or v_collection.status = 'failed' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  if v_collection.status = 'reversed' then
    return jsonb_build_object('ok', true, 'duplicate', true, 'collection_id', v_collection.id, 'status', 'reversed');
  end if;

  update commercial.platform_collections
  set status = 'reversed', reversed_at = pg_catalog.clock_timestamp()
  where id = v_collection.id;

  select * into v_commission from commercial.promoter_commissions where collection_id = v_collection.id for update;
  if v_commission.id is not null and v_commission.status = 'paid' then
    insert into commercial.commission_adjustments (
      commission_id, amount_cents, reason, source, status, created_by
    ) values (
      v_commission.id, -v_commission.amount_cents, p_reason, 'void', 'available', v_actor
    ) returning id into v_adjustment;
  elsif v_commission.id is not null then
    update commercial.promoter_commissions set status = 'voided' where id = v_commission.id;
    update commercial.founder_slots set voided_at = pg_catalog.clock_timestamp()
    where collection_id = v_collection.id and voided_at is null;
  end if;

  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, after
  ) values (
    v_actor, 'internal', 'collection.reversed', 'commercial', 'platform_collections', v_collection.id, v_collection.id,
    jsonb_build_object('reason', p_reason, 'commission_status', v_commission.status, 'adjustment_id', v_adjustment)
  );

  return jsonb_build_object(
    'ok', true, 'duplicate', false, 'collection_id', v_collection.id,
    'commission_id', v_commission.id, 'adjustment_id', v_adjustment
  );
end;
$$;

create or replace function commercial.post_adjustment(
  p_commission_id uuid,
  p_amount_cents bigint,
  p_reason text,
  p_source text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_actor uuid;
  v_amount bigint;
  v_id uuid;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('collection.write') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if p_commission_id is null or p_amount_cents is null or p_amount_cents = 0
     or p_reason is null or btrim(p_reason) = ''
     or p_source not in ('refund', 'chargeback', 'void', 'duplicate', 'correction', 'dispute') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  select amount_cents into v_amount from commercial.promoter_commissions where id = p_commission_id;
  if v_amount is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  insert into commercial.commission_adjustments (
    commission_id, amount_cents, reason, source, status, created_by
  ) values (
    p_commission_id, p_amount_cents, p_reason, p_source, 'available', v_actor
  ) returning id into v_id;
  if (select amount_cents from commercial.promoter_commissions where id = p_commission_id) is distinct from v_amount then
    raise exception 'commission amount changed';
  end if;
  return jsonb_build_object('ok', true, 'adjustment_id', v_id, 'amount_cents', p_amount_cents, 'status', 'available');
end;
$$;

revoke all on function commercial.reverse_collection(uuid, text) from public, anon, authenticated, service_role;
revoke all on function commercial.post_adjustment(uuid, bigint, text, text) from public, anon, authenticated, service_role;

create or replace function public.reverse_collection(p_collection_id uuid, p_reason text)
returns jsonb language sql security definer set search_path = pg_catalog, public, commercial
as $$ select commercial.reverse_collection(p_collection_id, p_reason); $$;

create or replace function public.post_adjustment(p_commission_id uuid, p_amount_cents bigint, p_reason text, p_source text)
returns jsonb language sql security definer set search_path = pg_catalog, public, commercial
as $$ select commercial.post_adjustment(p_commission_id, p_amount_cents, p_reason, p_source); $$;

revoke all on function public.reverse_collection(uuid, text) from public, anon, service_role;
revoke all on function public.post_adjustment(uuid, bigint, text, text) from public, anon, service_role;
grant execute on function public.reverse_collection(uuid, text) to authenticated;
grant execute on function public.post_adjustment(uuid, bigint, text, text) to authenticated;
