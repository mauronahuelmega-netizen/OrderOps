-- Phase 2B: protected deposits and order collections. No settlement or release.

create or replace function public.create_deposit(
  p_business_id uuid,
  p_client_request_id uuid,
  p_request_hash text,
  p_order_id uuid,
  p_amount numeric,
  p_income_fund_id uuid,
  p_coverage_fund_id uuid default null,
  p_category_id uuid default null,
  p_note text default null,
  p_occurred_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid;
  v_fingerprint text;
  v_existing public.finance_operations%rowtype;
  v_financials public.order_financials%rowtype;
  v_settings public.business_finance_settings%rowtype;
  v_income_fund public.finance_funds%rowtype;
  v_coverage public.finance_funds%rowtype;
  v_committed public.finance_funds%rowtype;
  v_amount numeric(14, 2);
  v_paid numeric(14, 2);
  v_direct boolean;
  v_lock_ids uuid[];
  v_locked_count integer;
  v_operation_id uuid;
  v_income_transaction_id uuid;
  v_coverage_transaction_id uuid;
  v_at timestamptz;
begin
  v_uid := private.require_finance_permission(p_business_id, 'operate');

  if p_client_request_id is null or coalesce(trim(p_request_hash), '') = '' then
    raise exception 'client_request_id and request_hash are required' using errcode = '22023';
  end if;
  v_amount := private.assert_finance_amount(p_amount);
  v_fingerprint := private.finance_request_fingerprint(
    p_request_hash,
    jsonb_build_object(
      'kind', 'deposit',
      'order_id', p_order_id,
      'amount', v_amount,
      'income_fund_id', p_income_fund_id,
      'coverage_fund_id', p_coverage_fund_id,
      'category_id', p_category_id,
      'note', p_note,
      'occurred_at', p_occurred_at
    )
  );

  perform private.lock_finance_request(p_business_id, p_client_request_id);
  v_existing := private.get_idempotent_finance_operation(
    p_business_id, p_client_request_id, v_fingerprint
  );
  if v_existing.id is not null then
    return jsonb_build_object('operation_id', v_existing.id, 'idempotent', true);
  end if;

  v_financials := private.lock_order_financials(p_business_id, p_order_id);
  if v_financials.agreed_total is null then
    raise exception 'agreed_total_required' using errcode = 'P0001';
  end if;

  select * into v_settings
  from public.business_finance_settings
  where business_id = p_business_id;
  if not found or v_settings.protection_account_id is null then
    raise exception 'protection_account_missing' using errcode = 'P0001';
  end if;

  select * into v_income_fund
  from public.finance_funds
  where id = p_income_fund_id
    and business_id = p_business_id;
  if not found
     or not v_income_fund.active
     or v_income_fund.fund_type = 'committed'
     or v_income_fund.order_id is not null then
    raise exception 'invalid income fund' using errcode = '22023';
  end if;

  if p_category_id is not null and not exists (
    select 1
    from public.finance_categories c
    where c.id = p_category_id
      and c.business_id = p_business_id
      and c.active
      and c.kind = 'income'
      and c.area = 'business'
  ) then
    raise exception 'invalid deposit category' using errcode = '22023';
  end if;

  v_direct := v_income_fund.account_id = v_settings.protection_account_id;
  v_committed := private.get_or_create_committed_fund(p_business_id, p_order_id);

  if v_direct then
    v_lock_ids := array[v_income_fund.id, v_committed.id];
  else
    v_coverage := private.resolve_order_coverage_fund(p_business_id, p_coverage_fund_id);
    v_lock_ids := array[v_income_fund.id, v_coverage.id, v_committed.id];
  end if;
  select array_agg(distinct x order by x) into v_lock_ids from unnest(v_lock_ids) x;

  select count(*) into v_locked_count
  from private.lock_finance_funds(p_business_id, v_lock_ids);
  if v_locked_count <> cardinality(v_lock_ids) then
    raise exception 'invalid fund in deposit' using errcode = '22023';
  end if;

  select * into strict v_income_fund
  from public.finance_funds
  where id = p_income_fund_id and business_id = p_business_id;
  select * into strict v_committed
  from public.finance_funds
  where id = v_committed.id and business_id = p_business_id;

  if not v_income_fund.active
     or v_income_fund.fund_type = 'committed'
     or v_income_fund.order_id is not null
     or v_direct <> (v_income_fund.account_id = v_settings.protection_account_id) then
    raise exception 'income fund changed during deposit' using errcode = 'P0001';
  end if;

  if not v_direct then
    v_coverage := private.resolve_order_coverage_fund(p_business_id, p_coverage_fund_id);
    perform private.assert_finance_fund_spendable(p_business_id, v_coverage.id, v_amount);
  end if;

  v_paid := private.order_paid_net(p_business_id, p_order_id);
  if v_paid + v_amount > v_financials.agreed_total then
    raise exception 'deposit_exceeds_remaining' using errcode = 'P0001';
  end if;

  v_at := coalesce(p_occurred_at, now());

  insert into public.finance_operations (
    business_id, operation_type, client_request_id, request_hash, note, created_by
  ) values (
    p_business_id, 'deposit', p_client_request_id, v_fingerprint, p_note, v_uid
  ) returning id into v_operation_id;

  insert into public.finance_transactions (
    business_id, operation_id, status, area, category_id, order_id,
    occurred_at, note, created_by
  ) values (
    p_business_id, v_operation_id, 'posted', 'business', p_category_id, p_order_id,
    v_at, coalesce(p_note, 'Order deposit'), v_uid
  ) returning id into v_income_transaction_id;

  if v_direct then
    insert into public.finance_transaction_entries (
      business_id, transaction_id, fund_id, direction, amount
    ) values (
      p_business_id, v_income_transaction_id, v_committed.id, 'in', v_amount
    );
  else
    insert into public.finance_transaction_entries (
      business_id, transaction_id, fund_id, direction, amount
    ) values (
      p_business_id, v_income_transaction_id, v_income_fund.id, 'in', v_amount
    );

    insert into public.finance_transactions (
      business_id, operation_id, status, order_id, occurred_at, note, created_by
    ) values (
      p_business_id, v_operation_id, 'posted', p_order_id, v_at,
      'Order deposit protection coverage', v_uid
    ) returning id into v_coverage_transaction_id;

    insert into public.finance_transaction_entries (
      business_id, transaction_id, fund_id, direction, amount
    ) values
      (p_business_id, v_coverage_transaction_id, v_coverage.id, 'out', v_amount),
      (p_business_id, v_coverage_transaction_id, v_committed.id, 'in', v_amount);
  end if;

  insert into public.finance_audit_events (
    business_id, actor_id, event_type, entity_type, entity_id, payload
  ) values (
    p_business_id, v_uid, 'deposit_created', 'operation', v_operation_id,
    jsonb_build_object(
      'order_id', p_order_id,
      'amount', v_amount,
      'direct', v_direct,
      'committed_fund_id', v_committed.id,
      'income_fund_id', v_income_fund.id,
      'coverage_fund_id', case when v_direct then null else v_coverage.id end
    )
  );

  return jsonb_build_object(
    'operation_id', v_operation_id,
    'committed_fund_id', v_committed.id,
    'paid_net', v_paid + v_amount,
    'committed', private.order_committed_amount(p_business_id, p_order_id),
    'remaining', greatest(v_financials.agreed_total - v_paid - v_amount, 0),
    'direct', v_direct,
    'idempotent', false
  );
end;
$$;

create or replace function public.record_order_payment(
  p_business_id uuid,
  p_order_id uuid,
  p_client_request_id uuid,
  p_request_hash text,
  p_payments jsonb,
  p_note text default null,
  p_occurred_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid;
  v_fingerprint text;
  v_existing public.finance_operations%rowtype;
  v_financials public.order_financials%rowtype;
  v_row record;
  v_sum numeric(14, 2) := 0;
  v_mp numeric(14, 2) := 0;
  v_cash numeric(14, 2) := 0;
  v_paid numeric(14, 2);
  v_committed public.finance_funds%rowtype;
  v_cash_fund public.finance_funds%rowtype;
  v_coverage public.finance_funds%rowtype;
  v_lock_ids uuid[];
  v_locked_count integer;
  v_operation_id uuid;
  v_income_transaction_id uuid;
  v_coverage_transaction_id uuid;
  v_at timestamptz;
begin
  v_uid := private.require_finance_permission(p_business_id, 'operate');

  if p_client_request_id is null or coalesce(trim(p_request_hash), '') = '' then
    raise exception 'client_request_id and request_hash are required' using errcode = '22023';
  end if;

  for v_row in select * from private.parse_order_payments(p_payments)
  loop
    v_sum := v_sum + v_row.amount;
    if v_row.medium = 'mercado_pago' then
      v_mp := v_mp + v_row.amount;
    else
      v_cash := v_cash + v_row.amount;
    end if;
  end loop;

  v_fingerprint := private.finance_request_fingerprint(
    p_request_hash,
    jsonb_build_object(
      'kind', 'order_payment',
      'order_id', p_order_id,
      'payments', p_payments,
      'note', p_note,
      'occurred_at', p_occurred_at
    )
  );

  perform private.lock_finance_request(p_business_id, p_client_request_id);
  v_existing := private.get_idempotent_finance_operation(
    p_business_id, p_client_request_id, v_fingerprint
  );
  if v_existing.id is not null then
    return jsonb_build_object('operation_id', v_existing.id, 'idempotent', true);
  end if;

  v_financials := private.lock_order_financials(p_business_id, p_order_id);
  if v_financials.agreed_total is null then
    raise exception 'agreed_total_required' using errcode = 'P0001';
  end if;

  v_committed := private.get_or_create_committed_fund(p_business_id, p_order_id);
  v_lock_ids := array[v_committed.id];

  if v_cash > 0 then
    v_cash_fund := private.resolve_order_cash_fund(p_business_id);
    v_coverage := private.resolve_order_coverage_fund(p_business_id, null);
    v_lock_ids := v_lock_ids || array[v_cash_fund.id, v_coverage.id];
  end if;
  select array_agg(distinct x order by x) into v_lock_ids from unnest(v_lock_ids) x;

  select count(*) into v_locked_count
  from private.lock_finance_funds(p_business_id, v_lock_ids);
  if v_locked_count <> cardinality(v_lock_ids) then
    raise exception 'invalid fund in order payment' using errcode = '22023';
  end if;

  select * into strict v_committed
  from public.finance_funds
  where id = v_committed.id and business_id = p_business_id;
  if v_cash > 0 then
    v_cash_fund := private.resolve_order_cash_fund(p_business_id);
    v_coverage := private.resolve_order_coverage_fund(p_business_id, null);
    perform private.assert_finance_fund_spendable(p_business_id, v_coverage.id, v_cash);
  end if;

  v_paid := private.order_paid_net(p_business_id, p_order_id);
  if v_paid + v_sum > v_financials.agreed_total then
    raise exception 'payment_exceeds_remaining' using errcode = 'P0001';
  end if;

  v_at := coalesce(p_occurred_at, now());

  insert into public.finance_operations (
    business_id, operation_type, client_request_id, request_hash, note, created_by
  ) values (
    p_business_id, 'order_payment', p_client_request_id, v_fingerprint, p_note, v_uid
  ) returning id into v_operation_id;

  insert into public.finance_transactions (
    business_id, operation_id, status, area, order_id, occurred_at, note, created_by
  ) values (
    p_business_id, v_operation_id, 'posted', 'business', p_order_id, v_at,
    coalesce(p_note, 'Order payment'), v_uid
  ) returning id into v_income_transaction_id;

  if v_mp > 0 then
    insert into public.finance_transaction_entries (
      business_id, transaction_id, fund_id, direction, amount
    ) values (
      p_business_id, v_income_transaction_id, v_committed.id, 'in', v_mp
    );
  end if;

  if v_cash > 0 then
    insert into public.finance_transaction_entries (
      business_id, transaction_id, fund_id, direction, amount
    ) values (
      p_business_id, v_income_transaction_id, v_cash_fund.id, 'in', v_cash
    );

    insert into public.finance_transactions (
      business_id, operation_id, status, order_id, occurred_at, note, created_by
    ) values (
      p_business_id, v_operation_id, 'posted', p_order_id, v_at,
      'Cash payment protection coverage', v_uid
    ) returning id into v_coverage_transaction_id;

    insert into public.finance_transaction_entries (
      business_id, transaction_id, fund_id, direction, amount
    ) values
      (p_business_id, v_coverage_transaction_id, v_coverage.id, 'out', v_cash),
      (p_business_id, v_coverage_transaction_id, v_committed.id, 'in', v_cash);
  end if;

  insert into public.finance_audit_events (
    business_id, actor_id, event_type, entity_type, entity_id, payload
  ) values (
    p_business_id, v_uid, 'order_payment_recorded', 'operation', v_operation_id,
    jsonb_build_object(
      'order_id', p_order_id,
      'amount', v_sum,
      'mercado_pago', v_mp,
      'cash', v_cash,
      'committed_fund_id', v_committed.id
    )
  );

  return jsonb_build_object(
    'operation_id', v_operation_id,
    'committed_fund_id', v_committed.id,
    'paid_net', v_paid + v_sum,
    'committed', private.order_committed_amount(p_business_id, p_order_id),
    'remaining', greatest(v_financials.agreed_total - v_paid - v_sum, 0),
    'idempotent', false
  );
end;
$$;

create or replace function public.create_historical_deposit(
  p_business_id uuid,
  p_client_request_id uuid,
  p_request_hash text,
  p_order_id uuid,
  p_amount numeric,
  p_note text default null,
  p_occurred_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid;
  v_fingerprint text;
  v_existing public.finance_operations%rowtype;
  v_financials public.order_financials%rowtype;
  v_source public.finance_funds%rowtype;
  v_committed public.finance_funds%rowtype;
  v_amount numeric(14, 2);
  v_paid numeric(14, 2);
  v_lock_ids uuid[];
  v_locked_count integer;
  v_operation_id uuid;
  v_transaction_id uuid;
  v_at timestamptz;
begin
  v_uid := private.require_finance_permission(
    p_business_id, 'record_historical_deposit'
  );

  if p_client_request_id is null or coalesce(trim(p_request_hash), '') = '' then
    raise exception 'client_request_id and request_hash are required' using errcode = '22023';
  end if;
  v_amount := private.assert_finance_amount(p_amount);
  v_fingerprint := private.finance_request_fingerprint(
    p_request_hash,
    jsonb_build_object(
      'kind', 'historical_deposit',
      'order_id', p_order_id,
      'amount', v_amount,
      'note', p_note,
      'occurred_at', p_occurred_at
    )
  );

  perform private.lock_finance_request(p_business_id, p_client_request_id);
  v_existing := private.get_idempotent_finance_operation(
    p_business_id, p_client_request_id, v_fingerprint
  );
  if v_existing.id is not null then
    return jsonb_build_object('operation_id', v_existing.id, 'idempotent', true);
  end if;

  v_financials := private.lock_order_financials(p_business_id, p_order_id);
  if v_financials.agreed_total is null then
    raise exception 'agreed_total_required' using errcode = 'P0001';
  end if;

  v_source := private.resolve_order_coverage_fund(p_business_id, null);
  v_committed := private.get_or_create_committed_fund(p_business_id, p_order_id);
  v_lock_ids := array[v_source.id, v_committed.id];
  select array_agg(distinct x order by x) into v_lock_ids from unnest(v_lock_ids) x;

  select count(*) into v_locked_count
  from private.lock_finance_funds(p_business_id, v_lock_ids);
  if v_locked_count <> cardinality(v_lock_ids) then
    raise exception 'invalid fund in historical deposit' using errcode = '22023';
  end if;

  v_source := private.resolve_order_coverage_fund(p_business_id, null);
  select * into strict v_committed
  from public.finance_funds
  where id = v_committed.id and business_id = p_business_id;

  v_paid := private.order_paid_net(p_business_id, p_order_id);
  if v_paid + v_amount > v_financials.agreed_total then
    raise exception 'historical_amount_exceeds_remaining' using errcode = 'P0001';
  end if;
  perform private.assert_finance_fund_spendable(p_business_id, v_source.id, v_amount);

  v_at := coalesce(p_occurred_at, now());

  insert into public.finance_operations (
    business_id, operation_type, client_request_id, request_hash, note, created_by
  ) values (
    p_business_id, 'historical_deposit', p_client_request_id, v_fingerprint,
    coalesce(p_note, 'Historical order deposit'), v_uid
  ) returning id into v_operation_id;

  insert into public.finance_transactions (
    business_id, operation_id, status, order_id, occurred_at, note, created_by
  ) values (
    p_business_id, v_operation_id, 'posted', p_order_id, v_at,
    coalesce(p_note, 'Historical order deposit'), v_uid
  ) returning id into v_transaction_id;

  insert into public.finance_transaction_entries (
    business_id, transaction_id, fund_id, direction, amount
  ) values
    (p_business_id, v_transaction_id, v_source.id, 'out', v_amount),
    (p_business_id, v_transaction_id, v_committed.id, 'in', v_amount);

  insert into public.finance_audit_events (
    business_id, actor_id, event_type, entity_type, entity_id, payload
  ) values (
    p_business_id, v_uid, 'historical_deposit_created', 'operation', v_operation_id,
    jsonb_build_object(
      'order_id', p_order_id,
      'amount', v_amount,
      'source_fund_id', v_source.id,
      'committed_fund_id', v_committed.id,
      'occurred_at', v_at,
      'occurred_at_explicit', p_occurred_at is not null
    )
  );

  return jsonb_build_object(
    'operation_id', v_operation_id,
    'transaction_id', v_transaction_id,
    'committed_fund_id', v_committed.id,
    'paid_net', v_paid + v_amount,
    'committed', private.order_committed_amount(p_business_id, p_order_id),
    'remaining', greatest(v_financials.agreed_total - v_paid - v_amount, 0),
    'idempotent', false
  );
end;
$$;
