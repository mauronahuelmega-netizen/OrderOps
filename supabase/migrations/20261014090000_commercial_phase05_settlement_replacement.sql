-- CC-P05-REV-01. Unpaid settlements that contain a reversed right are invalidated.
-- A replacement is a new draft and does not inherit approval or invoices.
-- A settlement with a successful payment that is not fully paid is frozen for manual reconciliation.
-- A fully paid settlement stays intact and keeps the negative adjustment from the reversal.

alter table commercial.promoter_settlements drop constraint promoter_settlements_status_check;
alter table commercial.promoter_settlements add constraint promoter_settlements_status_check check (
  status in (
    'draft', 'approved', 'invoiced', 'payable', 'partially_paid', 'paid', 'void',
    'invalidated', 'reconciliation_required'
  )
);

alter table commercial.promoter_settlements
  add column replaces_settlement_id uuid references commercial.promoter_settlements (id),
  add column invalidation_reason text,
  add column invalidated_at timestamptz,
  add column invalidated_by uuid references commercial.platform_accounts (id),
  add column reconciliation_reason text,
  add column reconciliation_required_at timestamptz,
  add constraint promoter_settlements_no_self_replacement_chk check (
    replaces_settlement_id is null or replaces_settlement_id <> id
  );

alter table commercial.promoter_settlements drop constraint promoter_settlements_promoter_id_period_key_key;
create unique index promoter_settlements_one_active_period_idx
  on commercial.promoter_settlements (promoter_id, period_key)
  where status <> 'invalidated';
create unique index promoter_settlements_one_active_replacement_idx
  on commercial.promoter_settlements (replaces_settlement_id)
  where replaces_settlement_id is not null and status <> 'invalidated';

alter table commercial.settlement_items
  add column lineage text not null default 'active' check (lineage in ('active', 'historical'));
