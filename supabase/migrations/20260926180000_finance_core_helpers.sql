-- Phase 2A: shared ledger helpers. No financial data is created here.

create or replace function private.get_idempotent_finance_operation(
  p_business_id uuid,
  p_client_request_id uuid,
  p_request_hash text
)
returns public.finance_operations
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_operation public.finance_operations%rowtype;
begin
  select * into v_operation
  from public.finance_operations
  where business_id = p_business_id
    and client_request_id = p_client_request_id;

  if found and v_operation.request_hash <> p_request_hash then
    raise exception 'IDEMPOTENCY_CONFLICT' using errcode = '23505';
  end if;

  return v_operation;
end;
$$;

create or replace function private.lock_finance_request(
  p_business_id uuid,
  p_client_request_id uuid
)
returns void
language sql
volatile
security definer
set search_path = pg_catalog
as $$
  select pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_business_id::text || ':' || p_client_request_id::text, 0)
  );
$$;

create or replace function private.lock_finance_funds(
  p_business_id uuid,
  p_fund_ids uuid[]
)
returns setof public.finance_funds
language sql
volatile
security definer
set search_path = pg_catalog, public
as $$
  select f.*
  from public.finance_funds f
  where f.business_id = p_business_id
    and f.id = any(p_fund_ids)
  order by f.id
  for update of f;
$$;

create or replace function private.finance_fund_balance(
  p_business_id uuid,
  p_fund_id uuid
)
returns numeric
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce(sum(
    case when e.direction = 'in' then e.amount else -e.amount end
  ), 0)::numeric(14, 2)
  from public.finance_transaction_entries e
  join public.finance_transactions t
    on t.id = e.transaction_id
   and t.business_id = e.business_id
  where e.business_id = p_business_id
    and e.fund_id = p_fund_id
    and t.status = 'posted';
$$;

create or replace function private.finance_account_balance(
  p_business_id uuid,
  p_account_id uuid
)
returns numeric
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce(sum(
    case when e.direction = 'in' then e.amount else -e.amount end
  ), 0)::numeric(14, 2)
  from public.finance_transaction_entries e
  join public.finance_transactions t
    on t.id = e.transaction_id
   and t.business_id = e.business_id
  join public.finance_funds f
    on f.id = e.fund_id
   and f.business_id = e.business_id
  where e.business_id = p_business_id
    and f.account_id = p_account_id
    and t.status = 'posted';
$$;

create or replace function private.assert_finance_fund_spendable(
  p_business_id uuid,
  p_fund_id uuid,
  p_outbound numeric
)
returns void
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_balance numeric(14, 2);
begin
  v_balance := private.finance_fund_balance(p_business_id, p_fund_id);

  if v_balance - p_outbound < 0 then
    raise exception 'insufficient_funds: fund %, balance %, outbound %',
      p_fund_id, v_balance, p_outbound
      using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function private.get_idempotent_finance_operation(uuid, uuid, text) from public, anon, authenticated;
revoke all on function private.lock_finance_request(uuid, uuid) from public, anon, authenticated;
revoke all on function private.lock_finance_funds(uuid, uuid[]) from public, anon, authenticated;
revoke all on function private.finance_fund_balance(uuid, uuid) from public, anon, authenticated;
revoke all on function private.finance_account_balance(uuid, uuid) from public, anon, authenticated;
revoke all on function private.assert_finance_fund_spendable(uuid, uuid, numeric) from public, anon, authenticated;
