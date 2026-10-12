-- M2: additive, tenant-safe read contracts for the shared Majo runtime.

create or replace function public.current_business_context()
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_business public.businesses%rowtype;
  v_settings public.business_settings%rowtype;
  v_finance public.business_finance_settings%rowtype;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  select * into v_profile from public.profiles where id = v_uid;
  if not found or v_profile.business_id is null then
    raise exception 'business profile required' using errcode = '42501';
  end if;
  select * into strict v_business from public.businesses where id = v_profile.business_id;
  select * into v_settings from public.business_settings where business_id = v_business.id;
  select * into v_finance from public.business_finance_settings where business_id = v_business.id;
  return jsonb_build_object(
    'user_id', v_uid,
    'business', jsonb_build_object('id', v_business.id, 'name', v_business.name, 'slug', v_business.slug, 'is_active', v_business.is_active),
    'role', v_profile.role,
    'timezone', v_settings.timezone,
    'finance_enabled', v_settings.finance_enabled,
    'finance_settings', jsonb_build_object('protection_account_id', v_finance.protection_account_id, 'default_operating_fund_id', v_finance.default_operating_fund_id)
  );
end;
$$;

create or replace function public.finance_reference_data(p_business_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_accounts jsonb;
  v_funds jsonb;
  v_categories jsonb;
  v_settings jsonb;
begin
  perform private.require_finance_permission(p_business_id, 'read');
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id, 'name', a.name, 'kind', a.kind, 'active', a.active,
    'sort_order', a.sort_order, 'balance', private.finance_account_balance(p_business_id, a.id)
  ) order by a.sort_order, a.id), '[]'::jsonb) into v_accounts
  from public.finance_accounts a where a.business_id = p_business_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', f.id, 'account_id', f.account_id, 'name', f.name,
    'fund_type', f.fund_type, 'area_hint', f.area_hint, 'order_id', f.order_id,
    'active', f.active, 'requires_strong_confirmation', f.requires_strong_confirmation,
    'sort_order', f.sort_order, 'balance', private.finance_fund_balance(p_business_id, f.id)
  ) order by f.sort_order, f.id), '[]'::jsonb) into v_funds
  from public.finance_funds f where f.business_id = p_business_id;

  select coalesce(jsonb_agg(to_jsonb(c) - 'business_id' - 'created_at' - 'updated_at'
    order by c.sort_order, c.id), '[]'::jsonb) into v_categories
  from public.finance_categories c where c.business_id = p_business_id;

  select jsonb_build_object(
    'timezone', s.timezone, 'finance_enabled', s.finance_enabled,
    'protection_account_id', bfs.protection_account_id,
    'default_operating_fund_id', bfs.default_operating_fund_id
  ) into v_settings
  from public.business_settings s
  left join public.business_finance_settings bfs on bfs.business_id = s.business_id
  where s.business_id = p_business_id;

  return jsonb_build_object('accounts', v_accounts, 'funds', v_funds, 'categories', v_categories, 'settings', coalesce(v_settings, '{}'::jsonb));
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
  v_remaining numeric(14,2);
begin
  perform private.require_finance_permission(p_business_id, 'read');
  select
    coalesce(sum(case when f.area_hint = 'business' then private.finance_fund_balance(p_business_id, f.id) else 0 end), 0),
    coalesce(sum(case when f.fund_type = 'committed' then private.finance_fund_balance(p_business_id, f.id) else 0 end), 0),
    coalesce(sum(case when f.fund_type = 'family' then private.finance_fund_balance(p_business_id, f.id) else 0 end), 0)
  into v_managed, v_committed, v_family
  from public.finance_funds f where f.business_id = p_business_id;

  select coalesce(sum(private.order_paid_net(ofn.business_id, ofn.order_id)), 0),
         coalesce(sum(private.order_remaining(ofn.business_id, ofn.order_id)), 0)
  into v_paid, v_remaining
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
    'order_remaining', v_remaining
  );
end;
$$;