alter table commercial.settlement_items drop constraint settlement_items_source_kind_source_id_key;
create unique index settlement_items_one_active_source_idx
  on commercial.settlement_items (source_kind, source_id)
  where lineage = 'active';

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
  v_settlement commercial.promoter_settlements%rowtype;
  v_adjustment uuid;
  v_recorded bigint;
  v_paid_path boolean := false;
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

  for v_settlement in
    select s.*
    from commercial.settlement_items item
    join commercial.promoter_settlements s on s.id = item.settlement_id
    join commercial.promoter_commissions commission on commission.id = item.source_id
    where item.source_kind = 'commission'
      and item.lineage = 'active'
      and commission.collection_id = v_collection.id
      and s.status <> 'invalidated'
    order by s.id
    for update of s
  loop
    select coalesce(sum(amount_cents), 0) into v_recorded
    from commercial.settlement_payments
    where settlement_id = v_settlement.id and status = 'recorded';
    if v_recorded >= v_settlement.total_cents and v_settlement.total_cents > 0 then
      v_paid_path := true;
    end if;
  end loop;

  select * into v_commission from commercial.promoter_commissions where collection_id = v_collection.id for update;
  if v_commission.status = 'paid' then
    v_paid_path := true;
  end if;

  update commercial.platform_collections
  set status = 'reversed', reversed_at = pg_catalog.clock_timestamp()
  where id = v_collection.id;

  if v_commission.id is not null and v_paid_path then
    insert into commercial.commission_adjustments (
      commission_id, amount_cents, reason, source, status, created_by
    ) values (
      v_commission.id, -v_commission.amount_cents, p_reason, 'void', 'available', v_actor
    ) returning id into v_adjustment;
  elsif v_commission.id is not null then
    update commercial.promoter_commissions set status = 'voided' where id = v_commission.id;
    update commercial.founder_slots set voided_at = pg_catalog.clock_timestamp()
    where collection_id = v_collection.id and voided_at is null;

    for v_settlement in
      select s.*
      from commercial.settlement_items item
      join commercial.promoter_settlements s on s.id = item.settlement_id
      where item.source_kind = 'commission'
        and item.lineage = 'active'
        and item.source_id = v_commission.id
        and s.status <> 'invalidated'
      order by s.id
      for update of s
    loop
      select coalesce(sum(amount_cents), 0) into v_recorded
      from commercial.settlement_payments
      where settlement_id = v_settlement.id and status = 'recorded';
      if v_recorded > 0 then
        update commercial.promoter_settlements
        set status = 'reconciliation_required',
            reconciliation_required_at = pg_catalog.clock_timestamp(),
            reconciliation_reason = p_reason
        where id = v_settlement.id
          and status <> 'reconciliation_required';
        insert into commercial.audit_events (
          actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, after
        ) values (
          v_actor, 'internal', 'settlement.reconciliation_required', 'commercial', 'promoter_settlements', v_settlement.id, v_collection.id,
          jsonb_build_object('reason', p_reason, 'recorded_cents', v_recorded, 'total_cents', v_settlement.total_cents)
        );
      else
        update commercial.promoter_commissions
        set status = 'available'
        where status = 'in_settlement'
          and id in (
            select source_id from commercial.settlement_items
            where settlement_id = v_settlement.id and source_kind = 'commission' and lineage = 'active'
          );
        update commercial.commission_adjustments
        set status = 'available'
        where status = 'in_settlement'
          and id in (
            select source_id from commercial.settlement_items
            where settlement_id = v_settlement.id and source_kind = 'adjustment' and lineage = 'active'
          );
        update commercial.settlement_items
        set lineage = 'historical'
        where settlement_id = v_settlement.id and lineage = 'active';
        update commercial.promoter_settlements
        set status = 'invalidated',
            invalidated_at = pg_catalog.clock_timestamp(),
            invalidated_by = v_actor,
            invalidation_reason = p_reason
        where id = v_settlement.id;
        insert into commercial.audit_events (
          actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, after
        ) values (
          v_actor, 'internal', 'settlement.invalidated', 'commercial', 'promoter_settlements', v_settlement.id, v_collection.id,
          jsonb_build_object('reason', p_reason, 'previous_status', v_settlement.status, 'total_cents', v_settlement.total_cents)
        );
      end if;
    end loop;
  end if;

  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, after
  ) values (
    v_actor, 'internal', 'collection.reversed', 'commercial', 'platform_collections', v_collection.id, v_collection.id,
    jsonb_build_object('reason', p_reason, 'commission_status', v_commission.status, 'adjustment_id', v_adjustment, 'paid_path', v_paid_path)
  );

  return jsonb_build_object(
    'ok', true, 'duplicate', false, 'collection_id', v_collection.id,
    'commission_id', v_commission.id, 'adjustment_id', v_adjustment, 'paid_path', v_paid_path
  );
end;
$$;

