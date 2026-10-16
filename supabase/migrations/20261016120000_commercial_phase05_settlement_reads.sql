-- Read workspace for settlement screens. The commercial schema stays unexposed.
-- Row visibility remains the existing SELECT policies.

create or replace function public.list_settlement_workspace()
returns jsonb
language plpgsql
stable
security invoker
set search_path = pg_catalog, public, commercial
as $$
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'commercial_error_code', 'unauthenticated');
  end if;

  return jsonb_build_object(
    'ok', true,
    'settlements', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', settlement.id,
        'promoter_id', settlement.promoter_id,
        'period_key', settlement.period_key,
        'status', settlement.status,
        'total_cents', settlement.total_cents,
        'due_on', settlement.due_on,
        'prepared_by', settlement.prepared_by,
        'approved_by', settlement.approved_by,
        'replaces_settlement_id', settlement.replaces_settlement_id,
        'invalidation_reason', settlement.invalidation_reason,
        'reconciliation_reason', settlement.reconciliation_reason
      ) order by settlement.period_key desc)
      from commercial.promoter_settlements settlement
    ), '[]'::jsonb),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', item.id,
        'settlement_id', item.settlement_id,
        'label', item.label,
        'amount_cents', item.amount_cents,
        'lineage', item.lineage
      ))
      from commercial.settlement_items item
    ), '[]'::jsonb),
    'invoices', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', invoice.id,
        'settlement_id', invoice.settlement_id,
        'status', invoice.status,
        'amount_cents', invoice.amount_cents,
        'rejection_reason', invoice.rejection_reason
      ))
      from commercial.promoter_invoices invoice
    ), '[]'::jsonb),
    'payments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', payment.id,
        'settlement_id', payment.settlement_id,
        'status', payment.status,
        'amount_cents', payment.amount_cents,
        'idempotency_key', payment.idempotency_key
      ))
      from commercial.settlement_payments payment
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.list_settlement_workspace() from public, anon, authenticated, service_role;
grant execute on function public.list_settlement_workspace() to authenticated;
