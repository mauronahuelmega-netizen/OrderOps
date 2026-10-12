-- Phase 2A: append-only general income, expense, and transfer RPCs.

create or replace function public.create_income(
  p_business_id uuid,
  p_client_request_id uuid,
  p_request_hash text,
  p_splits jsonb,
  p_category_id uuid default null,
  p_area public.finance_category_area default 'business',
  p_note text default null,
  p_occurred_at timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid;
  v_existing public.finance_operations%rowtype;
  v_operation_id uuid;
  v_transaction_id uuid;
  v_item jsonb;
  v_fund_ids uuid[];
  v_fund public.finance_funds%rowtype;
  v_amount numeric(14, 2);
  v_total numeric(14, 2) := 0;
  v_locked_count integer := 0;
begin
  v_uid := private.require_finance_permission(p_business_id, 'operate');

  if p_client_request_id is null or coalesce(trim(p_request_hash), '') = '' then
    raise exception 'client_request_id and request_hash are required' using errcode = '22023';
  end if;
  if p_splits is null or jsonb_typeof(p_splits) <> 'array' or jsonb_array_length(p_splits) = 0 then
    raise exception 'p_splits must be a non-empty array' using errcode = '22023';
  end if;

  perform private.lock_finance_request(p_business_id, p_client_request_id);
  v_existing := private.get_idempotent_finance_operation(
    p_business_id, p_client_request_id, p_request_hash
  );
  if v_existing.id is not null then
    return jsonb_build_object('operation_id', v_existing.id, 'idempotent', true);
  end if;

  select array_agg(distinct (item->>'fund_id')::uuid order by (item->>'fund_id')::uuid)
  into v_fund_ids
  from jsonb_array_elements(p_splits) item;

  select count(*) into v_locked_count
  from private.lock_finance_funds(p_business_id, v_fund_ids);
  if v_locked_count <> cardinality(v_fund_ids) then
    raise exception 'invalid fund in split' using errcode = '22023';
  end if;

  if p_category_id is not null and not exists (
    select 1 from public.finance_categories c
    where c.id = p_category_id
      and c.business_id = p_business_id
      and c.active
      and c.kind = 'income'
      and c.area = p_area
  ) then
    raise exception 'invalid income category' using errcode = '22023';
  end if;

  for v_item in select * from jsonb_array_elements(p_splits)
  loop
    v_amount := (v_item->>'amount')::numeric(14, 2);
    if v_amount is null or v_amount <= 0 then
      raise exception 'each split requires amount > 0' using errcode = '22023';
    end if;

    select * into strict v_fund
    from public.finance_funds
    where id = (v_item->>'fund_id')::uuid
      and business_id = p_business_id;

    if not v_fund.active then
      raise exception 'inactive fund' using errcode = '22023';
    end if;
    if v_fund.fund_type = 'committed' or v_fund.order_id is not null then
      raise exception 'order-linked funds require the order finance flow' using errcode = 'P0001';
    end if;
    if v_fund.fund_type = 'business_capital' and p_area = 'family' then
      raise exception 'business_capital does not accept family income' using errcode = 'P0001';
    end if;

    v_total := v_total + v_amount;
  end loop;

  insert into public.finance_operations (
    business_id, operation_type, client_request_id, request_hash, note, created_by
  ) values (
    p_business_id, 'income', p_client_request_id, p_request_hash, p_note, v_uid
  ) returning id into v_operation_id;

  insert into public.finance_transactions (
    business_id, operation_id, status, area, category_id, occurred_at, note, created_by
  ) values (
    p_business_id, v_operation_id, 'posted', p_area, p_category_id,
    coalesce(p_occurred_at, now()), p_note, v_uid
  ) returning id into v_transaction_id;

  for v_item in select * from jsonb_array_elements(p_splits)
  loop
    insert into public.finance_transaction_entries (
      business_id, transaction_id, fund_id, direction, amount
    ) values (
      p_business_id, v_transaction_id, (v_item->>'fund_id')::uuid,
      'in', (v_item->>'amount')::numeric(14, 2)
    );
  end loop;

  insert into public.finance_audit_events (
    business_id, actor_id, event_type, entity_type, entity_id, payload
  ) values (
    p_business_id, v_uid, 'income_created', 'operation', v_operation_id,
    jsonb_build_object(
      'transaction_id', v_transaction_id,
      'total', v_total,
      'category_id', p_category_id,
      'area', p_area
    )
  );

  return jsonb_build_object(
    'operation_id', v_operation_id,
    'transaction_id', v_transaction_id,
    'total', v_total,
    'idempotent', false
  );
end;
$$;

create or replace function public.create_expense(
  p_business_id uuid,
  p_client_request_id uuid,
  p_request_hash text,
  p_splits jsonb,
  p_category_id uuid default null,
  p_area public.finance_category_area default 'business',
  p_note text default null,
  p_occurred_at timestamptz default now(),
  p_allow_protected_reserve boolean default false,
  p_allow_strong_confirm boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid;
  v_existing public.finance_operations%rowtype;
  v_operation_id uuid;
  v_transaction_id uuid;
  v_item jsonb;
  v_fund_ids uuid[];
  v_fund public.finance_funds%rowtype;
  v_amount numeric(14, 2);
  v_total numeric(14, 2) := 0;
  v_out_by_fund jsonb := '{}'::jsonb;
  v_fund_id uuid;
  v_outbound numeric;
  v_locked_count integer := 0;
begin
  v_uid := private.require_finance_permission(p_business_id, 'operate');

  if p_client_request_id is null or coalesce(trim(p_request_hash), '') = '' then
    raise exception 'client_request_id and request_hash are required' using errcode = '22023';
  end if;
  if p_splits is null or jsonb_typeof(p_splits) <> 'array' or jsonb_array_length(p_splits) = 0 then
    raise exception 'p_splits must be a non-empty array' using errcode = '22023';
  end if;

  perform private.lock_finance_request(p_business_id, p_client_request_id);
  v_existing := private.get_idempotent_finance_operation(
    p_business_id, p_client_request_id, p_request_hash
  );
  if v_existing.id is not null then
    return jsonb_build_object('operation_id', v_existing.id, 'idempotent', true);
  end if;

  select array_agg(distinct (item->>'fund_id')::uuid order by (item->>'fund_id')::uuid)
  into v_fund_ids
  from jsonb_array_elements(p_splits) item;

  select count(*) into v_locked_count
  from private.lock_finance_funds(p_business_id, v_fund_ids);
  if v_locked_count <> cardinality(v_fund_ids) then
    raise exception 'invalid fund in split' using errcode = '22023';
  end if;

  if p_category_id is not null and not exists (
    select 1 from public.finance_categories c
    where c.id = p_category_id
      and c.business_id = p_business_id
      and c.active
      and c.kind = 'expense'
      and c.area = p_area
  ) then
    raise exception 'invalid expense category' using errcode = '22023';
  end if;

  for v_item in select * from jsonb_array_elements(p_splits)
  loop
    v_amount := (v_item->>'amount')::numeric(14, 2);
    v_fund_id := (v_item->>'fund_id')::uuid;
    if v_amount is null or v_amount <= 0 then
      raise exception 'each split requires amount > 0' using errcode = '22023';
    end if;

    select * into strict v_fund
    from public.finance_funds
    where id = v_fund_id
      and business_id = p_business_id;

    if not v_fund.active then
      raise exception 'inactive fund' using errcode = '22023';
    end if;
    if v_fund.fund_type = 'committed' or v_fund.order_id is not null then
      raise exception 'order-linked funds require the order finance flow' using errcode = 'P0001';
    end if;
    if v_fund.fund_type = 'business_capital' and p_area = 'family' then
      raise exception 'business_capital does not accept family expense' using errcode = 'P0001';
    end if;
    if v_fund.fund_type = 'protected_reserve' then
      if not coalesce(p_allow_protected_reserve, false) then
        raise exception 'protected_reserve_confirmation_required' using errcode = 'P0001';
      end if;
      if v_fund.requires_strong_confirmation and not coalesce(p_allow_strong_confirm, false) then
        raise exception 'strong_confirmation_required' using errcode = 'P0001';
      end if;
    end if;

    v_total := v_total + v_amount;
    v_out_by_fund := jsonb_set(
      v_out_by_fund,
      array[v_fund_id::text],
      to_jsonb(coalesce((v_out_by_fund->>v_fund_id::text)::numeric, 0) + v_amount)
    );
  end loop;

  for v_fund_id, v_outbound in
    select key::uuid, value::numeric from jsonb_each_text(v_out_by_fund)
  loop
    perform private.assert_finance_fund_spendable(p_business_id, v_fund_id, v_outbound);
  end loop;

  insert into public.finance_operations (
    business_id, operation_type, client_request_id, request_hash, note, created_by
  ) values (
    p_business_id, 'expense', p_client_request_id, p_request_hash, p_note, v_uid
  ) returning id into v_operation_id;

  insert into public.finance_transactions (
    business_id, operation_id, status, area, category_id, occurred_at, note, created_by
  ) values (
    p_business_id, v_operation_id, 'posted', p_area, p_category_id,
    coalesce(p_occurred_at, now()), p_note, v_uid
  ) returning id into v_transaction_id;

  for v_item in select * from jsonb_array_elements(p_splits)
  loop
    insert into public.finance_transaction_entries (
      business_id, transaction_id, fund_id, direction, amount
    ) values (
      p_business_id, v_transaction_id, (v_item->>'fund_id')::uuid,
      'out', (v_item->>'amount')::numeric(14, 2)
    );
  end loop;

  insert into public.finance_audit_events (
    business_id, actor_id, event_type, entity_type, entity_id, payload
  ) values (
    p_business_id, v_uid, 'expense_created', 'operation', v_operation_id,
    jsonb_build_object(
      'transaction_id', v_transaction_id,
      'total', v_total,
      'category_id', p_category_id,
      'area', p_area
    )
  );

  return jsonb_build_object(
    'operation_id', v_operation_id,
    'transaction_id', v_transaction_id,
    'total', v_total,
    'idempotent', false
  );
end;
$$;

create or replace function public.create_transfer(
  p_business_id uuid,
  p_client_request_id uuid,
  p_request_hash text,
  p_legs jsonb,
  p_note text default null,
  p_occurred_at timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid;
  v_existing public.finance_operations%rowtype;
  v_operation_id uuid;
  v_transaction_id uuid;
  v_item jsonb;
  v_fund_ids uuid[];
  v_fund public.finance_funds%rowtype;
  v_amount numeric(14, 2);
  v_direction text;
  v_sum_in numeric(14, 2) := 0;
  v_sum_out numeric(14, 2) := 0;
  v_out_by_fund jsonb := '{}'::jsonb;
  v_fund_id uuid;
  v_outbound numeric;
  v_source_types text[] := '{}';
  v_destination_areas text[] := '{}';
  v_locked_count integer := 0;
begin
  v_uid := private.require_finance_permission(p_business_id, 'operate');

  if p_client_request_id is null or coalesce(trim(p_request_hash), '') = '' then
    raise exception 'client_request_id and request_hash are required' using errcode = '22023';
  end if;
  if p_legs is null or jsonb_typeof(p_legs) <> 'array' or jsonb_array_length(p_legs) < 2 then
    raise exception 'p_legs requires at least two legs' using errcode = '22023';
  end if;

  perform private.lock_finance_request(p_business_id, p_client_request_id);
  v_existing := private.get_idempotent_finance_operation(
    p_business_id, p_client_request_id, p_request_hash
  );
  if v_existing.id is not null then
    return jsonb_build_object('operation_id', v_existing.id, 'idempotent', true);
  end if;

  select array_agg(distinct (item->>'fund_id')::uuid order by (item->>'fund_id')::uuid)
  into v_fund_ids
  from jsonb_array_elements(p_legs) item;

  if cardinality(v_fund_ids) < 2 then
    raise exception 'source and destination funds must differ' using errcode = '22023';
  end if;

  select count(*) into v_locked_count
  from private.lock_finance_funds(p_business_id, v_fund_ids);
  if v_locked_count <> cardinality(v_fund_ids) then
    raise exception 'invalid fund in transfer' using errcode = '22023';
  end if;

  for v_item in select * from jsonb_array_elements(p_legs)
  loop
    v_amount := (v_item->>'amount')::numeric(14, 2);
    v_direction := v_item->>'direction';
    v_fund_id := (v_item->>'fund_id')::uuid;
    if v_amount is null or v_amount <= 0 or v_direction not in ('in', 'out') then
      raise exception 'each leg requires fund_id, direction in|out, and amount > 0'
        using errcode = '22023';
    end if;

    select * into strict v_fund
    from public.finance_funds
    where id = v_fund_id
      and business_id = p_business_id;

    if not v_fund.active then
      raise exception 'inactive fund' using errcode = '22023';
    end if;
    if v_fund.fund_type = 'committed' or v_fund.order_id is not null then
      raise exception 'order-linked funds require the order finance flow' using errcode = 'P0001';
    end if;

    if v_direction = 'in' then
      v_sum_in := v_sum_in + v_amount;
      v_destination_areas := array_append(v_destination_areas, v_fund.area_hint::text);
    else
      v_sum_out := v_sum_out + v_amount;
      v_source_types := array_append(v_source_types, v_fund.fund_type::text);
      v_out_by_fund := jsonb_set(
        v_out_by_fund,
        array[v_fund_id::text],
        to_jsonb(coalesce((v_out_by_fund->>v_fund_id::text)::numeric, 0) + v_amount)
      );
    end if;
  end loop;

  if v_sum_in <> v_sum_out then
    raise exception 'transfer_imbalance: in % differs from out %', v_sum_in, v_sum_out
      using errcode = 'P0001';
  end if;
  if 'business_capital' = any(v_source_types) and 'family' = any(v_destination_areas) then
    raise exception 'capital_to_family_forbidden' using errcode = 'P0001';
  end if;

  for v_fund_id, v_outbound in
    select key::uuid, value::numeric from jsonb_each_text(v_out_by_fund)
  loop
    perform private.assert_finance_fund_spendable(p_business_id, v_fund_id, v_outbound);
  end loop;

  insert into public.finance_operations (
    business_id, operation_type, client_request_id, request_hash, note, created_by
  ) values (
    p_business_id, 'transfer', p_client_request_id, p_request_hash, p_note, v_uid
  ) returning id into v_operation_id;

  insert into public.finance_transactions (
    business_id, operation_id, status, occurred_at, note, created_by
  ) values (
    p_business_id, v_operation_id, 'posted', coalesce(p_occurred_at, now()), p_note, v_uid
  ) returning id into v_transaction_id;

  for v_item in select * from jsonb_array_elements(p_legs)
  loop
    insert into public.finance_transaction_entries (
      business_id, transaction_id, fund_id, direction, amount
    ) values (
      p_business_id, v_transaction_id, (v_item->>'fund_id')::uuid,
      (v_item->>'direction')::public.finance_entry_direction,
      (v_item->>'amount')::numeric(14, 2)
    );
  end loop;

  insert into public.finance_audit_events (
    business_id, actor_id, event_type, entity_type, entity_id, payload
  ) values (
    p_business_id, v_uid, 'transfer_created', 'operation', v_operation_id,
    jsonb_build_object('transaction_id', v_transaction_id, 'total', v_sum_out)
  );

  return jsonb_build_object(
    'operation_id', v_operation_id,
    'transaction_id', v_transaction_id,
    'total', v_sum_out,
    'idempotent', false
  );
end;
$$;