create or replace function commercial.replace_settlement(p_settlement_id uuid, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_actor uuid;
  v_source commercial.promoter_settlements%rowtype;
  v_existing commercial.promoter_settlements%rowtype;
  v_walk uuid;
  v_next uuid;
  v_guard int := 0;
  v_recorded bigint;
  v_id uuid;
  v_total bigint := 0;
  v_start timestamptz;
  v_end timestamptz;
  v_row record;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('collection.write') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if p_settlement_id is null or p_reason is null or btrim(p_reason) = '' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  select * into v_source from commercial.promoter_settlements where id = p_settlement_id for update;
  if v_source.id is null or v_source.status <> 'invalidated' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  select coalesce(sum(amount_cents), 0) into v_recorded
  from commercial.settlement_payments
  where settlement_id = v_source.id and status = 'recorded';
  if v_recorded > 0 then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'reconciliation_required');
  end if;

  select * into v_existing
  from commercial.promoter_settlements
  where replaces_settlement_id = v_source.id and status <> 'invalidated'
  for update;
  if v_existing.id is not null then
    return jsonb_build_object('ok', true, 'duplicate', true, 'settlement_id', v_existing.id, 'status', v_existing.status);
  end if;

  v_walk := v_source.id;
  loop
    v_guard := v_guard + 1;
    if v_guard > 32 then
      return jsonb_build_object('ok', false, 'commercial_error_code', 'settlement_cycle');
    end if;
    select replaces_settlement_id into v_next from commercial.promoter_settlements where id = v_walk;
    exit when v_next is null;
    if v_next = p_settlement_id then
      return jsonb_build_object('ok', false, 'commercial_error_code', 'settlement_cycle');
    end if;
    v_walk := v_next;
  end loop;

  v_start := (v_source.period_key || '-01')::date::timestamp at time zone 'America/Argentina/Buenos_Aires';
  v_end := v_start + interval '1 month';
  insert into commercial.promoter_settlements (
    promoter_id, period_key, timezone, status, prepared_by, total_cents, due_on, replaces_settlement_id
  ) values (
    v_source.promoter_id, v_source.period_key, v_source.timezone, 'draft', v_actor, 0, v_source.due_on, v_source.id
  ) returning id into v_id;

  for v_row in
    select id, amount_cents, right_kind
    from commercial.promoter_commissions
    where promoter_id = v_source.promoter_id
      and status = 'available'
      and available_at >= v_start
      and available_at < v_end
      and (
        right_kind <> 'recurring'
        or commercial.eligible_recurring_rank(id) <= (
          select terms.max_recurring_slots from commercial.conversion_terms terms
          where terms.id = promoter_commissions.conversion_terms_id
        )
      )
    order by available_at, id
    for update
  loop
    insert into commercial.settlement_items (settlement_id, source_kind, source_id, amount_cents, label, lineage)
    values (v_id, 'commission', v_row.id, v_row.amount_cents, v_row.right_kind, 'active');
    update commercial.promoter_commissions set status = 'in_settlement' where id = v_row.id;
    v_total := v_total + v_row.amount_cents;
  end loop;

  for v_row in
    select adjustment.id, adjustment.amount_cents, adjustment.source
    from commercial.settlement_items item
    join commercial.commission_adjustments adjustment on adjustment.id = item.source_id
    where item.settlement_id = v_source.id
      and item.source_kind = 'adjustment'
      and item.lineage = 'historical'
      and adjustment.status = 'available'
    order by adjustment.id
    for update of adjustment
  loop
    insert into commercial.settlement_items (settlement_id, source_kind, source_id, amount_cents, label, lineage)
    values (v_id, 'adjustment', v_row.id, v_row.amount_cents, v_row.source, 'active');
    update commercial.commission_adjustments set status = 'in_settlement' where id = v_row.id;
    v_total := v_total + v_row.amount_cents;
  end loop;

  if v_total < 0 then
    raise exception 'settlement total is negative';
  end if;
  update commercial.promoter_settlements set total_cents = v_total where id = v_id;
  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, after
  ) values (
    v_actor, 'internal', 'settlement.replacement_created', 'commercial', 'promoter_settlements', v_id, v_source.id,
    jsonb_build_object('replaces_settlement_id', v_source.id, 'reason', p_reason, 'total_cents', v_total)
  );
  return jsonb_build_object(
    'ok', true, 'duplicate', false, 'settlement_id', v_id, 'status', 'draft', 'total_cents', v_total
  );
end;
$$;

revoke all on function commercial.replace_settlement(uuid, text) from public, anon, authenticated, service_role;
create or replace function public.replace_settlement(p_settlement_id uuid, p_reason text)
returns jsonb language sql security definer set search_path = pg_catalog, public, commercial
as $$ select commercial.replace_settlement(p_settlement_id, p_reason); $$;
revoke all on function public.replace_settlement(uuid, text) from public, anon, service_role;
grant execute on function public.replace_settlement(uuid, text) to authenticated;

