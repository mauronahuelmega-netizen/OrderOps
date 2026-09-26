-- Phase 2A: tenant-safe balance reads over posted ledger entries.

create or replace function public.finance_fund_balance(p_fund_id uuid)
returns numeric
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_business_id uuid;
begin
  select business_id into v_business_id
  from public.finance_funds
  where id = p_fund_id;

  if v_business_id is null then
    raise exception 'fund not found' using errcode = '22023';
  end if;

  perform private.require_finance_permission(v_business_id, 'read');
  return private.finance_fund_balance(v_business_id, p_fund_id);
end;
$$;

create or replace function public.finance_account_balance(p_account_id uuid)
returns numeric
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_business_id uuid;
begin
  select business_id into v_business_id
  from public.finance_accounts
  where id = p_account_id;

  if v_business_id is null then
    raise exception 'account not found' using errcode = '22023';
  end if;

  perform private.require_finance_permission(v_business_id, 'read');
  return private.finance_account_balance(v_business_id, p_account_id);
end;
$$;