create or replace function public.finance_transaction_search(
  p_business_id uuid,
  p_query text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare v_items jsonb; v_total bigint;
begin
  perform private.require_finance_permission(p_business_id, 'read');
  if p_limit < 1 or p_limit > 200 or p_offset < 0 then raise exception 'invalid pagination' using errcode = '22023'; end if;
  select count(distinct t.id) into v_total
  from public.finance_transactions t
  join public.finance_operations o on o.id = t.operation_id and o.business_id = t.business_id
  left join public.finance_categories c on c.id = t.category_id and c.business_id = t.business_id
  where t.business_id = p_business_id and (
    nullif(trim(p_query), '') is null or coalesce(t.note, '') ilike '%' || trim(p_query) || '%'
    or coalesce(o.note, '') ilike '%' || trim(p_query) || '%' or coalesce(c.name, '') ilike '%' || trim(p_query) || '%'
  );
  select coalesce(jsonb_agg(item order by occurred_at desc, id), '[]'::jsonb) into v_items
  from (
    select t.id, t.operation_id, o.operation_type, t.status, t.area, t.category_id,
      c.name category_name, t.order_id, t.occurred_at, coalesce(t.note, o.note) note,
      coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'fund_id', e.fund_id, 'fund_name', f.name, 'account_id', f.account_id, 'direction', e.direction, 'amount', e.amount) order by e.id)
        from public.finance_transaction_entries e join public.finance_funds f on f.id=e.fund_id and f.business_id=e.business_id where e.transaction_id=t.id and e.business_id=t.business_id), '[]'::jsonb) entries
    from public.finance_transactions t
    join public.finance_operations o on o.id=t.operation_id and o.business_id=t.business_id
    left join public.finance_categories c on c.id=t.category_id and c.business_id=t.business_id
    where t.business_id=p_business_id and (
      nullif(trim(p_query), '') is null or coalesce(t.note, '') ilike '%' || trim(p_query) || '%'
      or coalesce(o.note, '') ilike '%' || trim(p_query) || '%' or coalesce(c.name, '') ilike '%' || trim(p_query) || '%'
    ) order by t.occurred_at desc, t.id limit p_limit offset p_offset
  ) item;
  return jsonb_build_object('items', v_items, 'total', v_total, 'limit', p_limit, 'offset', p_offset);
end;
$$;

create or replace function public.finance_transaction_detail(p_transaction_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare v_business_id uuid; v_result jsonb;
begin
  select business_id into v_business_id from public.finance_transactions where id=p_transaction_id;
  if v_business_id is null then raise exception 'transaction not found' using errcode='22023'; end if;
  perform private.require_finance_permission(v_business_id, 'read');
  select jsonb_build_object(
    'id', t.id, 'operation_id', t.operation_id, 'operation_type', o.operation_type,
    'status', t.status, 'area', t.area, 'category_id', t.category_id,
    'category_name', c.name, 'order_id', t.order_id, 'occurred_at', t.occurred_at,
    'note', coalesce(t.note, o.note),
    'reconciliation_statuses', coalesce((select jsonb_agg(distinct r.status)
      from public.finance_transaction_entries re_source
      join public.finance_reconciliation_entries re on re.entry_id=re_source.id
      join public.finance_reconciliations r on r.id=re.reconciliation_id and r.business_id=re.business_id
      where re_source.transaction_id=t.id and re_source.business_id=t.business_id), '[]'::jsonb),
    'entries', coalesce((select jsonb_agg(jsonb_build_object(
      'id', e.id, 'fund_id', e.fund_id, 'fund_name', f.name,
      'account_id', f.account_id, 'direction', e.direction, 'amount', e.amount
    ) order by e.id)
      from public.finance_transaction_entries e
      join public.finance_funds f on f.id=e.fund_id and f.business_id=e.business_id
      where e.transaction_id=t.id and e.business_id=t.business_id), '[]'::jsonb)
  ) into v_result
  from public.finance_transactions t
  join public.finance_operations o on o.id=t.operation_id and o.business_id=t.business_id
  left join public.finance_categories c on c.id=t.category_id and c.business_id=t.business_id
  where t.id=p_transaction_id and t.business_id=v_business_id;
  if v_result is null then raise exception 'transaction not found' using errcode='22023'; end if;
  return v_result;
end;
$$;

create or replace function public.finance_fund_activity(p_fund_id uuid, p_limit integer default 50)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare v_business_id uuid; v_items jsonb;
begin
  select business_id into v_business_id from public.finance_funds where id=p_fund_id;
  if v_business_id is null then raise exception 'fund not found' using errcode='22023'; end if;
  perform private.require_finance_permission(v_business_id, 'read');
  if p_limit < 1 or p_limit > 200 then raise exception 'invalid pagination' using errcode='22023'; end if;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.occurred_at desc, x.entry_id), '[]'::jsonb) into v_items from (
    select e.id entry_id, e.transaction_id, e.direction, e.amount, t.occurred_at, t.status,
      t.order_id, coalesce(t.note,o.note) note, o.operation_type
    from public.finance_transaction_entries e
    join public.finance_transactions t on t.id=e.transaction_id and t.business_id=e.business_id
    join public.finance_operations o on o.id=t.operation_id and o.business_id=t.business_id
    where e.business_id=v_business_id and e.fund_id=p_fund_id
    order by t.occurred_at desc, e.id limit p_limit
  ) x;
  return jsonb_build_object('fund_id', p_fund_id, 'balance', private.finance_fund_balance(v_business_id,p_fund_id), 'items', v_items);
