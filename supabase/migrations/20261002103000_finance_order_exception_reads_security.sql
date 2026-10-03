-- M1.E: tenant-safe exception reads and least-privilege RPC exposure.

create or replace function public.order_financial_exception_summary(p_order_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_financials public.order_financials%rowtype;
  v_gross numeric(14, 2);
  v_refunded numeric(14, 2);
  v_released numeric(14, 2);
begin
  select * into v_financials from public.order_financials where order_id = p_order_id;
  if not found then
    raise exception 'order_financials not found' using errcode = '22023';
  end if;
  perform private.require_finance_permission(v_financials.business_id, 'read');
  v_gross := private.order_paid_net(v_financials.business_id, p_order_id);
  v_refunded := private.order_refunded_amount(v_financials.business_id, p_order_id);
  v_released := private.order_released_amount(v_financials.business_id, p_order_id);
  return jsonb_build_object(
    'order_id', v_financials.order_id,
    'agreed_total', v_financials.agreed_total,
    'financial_status', v_financials.financial_status,
    'settled_at', v_financials.settled_at,
    'settled_by', v_financials.settled_by,
    'cancelled_at', v_financials.cancelled_at,
    'cancelled_by', v_financials.cancelled_by,
    'paid_net', v_gross,
    'gross_paid', v_gross,
    'refunded_amount', v_refunded,
    'net_collected', v_gross - v_refunded,
    'refunded_from_protected', private.order_refunded_from_protected(
      v_financials.business_id, p_order_id
    ),
    'refunded_from_released', private.order_refunded_from_released(
      v_financials.business_id, p_order_id
    ),
    'released', v_released,
    'net_released', v_released - private.order_refunded_from_released(
      v_financials.business_id, p_order_id
    ),
    'retained_amount', private.order_retained_amount(
      v_financials.business_id, p_order_id
    ),
    'committed', private.order_committed_amount(v_financials.business_id, p_order_id),
    'remaining', private.order_remaining(v_financials.business_id, p_order_id),
    'refundable_amount', private.order_refundable_amount(
      v_financials.business_id, p_order_id
    ),
    'protection_variance', private.order_protection_variance(
      v_financials.business_id, p_order_id
    )
  );
end;
$$;

create or replace function public.order_refunded_amount(p_order_id uuid)
returns numeric
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare v_business_id uuid;
begin
  select business_id into v_business_id from public.order_financials
  where order_id = p_order_id;
  if v_business_id is null then
    raise exception 'order_financials not found' using errcode = '22023';
  end if;
  perform private.require_finance_permission(v_business_id, 'read');
  return private.order_refunded_amount(v_business_id, p_order_id);
end;
$$;

create or replace function public.order_refundable_amount(p_order_id uuid)
returns numeric
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare v_business_id uuid;
begin
  select business_id into v_business_id from public.order_financials
  where order_id = p_order_id;
  if v_business_id is null then
    raise exception 'order_financials not found' using errcode = '22023';
  end if;
  perform private.require_finance_permission(v_business_id, 'read');
  return private.order_refundable_amount(v_business_id, p_order_id);
end;
$$;

create or replace function public.order_financial_exception_history(p_order_id uuid)
returns table (
  operation_id uuid,
  operation_type public.finance_operation_type,
  target_operation_id uuid,
  protected_amount numeric,
  released_amount numeric,
  total_amount numeric,
  occurred_at timestamptz,
  note text,
  created_by uuid
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare v_business_id uuid;
begin
  select business_id into v_business_id from public.order_financials
  where order_id = p_order_id;
  if v_business_id is null then
    raise exception 'order_financials not found' using errcode = '22023';
  end if;
  perform private.require_finance_permission(v_business_id, 'read');
  return query
  select o.id, o.operation_type, o.target_operation_id,
    coalesce(a.protected_amount, 0), coalesce(a.released_amount, 0),
    coalesce(a.total_amount, 0), coalesce(t.occurred_at, o.created_at),
    o.note, o.created_by
  from public.finance_operations o
  left join public.finance_order_outflow_allocations a
    on a.operation_id = o.id and a.business_id = o.business_id
  left join public.finance_transactions t
    on t.operation_id = o.id and t.business_id = o.business_id
  where o.business_id = v_business_id
    and (
      a.order_id = p_order_id
      or exists (
        select 1 from public.finance_transactions linked
        where linked.business_id = o.business_id
          and linked.operation_id = o.id
          and linked.order_id = p_order_id
      )
      or (
        o.operation_type = 'order_financial_cancel'
        and exists (
          select 1 from public.finance_audit_events ae
          where ae.business_id = o.business_id
            and ae.entity_type = 'order_financials'
            and ae.entity_id = p_order_id
            and ae.payload->>'operation_id' = o.id::text
        )
      )
    )
    and o.operation_type in (
      'order_refund', 'order_retention',
      'order_financial_cancel', 'order_payment_reversal'
    )
  order by coalesce(t.occurred_at, o.created_at), o.created_at, o.id;
end;
$$;

revoke all on function public.create_order_refund(
  uuid, uuid, uuid, text, jsonb, numeric, numeric, text, timestamptz
) from public, anon, authenticated;
revoke all on function public.reverse_order_payment(
  uuid, uuid, uuid, uuid, text, jsonb, numeric, numeric, text, timestamptz
) from public, anon, authenticated;
revoke all on function public.cancel_order_financials(
  uuid, uuid, uuid, text, jsonb, numeric, numeric, numeric, text, timestamptz
) from public, anon, authenticated;
revoke all on function public.order_refunded_amount(uuid) from public, anon, authenticated;
revoke all on function public.order_refundable_amount(uuid) from public, anon, authenticated;
revoke all on function public.order_financial_exception_summary(uuid)
  from public, anon, authenticated;
revoke all on function public.order_financial_exception_history(uuid)
  from public, anon, authenticated;

grant execute on function public.create_order_refund(
  uuid, uuid, uuid, text, jsonb, numeric, numeric, text, timestamptz
) to authenticated;
grant execute on function public.reverse_order_payment(
  uuid, uuid, uuid, uuid, text, jsonb, numeric, numeric, text, timestamptz
) to authenticated;
grant execute on function public.cancel_order_financials(
  uuid, uuid, uuid, text, jsonb, numeric, numeric, numeric, text, timestamptz
) to authenticated;
grant execute on function public.order_refunded_amount(uuid) to authenticated;
grant execute on function public.order_refundable_amount(uuid) to authenticated;
grant execute on function public.order_financial_exception_summary(uuid) to authenticated;
grant execute on function public.order_financial_exception_history(uuid) to authenticated;

revoke all on function private.require_finance_permission(uuid, text) from public;
