-- One accepted invoice per settlement. Rejected and submitted rows stay as history.
-- Multiple submitted invoices remain allowed because that coexistence is not contracted.

create unique index promoter_invoices_one_accepted_idx
  on commercial.promoter_invoices (settlement_id)
  where status = 'accepted';

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