end;
$$;

create or replace function public.business_order_finance_summaries(p_business_id uuid, p_limit integer default 100)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare v_items jsonb;
begin
  perform private.require_finance_permission(p_business_id, 'read');
  if p_limit < 1 or p_limit > 500 then raise exception 'invalid pagination' using errcode='22023'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', o.id, 'order_code', o.order_code, 'customer_name', o.customer_name,
    'phone', o.phone, 'delivery_date', o.delivery_date, 'delivery_time', o.delivery_time,
    'delivery_method', o.delivery_method, 'notes', o.notes, 'total_price', o.total_price,
    'composition_status', o.composition_status, 'operational_status', o.status,
    'financial', case when ofn.order_id is null then null else public.order_financial_exception_summary(o.id) end
  ) order by o.delivery_date desc, o.created_at desc), '[]'::jsonb) into v_items
  from (select * from public.orders where business_id=p_business_id order by delivery_date desc, created_at desc limit p_limit) o
  left join public.order_financials ofn on ofn.order_id=o.id and ofn.business_id=o.business_id;
  return v_items;
end;
$$;

create or replace function public.finance_reconciliation_list(p_business_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare v_items jsonb;
begin
  perform private.require_finance_permission(p_business_id, 'read');
  select coalesce(jsonb_agg(public.finance_reconciliation_summary(r.id) order by r.opened_at desc), '[]'::jsonb) into v_items
  from public.finance_reconciliations r where r.business_id=p_business_id;
  return v_items;
end;
$$;

create or replace function public.finance_reconciliation_candidates(p_reconciliation_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare v_r public.finance_reconciliations%rowtype; v_items jsonb;
begin
  select * into v_r from public.finance_reconciliations where id=p_reconciliation_id;
  if not found then raise exception 'reconciliation not found' using errcode='22023'; end if;
  perform private.require_finance_permission(v_r.business_id, 'read');
  select coalesce(jsonb_agg(to_jsonb(x) order by x.occurred_at, x.transaction_id), '[]'::jsonb) into v_items from (
    select t.id transaction_id, t.occurred_at, coalesce(t.note,o.note) note, o.operation_type,
      sum(case when e.direction='in' then e.amount else -e.amount end)::numeric(14,2) account_effect
    from public.finance_transactions t
    join public.finance_operations o on o.id=t.operation_id and o.business_id=t.business_id
    join public.finance_transaction_entries e on e.transaction_id=t.id and e.business_id=t.business_id
    join public.finance_funds f on f.id=e.fund_id and f.business_id=e.business_id
    where t.business_id=v_r.business_id and t.status='posted' and t.occurred_at<=v_r.cutoff_at
      and f.account_id=v_r.account_id
      and not exists (select 1 from public.finance_reconciliation_entries re where re.entry_id=e.id)
    group by t.id,t.occurred_at,t.note,o.note,o.operation_type
  ) x;
  return v_items;
end;
$$;
