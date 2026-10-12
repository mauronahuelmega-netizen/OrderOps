-- Phase 2B: order-finance locking, classification, and balance helpers.

create or replace function private.require_finance_permission(
  p_business_id uuid,
  p_permission text
)
returns uuid
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid;
  v_role text;
begin
  v_uid := private.require_business_member(p_business_id);

  if p_permission not in (
    'read', 'operate', 'reconcile', 'correct', 'admin',
    'manage_order_contract', 'record_historical_deposit'
  ) then
    raise exception 'unknown finance permission' using errcode = '22023';
  end if;

  if p_permission <> 'read' then
    perform private.require_finance_enabled(p_business_id);
  end if;

  select p.role into v_role
  from public.profiles p
  where p.id = v_uid;

  if v_role in ('owner', 'admin')
     or (
       v_role = 'manager'
       and p_permission in (
         'read', 'operate', 'reconcile', 'correct',
         'manage_order_contract', 'record_historical_deposit'
       )
     )
     or (v_role = 'operator' and p_permission in ('read', 'operate'))
     or (v_role = 'viewer' and p_permission = 'read') then
    return v_uid;
  end if;

  raise exception 'finance permission denied' using errcode = '42501';
end;
$$;

create or replace function private.finance_request_fingerprint(
  p_request_hash text,
  p_payload jsonb
)
returns text
language sql
immutable
security definer
set search_path = pg_catalog
as $$
  select md5(coalesce(p_request_hash, '') || ':' || coalesce(p_payload, 'null'::jsonb)::text);
$$;

create or replace function private.assert_finance_amount(p_amount numeric)
returns numeric
language plpgsql
immutable
security definer
set search_path = pg_catalog
as $$
begin
  if p_amount is null
     or p_amount = 'NaN'::numeric
     or p_amount = 'Infinity'::numeric
     or p_amount = '-Infinity'::numeric
     or p_amount <= 0
     or p_amount <> round(p_amount, 2) then
    raise exception 'amount must be positive with at most two decimal places'
      using errcode = '22023';
  end if;

  return round(p_amount, 2)::numeric(14, 2);
end;
$$;

create or replace function private.lock_order_financials(
  p_business_id uuid,
  p_order_id uuid
)
returns public.order_financials
language plpgsql
volatile
security definer
set search_path = pg_catalog, public
as $$
declare
  v_financials public.order_financials%rowtype;
begin
  select * into v_financials
  from public.order_financials
  where order_id = p_order_id
    and business_id = p_business_id
  for update;

  if not found then
    raise exception 'order_financials not initialized' using errcode = '22023';
  end if;
  if v_financials.financial_status <> 'open' then
    raise exception 'order finance is not open' using errcode = 'P0001';
  end if;

  return v_financials;
end;
$$;

create or replace function private.get_or_create_committed_fund(
  p_business_id uuid,
  p_order_id uuid
)
returns public.finance_funds
language plpgsql
volatile
security definer
set search_path = pg_catalog, public
as $$
declare
  v_financials public.order_financials%rowtype;
  v_settings public.business_finance_settings%rowtype;
  v_order public.orders%rowtype;
  v_account public.finance_accounts%rowtype;
  v_fund public.finance_funds%rowtype;
begin
  v_financials := private.lock_order_financials(p_business_id, p_order_id);

  select * into v_settings
  from public.business_finance_settings
  where business_id = p_business_id;

  if not found or v_settings.protection_account_id is null then
    raise exception 'protection_account_missing' using errcode = 'P0001';
  end if;

  select * into v_account
  from public.finance_accounts
  where id = v_settings.protection_account_id
    and business_id = p_business_id
    and active;

  if not found then
    raise exception 'protection_account_invalid' using errcode = 'P0001';
  end if;

  select * into v_fund
  from public.finance_funds
  where business_id = p_business_id
    and order_id = p_order_id
    and fund_type = 'committed'
    and active
  for update;

  if found then
    if v_fund.account_id <> v_settings.protection_account_id then
      raise exception 'committed_order_mismatch' using errcode = 'P0001';
    end if;
    return v_fund;
  end if;

  select * into strict v_order
  from public.orders
  where id = p_order_id
    and business_id = p_business_id;

  insert into public.finance_funds (
    business_id, account_id, name, fund_type, area_hint, order_id, active, sort_order
  ) values (
    p_business_id,
    v_settings.protection_account_id,
    concat_ws(' · ', nullif(trim(v_order.customer_name), ''), nullif(trim(v_order.order_code), '')),
    'committed',
    'business',
    p_order_id,
    true,
    1000
  )
  returning * into v_fund;

  return v_fund;
end;
$$;

create or replace function private.resolve_order_coverage_fund(
  p_business_id uuid,
  p_override_fund_id uuid default null
)
returns public.finance_funds
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_settings public.business_finance_settings%rowtype;
  v_fund public.finance_funds%rowtype;
  v_fund_id uuid;
begin
  select * into v_settings
  from public.business_finance_settings
  where business_id = p_business_id;

  if not found or v_settings.protection_account_id is null then
    raise exception 'protection_account_missing' using errcode = 'P0001';
  end if;

  v_fund_id := coalesce(p_override_fund_id, v_settings.default_operating_fund_id);
  if v_fund_id is null then
    raise exception 'default_operating_fund_missing' using errcode = 'P0001';
  end if;

  select * into v_fund
  from public.finance_funds
  where id = v_fund_id
    and business_id = p_business_id;

  if not found
     or not v_fund.active
     or v_fund.fund_type <> 'business_operating'
     or v_fund.order_id is not null
     or v_fund.account_id <> v_settings.protection_account_id then
    raise exception 'default_operating_fund_invalid' using errcode = 'P0001';
  end if;

  return v_fund;
