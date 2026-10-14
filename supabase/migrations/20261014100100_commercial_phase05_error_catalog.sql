-- Align PHASE-05 error codes with the approved catalog.
-- A repeated payment with the same key and the same body stays a valid duplicate.
-- The same key with a different body is idempotent_replay and does not create another row.

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
    if v_existing.settlement_id = p_settlement_id
       and v_existing.amount_cents = p_amount_cents
       and v_existing.status = p_status then
      return jsonb_build_object('ok', true, 'duplicate', true, 'payment_id', v_existing.id, 'status', v_existing.status);
    end if;
    return jsonb_build_object(
      'ok', false, 'commercial_error_code', 'idempotent_replay', 'duplicate', true,
      'payment_id', v_existing.id, 'status', v_existing.status
    );
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
  if v_settlement.status = 'paid' then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'validation');
  end if;
  if v_settlement.status not in ('payable', 'partially_paid') then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'invoice_required');
  end if;
  if not exists (
    select 1 from commercial.promoter_invoices
    where settlement_id = v_settlement.id
      and status = 'accepted'
      and amount_cents = v_settlement.total_cents
  ) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'invoice_required');
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
    return jsonb_build_object('ok', false, 'commercial_error_code', 'sod_violation');
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
    return jsonb_build_object('ok', false, 'commercial_error_code', 'payment_exceeds_total');
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
exception
  when unique_violation then
    select * into v_existing from commercial.settlement_payments where idempotency_key = p_idempotency_key;
    if v_existing.id is not null
       and v_existing.settlement_id = p_settlement_id
       and v_existing.amount_cents = p_amount_cents
       and v_existing.status = p_status then
      return jsonb_build_object('ok', true, 'duplicate', true, 'payment_id', v_existing.id, 'status', v_existing.status);
    end if;
    if v_existing.id is not null then
      return jsonb_build_object(
        'ok', false, 'commercial_error_code', 'idempotent_replay', 'duplicate', true,
        'payment_id', v_existing.id, 'status', v_existing.status
      );
    end if;
    raise;
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
    return jsonb_build_object('ok', false, 'commercial_error_code', 'sod_violation');
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
    select 1 from commercial.promoter_invoices
    where settlement_id = v_invoice.settlement_id and status = 'accepted'
  ) then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'accepted_invoice_exists');
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
    return jsonb_build_object('ok', false, 'commercial_error_code', 'invoice_amount_mismatch');
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
