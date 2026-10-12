-- Post-M2 semantic fix: contractual remaining is not collectible after the
-- financial contract has been settled or cancelled.

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
  v_remaining numeric(14, 2);
begin
  select * into v_financials from public.order_financials where order_id = p_order_id;
  if not found then
    raise exception 'order_financials not found' using errcode = '22023';
  end if;
  perform private.require_finance_permission(v_financials.business_id, 'read');
  v_gross := private.order_paid_net(v_financials.business_id, p_order_id);
  v_refunded := private.order_refunded_amount(v_financials.business_id, p_order_id);
  v_released := private.order_released_amount(v_financials.business_id, p_order_id);
  v_remaining := private.order_remaining(v_financials.business_id, p_order_id);
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
    'remaining', v_remaining,
    'collectible_remaining', case
      when v_financials.financial_status = 'open' then coalesce(v_remaining, 0)
      else 0
    end,
    'refundable_amount', private.order_refundable_amount(
      v_financials.business_id, p_order_id
    ),
    'protection_variance', private.order_protection_variance(
      v_financials.business_id, p_order_id
    )
  );
end;
$$;
create or replace function public.finance_dashboard_summary(p_business_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_managed numeric(14,2);
  v_committed numeric(14,2);
  v_family numeric(14,2);
  v_paid numeric(14,2);
  v_refunded numeric(14,2);
  v_contractual_remaining numeric(14,2);
  v_collectible_remaining numeric(14,2);
begin
  perform private.require_finance_permission(p_business_id, 'read');
  select
    coalesce(sum(case when f.area_hint = 'business' then private.finance_fund_balance(p_business_id, f.id) else 0 end), 0),
    coalesce(sum(case when f.fund_type = 'committed' then private.finance_fund_balance(p_business_id, f.id) else 0 end), 0),
    coalesce(sum(case when f.fund_type = 'family' then private.finance_fund_balance(p_business_id, f.id) else 0 end), 0)
  into v_managed, v_committed, v_family
  from public.finance_funds f where f.business_id = p_business_id;

  select
    coalesce(sum(private.order_paid_net(ofn.business_id, ofn.order_id)), 0),
    coalesce(sum(private.order_remaining(ofn.business_id, ofn.order_id)), 0),
    coalesce(sum(case
      when ofn.financial_status = 'open'
        then private.order_remaining(ofn.business_id, ofn.order_id)
      else 0
    end), 0)
  into v_paid, v_contractual_remaining, v_collectible_remaining
  from public.order_financials ofn where ofn.business_id = p_business_id;

  select coalesce(sum(a.total_amount), 0) into v_refunded
  from public.finance_order_outflow_allocations a
  where a.business_id = p_business_id and a.outflow_kind = 'refund';

  return jsonb_build_object(
    'managed_business_balance', v_managed,
    'committed_balance', v_committed,
    'family_balance', v_family,
    'gross_order_collected', v_paid,
    'refunded_amount', v_refunded,
    'net_order_collected', v_paid - v_refunded,
    -- Backward-compatible KPI alias. This field has always fed "Por cobrar".
    'order_remaining', v_collectible_remaining,
    'collectible_order_remaining', v_collectible_remaining,
    'contractual_order_remaining', v_contractual_remaining
  );
end;
$$;