end;
$$;

create or replace function private.resolve_order_cash_fund(p_business_id uuid)
returns public.finance_funds
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_fund public.finance_funds%rowtype;
  v_count integer;
begin
  select count(*) into v_count
  from public.finance_funds f
  join public.finance_accounts a
    on a.id = f.account_id
   and a.business_id = f.business_id
  where f.business_id = p_business_id
    and f.active
    and f.fund_type = 'business_operating'
    and f.area_hint = 'business'
    and f.order_id is null
    and a.active
    and a.kind = 'cash';

  if v_count <> 1 then
    raise exception 'payment_medium_unresolved: cash' using errcode = 'P0001';
  end if;

  select f.* into v_fund
  from public.finance_funds f
  join public.finance_accounts a
    on a.id = f.account_id
   and a.business_id = f.business_id
  where f.business_id = p_business_id
    and f.active
    and f.fund_type = 'business_operating'
    and f.area_hint = 'business'
    and f.order_id is null
    and a.active
    and a.kind = 'cash';

  return v_fund;
end;
$$;

create or replace function private.parse_order_payments(p_payments jsonb)
returns table (medium text, amount numeric)
language plpgsql
stable
security definer
set search_path = pg_catalog
as $$
declare
  v_item jsonb;
  v_keys text[];
  v_key text;
  v_medium text;
  v_amount numeric;
  v_seen text[] := '{}';
begin
  if p_payments is null
     or jsonb_typeof(p_payments) <> 'array'
     or jsonb_array_length(p_payments) = 0 then
    raise exception 'payment_invalid_payload' using errcode = '22023';
  end if;

  for v_item in select * from jsonb_array_elements(p_payments)
  loop
    if jsonb_typeof(v_item) <> 'object' then
      raise exception 'payment_invalid_item' using errcode = '22023';
    end if;

    select coalesce(array_agg(k), '{}') into v_keys
    from jsonb_object_keys(v_item) k;

    foreach v_key in array v_keys
    loop
      if v_key not in ('medium', 'amount') then
        raise exception 'payment_unexpected_key: %', v_key using errcode = '22023';
      end if;
    end loop;

    if not ('medium' = any(v_keys)) or not ('amount' = any(v_keys)) then
      raise exception 'payment_missing_field' using errcode = '22023';
    end if;
    if jsonb_typeof(v_item->'medium') <> 'string'
       or jsonb_typeof(v_item->'amount') <> 'number' then
      raise exception 'payment_invalid_item' using errcode = '22023';
    end if;

    v_medium := v_item->>'medium';
    if v_medium not in ('cash', 'mercado_pago') then
      raise exception 'payment_unknown_medium: %', v_medium using errcode = '22023';
    end if;
    if v_medium = any(v_seen) then
      raise exception 'payment_duplicate_medium: %', v_medium using errcode = '22023';
    end if;
    v_seen := array_append(v_seen, v_medium);

    begin
      v_amount := private.assert_finance_amount((v_item->>'amount')::numeric);
    exception when others then
      raise exception 'payment_invalid_amount' using errcode = '22023';
    end;

    medium := v_medium;
    amount := v_amount;
    return next;
  end loop;
end;
$$;

create or replace function private.order_paid_net(
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
    and e.direction = 'in'
    and (
      (
        o.operation_type in ('deposit', 'order_payment')
        and not exists (
          select 1
          from public.finance_transaction_entries x
          where x.transaction_id = t.id
            and x.business_id = t.business_id
            and x.direction = 'out'
        )
      )
      or (
        o.operation_type = 'historical_deposit'
        and f.fund_type = 'committed'
        and f.order_id = p_order_id
      )
    );
$$;

create or replace function private.order_committed_amount(
  p_business_id uuid,
  p_order_id uuid
)
returns numeric
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce(sum(private.finance_fund_balance(f.business_id, f.id)), 0)::numeric(14, 2)
  from public.finance_funds f
  where f.business_id = p_business_id
    and f.order_id = p_order_id
    and f.fund_type = 'committed';
$$;

create or replace function private.order_remaining(
  p_business_id uuid,
  p_order_id uuid
)
returns numeric
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select case
    when ofn.agreed_total is null then null
    else greatest(
      ofn.agreed_total - private.order_paid_net(ofn.business_id, ofn.order_id),
      0
    )::numeric(14, 2)
  end
  from public.order_financials ofn
  where ofn.business_id = p_business_id
    and ofn.order_id = p_order_id;
$$;

revoke all on function private.require_finance_permission(uuid, text) from public;
revoke all on function private.finance_request_fingerprint(text, jsonb) from public, anon, authenticated;
revoke all on function private.assert_finance_amount(numeric) from public, anon, authenticated;
revoke all on function private.lock_order_financials(uuid, uuid) from public, anon, authenticated;
revoke all on function private.get_or_create_committed_fund(uuid, uuid) from public, anon, authenticated;
revoke all on function private.resolve_order_coverage_fund(uuid, uuid) from public, anon, authenticated;
revoke all on function private.resolve_order_cash_fund(uuid) from public, anon, authenticated;
revoke all on function private.parse_order_payments(jsonb) from public, anon, authenticated;
revoke all on function private.order_paid_net(uuid, uuid) from public, anon, authenticated;
revoke all on function private.order_committed_amount(uuid, uuid) from public, anon, authenticated;
revoke all on function private.order_remaining(uuid, uuid) from public, anon, authenticated;
