-- Phase 2D: derive multi-cycle protection state exclusively from posted ledger evidence.

alter type public.finance_operation_type
  add value if not exists 'order_financial_reopen';

alter type public.finance_operation_type
  add value if not exists 'order_financial_settlement';

create or replace function private.order_released_amount(
  p_business_id uuid,
  p_order_id uuid
)
returns numeric
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce(sum(e.amount), 0)::numeric(14, 2)
  from public.finance_transaction_entries e
  join public.finance_transactions t
    on t.id = e.transaction_id
   and t.business_id = e.business_id
  join public.finance_operations o
    on o.id = t.operation_id
   and o.business_id = t.business_id
  join public.finance_funds f
    on f.id = e.fund_id
   and f.business_id = e.business_id
  where t.business_id = p_business_id
    and t.order_id = p_order_id
    and t.status = 'posted'
    and o.operation_type = 'release_deposit'
    and e.direction = 'out'
    and f.fund_type = 'committed'
    and f.order_id = p_order_id;
$$;

create or replace function private.order_protection_variance(
  p_business_id uuid,
  p_order_id uuid
)
returns numeric
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select (
    private.order_paid_net(p_business_id, p_order_id)
    - private.order_released_amount(p_business_id, p_order_id)
    - private.order_committed_amount(p_business_id, p_order_id)
  )::numeric(14, 2);
$$;

revoke all on function private.order_released_amount(uuid, uuid)
  from public, anon, authenticated;
revoke all on function private.order_protection_variance(uuid, uuid)
  from public, anon, authenticated;
