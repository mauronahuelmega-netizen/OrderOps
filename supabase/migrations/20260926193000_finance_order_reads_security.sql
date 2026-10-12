-- Phase 2B: tenant-safe order-finance reads and explicit RPC execution grants.

create or replace function public.order_paid_net(p_order_id uuid)
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
  from public.order_financials
  where order_id = p_order_id;

  if v_business_id is null then
    raise exception 'order_financials not found' using errcode = '22023';
  end if;

  perform private.require_finance_permission(v_business_id, 'read');
  return private.order_paid_net(v_business_id, p_order_id);
end;
$$;

create or replace function public.order_committed_amount(p_order_id uuid)
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
  from public.order_financials
  where order_id = p_order_id;

  if v_business_id is null then
    raise exception 'order_financials not found' using errcode = '22023';
  end if;

  perform private.require_finance_permission(v_business_id, 'read');
  return private.order_committed_amount(v_business_id, p_order_id);
end;
$$;

create or replace function public.order_remaining(p_order_id uuid)
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
  from public.order_financials
  where order_id = p_order_id;

  if v_business_id is null then
    raise exception 'order_financials not found' using errcode = '22023';
  end if;

  perform private.require_finance_permission(v_business_id, 'read');
  return private.order_remaining(v_business_id, p_order_id);
end;
$$;

create or replace function public.order_financial_summary(p_order_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_financials public.order_financials%rowtype;
begin
  select * into v_financials
  from public.order_financials
  where order_id = p_order_id;

  if not found then
    raise exception 'order_financials not found' using errcode = '22023';
  end if;

  perform private.require_finance_permission(v_financials.business_id, 'read');

  return jsonb_build_object(
    'order_id', v_financials.order_id,
    'agreed_total', v_financials.agreed_total,
    'financial_status', v_financials.financial_status,
    'paid_net', private.order_paid_net(v_financials.business_id, p_order_id),
    'committed', private.order_committed_amount(v_financials.business_id, p_order_id),
    'remaining', private.order_remaining(v_financials.business_id, p_order_id)
  );
end;
$$;

revoke all on function public.initialize_order_financials(uuid, uuid, text)
  from public, anon, authenticated;
revoke all on function public.set_order_agreed_total(uuid, uuid, numeric)
  from public, anon, authenticated;
revoke all on function public.create_deposit(
  uuid, uuid, text, uuid, numeric, uuid, uuid, uuid, text, timestamptz
) from public, anon, authenticated;
revoke all on function public.record_order_payment(
  uuid, uuid, uuid, text, jsonb, text, timestamptz
) from public, anon, authenticated;
revoke all on function public.create_historical_deposit(
  uuid, uuid, text, uuid, numeric, text, timestamptz
) from public, anon, authenticated;
revoke all on function public.order_paid_net(uuid) from public, anon, authenticated;
revoke all on function public.order_committed_amount(uuid) from public, anon, authenticated;
revoke all on function public.order_remaining(uuid) from public, anon, authenticated;
revoke all on function public.order_financial_summary(uuid) from public, anon, authenticated;

grant execute on function public.initialize_order_financials(uuid, uuid, text)
  to authenticated;
grant execute on function public.set_order_agreed_total(uuid, uuid, numeric)
  to authenticated;
grant execute on function public.create_deposit(
  uuid, uuid, text, uuid, numeric, uuid, uuid, uuid, text, timestamptz
) to authenticated;
grant execute on function public.record_order_payment(
  uuid, uuid, uuid, text, jsonb, text, timestamptz
) to authenticated;
grant execute on function public.create_historical_deposit(
  uuid, uuid, text, uuid, numeric, text, timestamptz
) to authenticated;
grant execute on function public.order_paid_net(uuid) to authenticated;
grant execute on function public.order_committed_amount(uuid) to authenticated;
grant execute on function public.order_remaining(uuid) to authenticated;
grant execute on function public.order_financial_summary(uuid) to authenticated;
