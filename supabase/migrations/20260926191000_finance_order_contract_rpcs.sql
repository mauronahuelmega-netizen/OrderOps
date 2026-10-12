-- Phase 2B: explicit order-finance initialization and contractual total management.

create or replace function public.initialize_order_financials(
  p_business_id uuid,
  p_order_id uuid,
  p_mode text default 'unquoted'
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid;
  v_order public.orders%rowtype;
  v_existing public.order_financials%rowtype;
  v_agreed_total numeric(14, 2);
begin
  v_uid := private.require_finance_permission(p_business_id, 'manage_order_contract');

  if p_mode not in ('unquoted', 'copy_total_price') then
    raise exception 'invalid initialization mode' using errcode = '22023';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id
    and business_id = p_business_id
  for update;

  if not found then
    raise exception 'order not found' using errcode = '22023';
  end if;

  select * into v_existing
  from public.order_financials
  where order_id = p_order_id
    and business_id = p_business_id;

  if found then
    return jsonb_build_object(
      'order_id', v_existing.order_id,
      'agreed_total', v_existing.agreed_total,
      'financial_status', v_existing.financial_status,
      'idempotent', true
    );
  end if;

  if p_mode = 'copy_total_price' then
    if v_order.composition_status <> 'itemized' or v_order.total_price is null then
      raise exception 'technical total unavailable for this order' using errcode = 'P0001';
    end if;
    if v_order.total_price <= 0 then
      raise exception 'technical total must be positive to initialize agreed_total'
        using errcode = 'P0001';
    end if;
    v_agreed_total := v_order.total_price;
  else
    v_agreed_total := null;
  end if;

  insert into public.order_financials (
    order_id, business_id, agreed_total, financial_status
  ) values (
    p_order_id, p_business_id, v_agreed_total, 'open'
  );

  insert into public.finance_audit_events (
    business_id, actor_id, event_type, entity_type, entity_id, payload
  ) values (
    p_business_id, v_uid, 'order_financials_initialized', 'order_financials', p_order_id,
    jsonb_build_object(
      'mode', p_mode,
      'agreed_total', v_agreed_total,
      'financial_status', 'open'
    )
  );

  return jsonb_build_object(
    'order_id', p_order_id,
    'agreed_total', v_agreed_total,
    'financial_status', 'open',
    'idempotent', false
  );
end;
$$;

create or replace function public.set_order_agreed_total(
  p_business_id uuid,
  p_order_id uuid,
  p_agreed_total numeric
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid;
  v_financials public.order_financials%rowtype;
  v_paid numeric(14, 2);
  v_new_total numeric(14, 2);
begin
  v_uid := private.require_finance_permission(p_business_id, 'manage_order_contract');

  if p_agreed_total is not null then
    v_new_total := private.assert_finance_amount(p_agreed_total);
  end if;

  v_financials := private.lock_order_financials(p_business_id, p_order_id);
  v_paid := private.order_paid_net(p_business_id, p_order_id);

  if v_paid > 0 and v_new_total is null then
    raise exception 'agreed_total cannot be cleared after collection' using errcode = 'P0001';
  end if;
  if v_new_total is not null and v_new_total < v_paid then
    raise exception 'agreed_total cannot be lower than paid_net' using errcode = 'P0001';
  end if;

  if v_financials.agreed_total is not distinct from v_new_total then
    return jsonb_build_object(
      'order_id', p_order_id,
      'agreed_total', v_financials.agreed_total,
      'changed', false
    );
  end if;

  update public.order_financials
  set agreed_total = v_new_total
  where order_id = p_order_id
    and business_id = p_business_id;

  insert into public.finance_audit_events (
    business_id, actor_id, event_type, entity_type, entity_id, payload
  ) values (
    p_business_id, v_uid, 'order_agreed_total_changed', 'order_financials', p_order_id,
    jsonb_build_object(
      'previous_agreed_total', v_financials.agreed_total,
      'agreed_total', v_new_total
    )
  );

  return jsonb_build_object(
    'order_id', p_order_id,
    'agreed_total', v_new_total,
    'changed', true
  );
end;
$$;