create or replace function commercial.prepare_settlement(
  p_promoter_id uuid,
  p_period_key text,
  p_adjustment_ids uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_actor uuid;
  v_existing commercial.promoter_settlements%rowtype;
  v_start timestamptz;
  v_end timestamptz;
  v_id uuid;
  v_total bigint := 0;
  v_due date;
  v_row record;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('collection.write') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if p_promoter_id is null or p_period_key is null or p_period_key !~ '^[0-9]{4}-[0-9]{2}$' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  perform 1 from commercial.promoter_settlements
  where promoter_id = p_promoter_id and period_key = p_period_key
  order by id
  for update;
  select * into v_existing from commercial.promoter_settlements
  where promoter_id = p_promoter_id and period_key = p_period_key
    and status <> 'invalidated'
  for update;
  if v_existing.id is null and exists (
    select 1 from commercial.promoter_settlements
    where promoter_id = p_promoter_id and period_key = p_period_key and status = 'invalidated'
  ) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'replacement_required');
  end if;
  if v_existing.id is not null and v_existing.status = 'draft' then
    return jsonb_build_object('ok', true, 'duplicate', true, 'settlement_id', v_existing.id, 'status', 'draft');
  end if;
  if v_existing.id is not null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'settlement_exists', 'status', v_existing.status);
  end if;

  v_start := (p_period_key || '-01')::date::timestamp at time zone 'America/Argentina/Buenos_Aires';
  v_end := v_start + interval '1 month';
  v_due := ((p_period_key || '-01')::date + interval '1 month')::date + 9;

  insert into commercial.promoter_settlements (
    promoter_id, period_key, timezone, status, prepared_by, total_cents, due_on
  ) values (
    p_promoter_id, p_period_key, 'America/Argentina/Buenos_Aires', 'draft', v_actor, 0, v_due
  ) returning id into v_id;

  for v_row in
    select id, amount_cents, right_kind
    from commercial.promoter_commissions
    where promoter_id = p_promoter_id
      and status = 'available'
      and available_at >= v_start
      and available_at < v_end
      and (
        right_kind <> 'recurring'
        or commercial.eligible_recurring_rank(id) <= (
          select terms.max_recurring_slots
          from commercial.conversion_terms terms
          where terms.id = promoter_commissions.conversion_terms_id
        )
      )
    order by available_at, id
    for update
  loop
    insert into commercial.settlement_items (settlement_id, source_kind, source_id, amount_cents, label)
    values (v_id, 'commission', v_row.id, v_row.amount_cents, v_row.right_kind);
    update commercial.promoter_commissions set status = 'in_settlement' where id = v_row.id;
    v_total := v_total + v_row.amount_cents;
  end loop;

  if p_adjustment_ids is not null then
    for v_row in
      select adjustment.id, adjustment.amount_cents, adjustment.source
      from commercial.commission_adjustments adjustment
      join commercial.promoter_commissions commission on commission.id = adjustment.commission_id
      where adjustment.id = any (p_adjustment_ids)
        and commission.promoter_id = p_promoter_id
        and adjustment.status = 'available'
      order by adjustment.id
      for update of adjustment
    loop
      insert into commercial.settlement_items (settlement_id, source_kind, source_id, amount_cents, label)
      values (v_id, 'adjustment', v_row.id, v_row.amount_cents, v_row.source);
      update commercial.commission_adjustments set status = 'in_settlement' where id = v_row.id;
      v_total := v_total + v_row.amount_cents;
    end loop;
  end if;

  if v_total < 0 then
    raise exception 'settlement total is negative';
  end if;
  update commercial.promoter_settlements set total_cents = v_total where id = v_id;

  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, after
  ) values (
    v_actor, 'internal', 'settlement.prepared', 'commercial', 'promoter_settlements', v_id, v_id,
    jsonb_build_object('period_key', p_period_key, 'total_cents', v_total, 'due_on', v_due)
  );

  return jsonb_build_object('ok', true, 'duplicate', false, 'settlement_id', v_id, 'total_cents', v_total, 'due_on', v_due);
end;
$$;


