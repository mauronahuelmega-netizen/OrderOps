-- Phase 3A: append-only economic corrections for root general-ledger operations.

create or replace function public.create_finance_correction(
  p_business_id uuid,
  p_client_request_id uuid,
  p_request_hash text,
  p_target_operation_id uuid,
  p_desired_entries jsonb,
  p_category_id uuid default null,
  p_area public.finance_category_area default null,
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
  v_fingerprint text;
  v_existing public.finance_operations%rowtype;
  v_target public.finance_operations%rowtype;
  v_correction_id uuid;
  v_transaction_id uuid;
  v_item jsonb;
  v_fund public.finance_funds%rowtype;
  v_fund_ids uuid[];
  v_locked_count integer;
  v_fund_id uuid;
  v_amount numeric(14, 2);
  v_direction text;
  v_effect numeric(14, 2);
  v_current_effect jsonb := '{}'::jsonb;
  v_desired_effect jsonb := '{}'::jsonb;
  v_delta numeric(14, 2);
  v_nonzero_count integer := 0;
  v_sum_in numeric(14, 2) := 0;
  v_sum_out numeric(14, 2) := 0;
  v_total numeric(14, 2) := 0;
  v_accounts uuid[];
  v_source_types text[] := '{}';
  v_destination_areas text[] := '{}';
begin
  v_uid := private.require_finance_permission(p_business_id, 'manage_finance_corrections');

  if p_client_request_id is null or coalesce(trim(p_request_hash), '') = ''
     or p_target_operation_id is null or p_occurred_at is null then
    raise exception 'request id, request hash, target and occurred_at are required'
      using errcode = '22023';
  end if;
  if p_desired_entries is null
     or jsonb_typeof(p_desired_entries) <> 'array'
     or jsonb_array_length(p_desired_entries) = 0 then
    raise exception 'p_desired_entries must be a non-empty array'
      using errcode = '22023';
  end if;

  v_fingerprint := private.finance_request_fingerprint(
    p_request_hash,
    jsonb_build_object(
      'action', 'correction',
      'target_operation_id', p_target_operation_id,
      'desired_entries', p_desired_entries,
      'category_id', p_category_id,
      'area', p_area,
      'note', p_note,
      'occurred_at', p_occurred_at,
      'allow_protected_reserve', coalesce(p_allow_protected_reserve, false),
      'allow_strong_confirm', coalesce(p_allow_strong_confirm, false)
    )
  );

  perform private.lock_finance_request(p_business_id, p_client_request_id);
  v_existing := private.get_idempotent_finance_operation(
    p_business_id, p_client_request_id, v_fingerprint
  );
  if v_existing.id is not null then
    if v_existing.operation_type <> 'correction'
       or v_existing.target_operation_id is distinct from p_target_operation_id then
      raise exception 'IDEMPOTENCY_CONFLICT' using errcode = '23505';
    end if;
    return jsonb_build_object(
      'operation_id', v_existing.id,
      'target_operation_id', p_target_operation_id,
      'idempotent', true
    );
  end if;

  v_target := private.lock_finance_operation(p_business_id, p_target_operation_id);
  if v_target.id is null then
    raise exception 'target operation not found' using errcode = '22023';
  end if;
  if v_target.operation_type not in ('income', 'expense', 'transfer')
     or v_target.target_operation_id is not null then
    raise exception 'corrections must target a root general-ledger operation'
      using errcode = 'P0001';
  end if;
  if exists (
    select 1
    from public.finance_transactions t
    left join public.finance_transaction_entries e
      on e.transaction_id = t.id and e.business_id = t.business_id
    left join public.finance_funds f
      on f.id = e.fund_id and f.business_id = e.business_id
    where t.business_id = p_business_id
      and t.operation_id = p_target_operation_id
      and (t.status <> 'posted' or t.order_id is not null
           or f.fund_type = 'committed' or f.order_id is not null)
  ) then
    raise exception 'target is voided or order-linked' using errcode = 'P0001';
  end if;

  if v_target.operation_type = 'transfer' then
    if p_category_id is not null or p_area is not null then
      raise exception 'transfer correction does not accept category or area'
        using errcode = '22023';
    end if;
  else
    if p_area is null then
      raise exception 'income and expense corrections require area'
        using errcode = '22023';
    end if;
    if p_category_id is not null and not exists (
      select 1
      from public.finance_categories c
      where c.id = p_category_id
        and c.business_id = p_business_id
        and c.active
        and c.kind::text = v_target.operation_type::text
        and c.area = p_area
    ) then
      raise exception 'invalid category for correction' using errcode = '22023';
    end if;
  end if;

  for v_item in select * from jsonb_array_elements(p_desired_entries)
  loop
    begin
      v_fund_id := (v_item->>'fund_id')::uuid;
      v_amount := (v_item->>'amount')::numeric(14, 2);
    exception when others then
      raise exception 'each desired entry requires valid fund_id and amount'
        using errcode = '22023';
    end;
    v_amount := private.assert_finance_amount(v_amount);

    select * into v_fund
    from public.finance_funds
    where id = v_fund_id and business_id = p_business_id;
    if not found or not v_fund.active then
      raise exception 'invalid or inactive desired fund' using errcode = '22023';
    end if;
    if v_fund.fund_type = 'committed' or v_fund.order_id is not null then
      raise exception 'order-linked funds require the order finance flow'
        using errcode = 'P0001';
    end if;
    if v_fund.fund_type = 'business_capital' and p_area = 'family' then
      raise exception 'business_capital does not accept family corrections'
        using errcode = 'P0001';
    end if;

    if v_target.operation_type = 'income' then
      v_direction := 'in';
    elsif v_target.operation_type = 'expense' then
      v_direction := 'out';
      if v_fund.fund_type = 'protected_reserve' then
        if not coalesce(p_allow_protected_reserve, false) then
          raise exception 'protected_reserve_confirmation_required' using errcode = 'P0001';
        end if;
        if v_fund.requires_strong_confirmation
           and not coalesce(p_allow_strong_confirm, false) then
          raise exception 'strong_confirmation_required' using errcode = 'P0001';
        end if;
      end if;
    else
      v_direction := v_item->>'direction';
      if v_direction not in ('in', 'out') then
        raise exception 'transfer desired entries require direction in|out'
          using errcode = '22023';
      end if;
    end if;

    if v_direction = 'in' then
      v_effect := v_amount;
      v_sum_in := v_sum_in + v_amount;
      if v_target.operation_type = 'transfer' then
        v_destination_areas := array_append(v_destination_areas, v_fund.area_hint::text);
      end if;
    else
      v_effect := -v_amount;
      v_sum_out := v_sum_out + v_amount;
      if v_target.operation_type = 'transfer' then
        v_source_types := array_append(v_source_types, v_fund.fund_type::text);
      end if;
    end if;
    v_total := v_total + v_amount;
    v_desired_effect := jsonb_set(
      v_desired_effect,
      array[v_fund_id::text],
      to_jsonb(coalesce((v_desired_effect->>v_fund_id::text)::numeric, 0) + v_effect)
    );
  end loop;

  if v_target.operation_type = 'transfer' then
    if v_sum_in <> v_sum_out then
      raise exception 'transfer_imbalance: in % differs from out %', v_sum_in, v_sum_out
        using errcode = 'P0001';
    end if;
    if (select count(distinct key) from jsonb_each_text(v_desired_effect) where value::numeric <> 0) < 2 then
      raise exception 'source and destination funds must differ' using errcode = '22023';
    end if;
    if 'business_capital' = any(v_source_types) and 'family' = any(v_destination_areas) then
      raise exception 'capital_to_family_forbidden' using errcode = 'P0001';
    end if;
  end if;

  for v_fund_id, v_effect in
    select e.fund_id,
           sum(case when e.direction = 'in' then e.amount else -e.amount end)::numeric(14, 2)
    from public.finance_transactions t
    join public.finance_operations o
      on o.id = t.operation_id and o.business_id = t.business_id
    join public.finance_transaction_entries e
      on e.transaction_id = t.id and e.business_id = t.business_id
    where t.business_id = p_business_id
      and t.status = 'posted'
      and (
        o.id = p_target_operation_id
        or (o.operation_type = 'correction' and o.target_operation_id = p_target_operation_id)
      )
    group by e.fund_id
  loop
    v_current_effect := jsonb_set(v_current_effect, array[v_fund_id::text], to_jsonb(v_effect));
  end loop;

  select array_agg(distinct key::uuid order by key::uuid)
  into v_fund_ids
  from (
    select key from jsonb_each_text(v_current_effect)
    union
    select key from jsonb_each_text(v_desired_effect)
  ) funds;

  select count(*) into v_locked_count
  from private.lock_finance_funds(p_business_id, v_fund_ids);
  if v_locked_count <> cardinality(v_fund_ids) then
    raise exception 'invalid correction fund set' using errcode = 'P0001';
  end if;

  select array_agg(distinct f.account_id order by f.account_id)
  into v_accounts
  from public.finance_funds f
  where f.business_id = p_business_id and f.id = any(v_fund_ids);
  if private.finance_date_in_closed_period(p_business_id, v_accounts, p_occurred_at) then
    raise exception 'correction falls in a closed reconciliation period'
      using errcode = 'P0001';
  end if;

  for v_fund_id in select unnest(v_fund_ids)
  loop
    v_delta := coalesce((v_desired_effect->>v_fund_id::text)::numeric, 0)
      - coalesce((v_current_effect->>v_fund_id::text)::numeric, 0);
    if v_delta <> 0 then
      v_nonzero_count := v_nonzero_count + 1;
      if private.finance_fund_balance(p_business_id, v_fund_id) + v_delta < 0 then
        raise exception 'insufficient_funds: correction would make fund % negative', v_fund_id
          using errcode = 'P0001';
      end if;
    end if;
  end loop;

  if v_nonzero_count = 0 then
    raise exception 'NO_ECONOMIC_CHANGE' using errcode = 'P0001';
  end if;

  insert into public.finance_operations (
    business_id, operation_type, client_request_id, request_hash,
    note, created_by, target_operation_id
  ) values (
    p_business_id, 'correction', p_client_request_id, v_fingerprint,
    p_note, v_uid, p_target_operation_id
  ) returning id into v_correction_id;

  insert into public.finance_transactions (
    business_id, operation_id, status, area, category_id,
    occurred_at, note, created_by
  ) values (
    p_business_id, v_correction_id, 'posted',
    case when v_target.operation_type = 'transfer' then null else p_area end,
    case when v_target.operation_type = 'transfer' then null else p_category_id end,
    p_occurred_at, p_note, v_uid
  ) returning id into v_transaction_id;

  for v_fund_id in select unnest(v_fund_ids)
  loop
    v_delta := coalesce((v_desired_effect->>v_fund_id::text)::numeric, 0)
      - coalesce((v_current_effect->>v_fund_id::text)::numeric, 0);
    if v_delta <> 0 then
      insert into public.finance_transaction_entries (
        business_id, transaction_id, fund_id, direction, amount
      ) values (
        p_business_id, v_transaction_id, v_fund_id,
        (case when v_delta > 0 then 'in' else 'out' end)::public.finance_entry_direction,
        abs(v_delta)
      );
    end if;
  end loop;

  insert into public.finance_audit_events (
    business_id, actor_id, event_type, entity_type, entity_id, payload
  ) values (
    p_business_id, v_uid, 'finance_correction_created', 'operation', v_correction_id,
    jsonb_build_object(
      'target_operation_id', p_target_operation_id,
      'transaction_id', v_transaction_id,
      'corrected_operation_type', v_target.operation_type
    )
  );

  return jsonb_build_object(
    'operation_id', v_correction_id,
    'target_operation_id', p_target_operation_id,
    'transaction_id', v_transaction_id,
    'delta_entry_count', v_nonzero_count,
    'idempotent', false
  );
end;
$$;