create or replace function commercial.record_settlement_payment(
  p_settlement_id uuid,
  p_idempotency_key text,
  p_amount_cents bigint,
  p_status text,
  p_bank_reference text,
  p_receipt_path text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_actor uuid;
  v_settlement commercial.promoter_settlements%rowtype;
  v_existing commercial.settlement_payments%rowtype;
  v_bank commercial.promoter_bank_accounts%rowtype;
  v_paid bigint;
  v_id uuid;
  v_next text;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('collection.write') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if p_idempotency_key is null or btrim(p_idempotency_key) = ''
     or p_amount_cents is null or p_amount_cents <= 0
     or p_status not in ('recorded', 'failed') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  select * into v_existing from commercial.settlement_payments where idempotency_key = p_idempotency_key;
  if v_existing.id is not null then
    return jsonb_build_object('ok', true, 'duplicate', true, 'payment_id', v_existing.id, 'status', v_existing.status);
  end if;

  select * into v_settlement from commercial.promoter_settlements where id = p_settlement_id for update;
  if v_settlement.id is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  if v_settlement.status = 'reconciliation_required' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'reconciliation_required');
  end if;
  if v_settlement.status = 'invalidated' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'settlement_invalidated');
  end if;
  if v_settlement.status not in ('payable', 'partially_paid') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  if exists (
    select 1
    from commercial.settlement_items item
    join commercial.promoter_commissions commission on commission.id = item.source_id
    where item.settlement_id = v_settlement.id
      and item.source_kind = 'commission'
      and item.lineage = 'active'
      and commission.status = 'voided'
  ) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'settlement_has_voided_rights');
  end if;
  if v_actor = v_settlement.approved_by and not exists (
    select 1 from commercial.audit_events
    where action = 'payment.sod_exception' and entity_id = v_settlement.id
  ) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'sod_conflict');
  end if;

  select * into v_bank from commercial.promoter_bank_accounts
  where promoter_id = v_settlement.promoter_id and is_current and disabled_at is null
  order by created_at desc limit 1;
  if v_bank.id is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  select coalesce(sum(amount_cents), 0) into v_paid
  from commercial.settlement_payments
  where settlement_id = v_settlement.id and status = 'recorded';
  if p_status = 'recorded' and v_paid + p_amount_cents > v_settlement.total_cents then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'amount_exceeds_total');
  end if;

  insert into commercial.settlement_payments (
    settlement_id, idempotency_key, amount_cents, status, bank_account_id, destination_snapshot,
    bank_reference, receipt_path, recorded_by, paid_at
  ) values (
    v_settlement.id, p_idempotency_key, p_amount_cents, p_status, v_bank.id,
    jsonb_build_object('holder_name', v_bank.holder_name, 'cbu_or_cvu', v_bank.cbu_or_cvu),
    nullif(btrim(coalesce(p_bank_reference, '')), ''),
    nullif(btrim(coalesce(p_receipt_path, '')), ''),
    v_actor,
    case when p_status = 'recorded' then pg_catalog.clock_timestamp() else null end
  ) returning id into v_id;

  if p_status = 'recorded' then
    v_paid := v_paid + p_amount_cents;
    v_next := case when v_paid = v_settlement.total_cents then 'paid' else 'partially_paid' end;
    update commercial.promoter_settlements set status = v_next where id = v_settlement.id;
    if v_next = 'paid' then
      update commercial.promoter_commissions
      set status = 'paid'
      where status = 'in_settlement'
        and id in (
          select source_id from commercial.settlement_items
          where settlement_id = v_settlement.id and source_kind = 'commission'
        );
      update commercial.commission_adjustments
      set status = 'applied'
      where id in (
        select source_id from commercial.settlement_items
        where settlement_id = v_settlement.id and source_kind = 'adjustment'
      );
    end if;
  end if;

  perform commercial.enqueue(
    'payment.recorded',
    jsonb_build_object('payment_id', v_id, 'settlement_id', v_settlement.id, 'status', p_status, 'amount_cents', p_amount_cents),
    v_id
  );
  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, after
  ) values (
    v_actor, 'internal', 'payment.recorded', 'commercial', 'settlement_payments', v_id, v_settlement.id,
    jsonb_build_object('status', p_status, 'amount_cents', p_amount_cents)
  );

  return jsonb_build_object('ok', true, 'duplicate', false, 'payment_id', v_id, 'status', p_status);
end;
$$;



create or replace function commercial.approve_settlement(p_settlement_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_actor uuid;
  v_row commercial.promoter_settlements%rowtype;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('collection.write') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  select * into v_row from commercial.promoter_settlements where id = p_settlement_id for update;
  if v_row.id is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  if v_row.status = 'invalidated' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'settlement_invalidated');
  end if;
  if v_row.status = 'reconciliation_required' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'reconciliation_required');
  end if;
  if v_row.status <> 'draft' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  if exists (
    select 1
    from commercial.settlement_items item
    join commercial.promoter_commissions commission on commission.id = item.source_id
    where item.settlement_id = v_row.id
      and item.source_kind = 'commission'
      and item.lineage = 'active'
      and commission.status = 'voided'
  ) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'settlement_has_voided_rights');
  end if;
  if v_actor = v_row.prepared_by then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'sod_conflict');
  end if;
  update commercial.promoter_settlements
  set status = 'approved', approved_by = v_actor, approved_at = pg_catalog.clock_timestamp()
  where id = v_row.id;
  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, after
  ) values (
    v_actor, 'internal', 'settlement.approved', 'commercial', 'promoter_settlements', v_row.id, v_row.id,
    jsonb_build_object('prepared_by', v_row.prepared_by, 'approved_by', v_actor)
  );
  return jsonb_build_object('ok', true, 'settlement_id', v_row.id, 'status', 'approved');
end;
$$;


create or replace function commercial.review_invoice(p_invoice_id uuid, p_decision text, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, commercial
as $$
declare
  v_actor uuid;
  v_invoice commercial.promoter_invoices%rowtype;
  v_total bigint;
  v_status text;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;
  v_actor := commercial.current_account_id();
  if v_actor is null or not commercial.has_permission('collection.write') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'forbidden');
  end if;
  if p_decision not in ('accepted', 'rejected') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  select * into v_invoice from commercial.promoter_invoices where id = p_invoice_id for update;
  if v_invoice.id is null or v_invoice.status <> 'submitted' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  select total_cents, status into v_total, v_status
  from commercial.promoter_settlements where id = v_invoice.settlement_id for update;
  if v_status = 'invalidated' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'settlement_invalidated');
  end if;
  if v_status = 'reconciliation_required' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'reconciliation_required');
  end if;
  if p_decision = 'accepted' and v_status is distinct from 'approved' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  if p_decision = 'accepted' and exists (
    select 1
    from commercial.settlement_items item
    join commercial.promoter_commissions commission on commission.id = item.source_id
    where item.settlement_id = v_invoice.settlement_id
      and item.source_kind = 'commission'
      and item.lineage = 'active'
      and commission.status = 'voided'
  ) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'settlement_has_voided_rights');
  end if;
  if p_decision = 'accepted' and v_invoice.amount_cents is distinct from v_total then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'amount_mismatch');
  end if;
  if p_decision = 'rejected' and (p_reason is null or btrim(p_reason) = '') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;

  update commercial.promoter_invoices
  set status = p_decision,
      reviewed_by = v_actor,
      reviewed_at = pg_catalog.clock_timestamp(),
      rejection_reason = case when p_decision = 'rejected' then p_reason else null end
  where id = v_invoice.id;

  if p_decision = 'accepted' then
    update commercial.promoter_settlements set status = 'payable' where id = v_invoice.settlement_id;
  end if;

  insert into commercial.audit_events (
    actor_account_id, actor_kind, action, entity_schema, entity_table, entity_id, correlation_id, after
  ) values (
    v_actor, 'internal', 'invoice.reviewed', 'commercial', 'promoter_invoices', v_invoice.id, v_invoice.settlement_id,
    jsonb_build_object('decision', p_decision)
  );

  return jsonb_build_object('ok', true, 'invoice_id', v_invoice.id, 'status', p_decision);
end;
$$;

