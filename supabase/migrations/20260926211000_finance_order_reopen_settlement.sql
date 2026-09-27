-- Phase 2D: financial reopen and truthful multi-cycle settlement.

create or replace function public.reopen_order_financials(
  p_business_id uuid,
  p_order_id uuid,
  p_client_request_id uuid,
  p_request_hash text,
  p_note text default null
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
  v_paid numeric(14, 2);
  v_released numeric(14, 2);
  v_protected numeric(14, 2);
  v_operation_id uuid;
begin
  v_uid := private.require_finance_permission(p_business_id, 'manage_order_contract');

  if p_order_id is null
     or p_client_request_id is null
     or coalesce(trim(p_request_hash), '') = '' then
    raise exception 'order_id, client_request_id and request_hash are required'
      using errcode = '22023';
  end if;

  v_fingerprint := private.finance_request_fingerprint(
    p_request_hash,
    jsonb_build_object(
      'kind', 'order_financial_reopen',
      'order_id', p_order_id,
      'note', p_note
    )
  );

  perform private.lock_finance_request(p_business_id, p_client_request_id);
  v_existing := private.get_idempotent_finance_operation(
    p_business_id, p_client_request_id, v_fingerprint
  );
  if v_existing.id is not null then
    if v_existing.operation_type <> 'order_financial_reopen'
       or not exists (
         select 1
         from public.finance_audit_events a
         where a.business_id = p_business_id
           and a.event_type = 'order_financials_reopened'
           and a.entity_type = 'order_financials'
           and a.entity_id = p_order_id
           and a.payload->>'operation_id' = v_existing.id::text
       ) then
      raise exception 'reopen idempotency state is inconsistent' using errcode = 'P0001';
    end if;

    return jsonb_build_object(
      'operation_id', v_existing.id,
      'order_id', p_order_id,
      'financial_status', 'open',
      'paid_net', private.order_paid_net(p_business_id, p_order_id),
      'released', private.order_released_amount(p_business_id, p_order_id),
      'committed', private.order_committed_amount(p_business_id, p_order_id),
      'remaining', private.order_remaining(p_business_id, p_order_id),
      'protection_variance', private.order_protection_variance(p_business_id, p_order_id),
      'idempotent', true
    );
  end if;

  select * into v_financials
  from public.order_financials
  where order_id = p_order_id
    and business_id = p_business_id
  for update;

  if not found then
    raise exception 'order_financials not initialized' using errcode = '22023';
  end if;
  if v_financials.financial_status <> 'settled' then
    raise exception 'only settled order finance can be reopened' using errcode = 'P0001';
  end if;

  v_paid := private.order_paid_net(p_business_id, p_order_id);
  v_released := private.order_released_amount(p_business_id, p_order_id);
  v_protected := private.order_committed_amount(p_business_id, p_order_id);

  if v_protected <> 0
     or v_paid <> v_released
     or private.order_protection_variance(p_business_id, p_order_id) <> 0 then
    raise exception 'reopen_protection_invariant_failed' using errcode = 'P0001';
  end if;

  insert into public.finance_operations (
    business_id, operation_type, client_request_id, request_hash, note, created_by
  ) values (
    p_business_id, 'order_financial_reopen', p_client_request_id, v_fingerprint,
    coalesce(p_note, 'Order financials reopened'), v_uid
  ) returning id into v_operation_id;

  update public.order_financials
  set financial_status = 'open',
      settled_at = null,
      settled_by = null
  where order_id = p_order_id
    and business_id = p_business_id;

  insert into public.finance_audit_events (
    business_id, actor_id, event_type, entity_type, entity_id, payload
  ) values (
    p_business_id, v_uid, 'order_financials_reopened',
    'order_financials', p_order_id,
    jsonb_build_object('operation_id', v_operation_id)
  );

  return jsonb_build_object(
    'operation_id', v_operation_id,
    'order_id', p_order_id,
    'financial_status', 'open',
    'paid_net', v_paid,
    'released', v_released,
    'committed', v_protected,
    'remaining', private.order_remaining(p_business_id, p_order_id),
    'protection_variance', 0,
    'idempotent', false
  );
end;
$$;

create or replace function public.settle_order_financials(
  p_business_id uuid,
  p_order_id uuid,
  p_client_request_id uuid,
  p_request_hash text,
  p_note text default null
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
  v_committed public.finance_funds%rowtype;
  v_destination public.finance_funds%rowtype;
  v_lock_ids uuid[];
  v_locked_count integer;
  v_paid numeric(14, 2);
  v_released numeric(14, 2);
  v_protected numeric(14, 2);
  v_committed_balance numeric(14, 2);
  v_operation_type public.finance_operation_type;
  v_operation_id uuid;
  v_transaction_id uuid;
  v_settled_at timestamptz;
  v_settled_by uuid;
begin
  v_uid := private.require_finance_permission(p_business_id, 'operate');

  if p_order_id is null
     or p_client_request_id is null
     or coalesce(trim(p_request_hash), '') = '' then
    raise exception 'order_id, client_request_id and request_hash are required'
      using errcode = '22023';
  end if;

  v_fingerprint := private.finance_request_fingerprint(
    p_request_hash,
    jsonb_build_object(
      'kind', 'order_financial_settlement',
      'order_id', p_order_id,
      'note', p_note
    )
  );

  perform private.lock_finance_request(p_business_id, p_client_request_id);
  v_existing := private.get_idempotent_finance_operation(
    p_business_id, p_client_request_id, v_fingerprint
  );
  if v_existing.id is not null then
    if v_existing.operation_type not in ('release_deposit', 'order_financial_settlement') then
      raise exception 'settlement idempotency state is inconsistent' using errcode = 'P0001';
    end if;

    select a.created_at, a.actor_id
    into v_settled_at, v_settled_by
    from public.finance_audit_events a
    where a.business_id = p_business_id
      and a.event_type = 'order_financials_settled'
      and a.entity_type = 'order_financials'
      and a.entity_id = p_order_id
      and a.payload->>'operation_id' = v_existing.id::text;

    if not found then
      raise exception 'settlement idempotency state is inconsistent' using errcode = 'P0001';
    end if;

    select t.id into v_transaction_id
    from public.finance_transactions t
    where t.business_id = p_business_id
      and t.operation_id = v_existing.id
      and t.order_id = p_order_id
      and t.status = 'posted';

    return jsonb_build_object(
      'operation_id', v_existing.id,
      'transaction_id', v_transaction_id,
      'order_id', p_order_id,
      'financial_status', 'settled',
      'settled_at', v_settled_at,
      'settled_by', v_settled_by,
      'paid_net', private.order_paid_net(p_business_id, p_order_id),
      'released', private.order_released_amount(p_business_id, p_order_id),
      'committed', private.order_committed_amount(p_business_id, p_order_id),
      'remaining', private.order_remaining(p_business_id, p_order_id),
      'protection_variance', private.order_protection_variance(p_business_id, p_order_id),
      'idempotent', true
    );
  end if;

  -- The order-financial row serializes payments, reopens, and settlements.
  v_financials := private.lock_order_financials(p_business_id, p_order_id);
  if v_financials.agreed_total is null or v_financials.agreed_total <= 0 then
    raise exception 'agreed_total_required' using errcode = 'P0001';
  end if;

  v_paid := private.order_paid_net(p_business_id, p_order_id);
  v_released := private.order_released_amount(p_business_id, p_order_id);
  v_protected := private.order_committed_amount(p_business_id, p_order_id);

  if v_paid <> v_financials.agreed_total
     or private.order_remaining(p_business_id, p_order_id) <> 0 then
    raise exception 'settlement_requires_full_payment' using errcode = 'P0001';
  end if;
  if v_paid <> v_released + v_protected
     or private.order_protection_variance(p_business_id, p_order_id) <> 0 then
    raise exception 'settlement_protection_invariant_failed' using errcode = 'P0001';
  end if;

  if v_protected > 0 then
    select * into v_settings
    from public.business_finance_settings
    where business_id = p_business_id
    for update;

    if not found
       or v_settings.protection_account_id is null
       or v_settings.default_operating_fund_id is null then
      raise exception 'settlement_default_operating_fund_missing'
        using errcode = 'P0001';
    end if;

    select * into v_committed
    from public.finance_funds
    where business_id = p_business_id
      and order_id = p_order_id
      and fund_type = 'committed'
      and active;

    if not found then
      raise exception 'settlement_committed_fund_missing' using errcode = 'P0001';
    end if;

    select * into v_destination
    from public.finance_funds
    where id = v_settings.default_operating_fund_id
      and business_id = p_business_id;

    if not found then
      raise exception 'settlement_default_operating_fund_invalid'
        using errcode = 'P0001';
    end if;

    v_lock_ids := array[v_committed.id, v_destination.id];
    select array_agg(distinct x order by x)
    into v_lock_ids
    from unnest(v_lock_ids) x;

    select count(*) into v_locked_count
    from private.lock_finance_funds(p_business_id, v_lock_ids);
    if v_locked_count <> cardinality(v_lock_ids) then
      raise exception 'settlement fund lock mismatch' using errcode = 'P0001';
    end if;

    select * into strict v_committed
    from public.finance_funds
    where id = v_committed.id
      and business_id = p_business_id;
    select * into strict v_destination
    from public.finance_funds
    where id = v_destination.id
      and business_id = p_business_id;

    if not v_committed.active
       or v_committed.fund_type <> 'committed'
       or v_committed.order_id <> p_order_id
       or v_committed.account_id <> v_settings.protection_account_id then
      raise exception 'settlement committed fund invariant failed'
        using errcode = 'P0001';
    end if;

    if not v_destination.active
       or v_destination.id <> v_settings.default_operating_fund_id
       or v_destination.fund_type <> 'business_operating'
       or v_destination.order_id is not null
       or v_destination.account_id <> v_settings.protection_account_id then
      raise exception 'settlement destination fund invariant failed'
        using errcode = 'P0001';
    end if;

    v_committed_balance := private.finance_fund_balance(p_business_id, v_committed.id);
    v_protected := private.order_committed_amount(p_business_id, p_order_id);
    v_released := private.order_released_amount(p_business_id, p_order_id);

    if v_committed_balance <> v_protected
       or v_paid <> v_released + v_protected
       or private.order_protection_variance(p_business_id, p_order_id) <> 0 then
      raise exception 'settlement_protection_invariant_failed' using errcode = 'P0001';
    end if;
  end if;

  v_settled_at := clock_timestamp();
  v_operation_type := case
    when v_protected > 0 then 'release_deposit'::public.finance_operation_type
    else 'order_financial_settlement'::public.finance_operation_type
  end;

  insert into public.finance_operations (
    business_id, operation_type, client_request_id, request_hash, note, created_by
  ) values (
    p_business_id, v_operation_type, p_client_request_id, v_fingerprint,
    coalesce(p_note, 'Order financial settlement'), v_uid
  ) returning id into v_operation_id;

  if v_protected > 0 then
    insert into public.finance_transactions (
      business_id, operation_id, status, order_id, occurred_at, note, created_by
    ) values (
      p_business_id, v_operation_id, 'posted', p_order_id, v_settled_at,
      coalesce(p_note, 'Committed release on financial settlement'), v_uid
    ) returning id into v_transaction_id;

    insert into public.finance_transaction_entries (
      business_id, transaction_id, fund_id, direction, amount
    ) values
      (p_business_id, v_transaction_id, v_committed.id, 'out', v_protected),
      (p_business_id, v_transaction_id, v_destination.id, 'in', v_protected);

    if private.finance_fund_balance(p_business_id, v_committed.id) <> 0 then
      raise exception 'settlement committed release did not reach zero'
        using errcode = 'P0001';
    end if;

    update public.finance_funds
    set active = false
    where id = v_committed.id
      and business_id = p_business_id;
  end if;

  update public.order_financials
  set financial_status = 'settled',
      settled_at = v_settled_at,
      settled_by = v_uid
  where order_id = p_order_id
    and business_id = p_business_id;

  insert into public.finance_audit_events (
    business_id, actor_id, event_type, entity_type, entity_id, payload, created_at
  ) values (
    p_business_id, v_uid, 'order_financials_settled',
    'order_financials', p_order_id,
    jsonb_build_object(
      'operation_id', v_operation_id,
      'transaction_id', v_transaction_id,
      'released_now', v_protected
    ),
    v_settled_at
  );

  return jsonb_build_object(
    'operation_id', v_operation_id,
    'transaction_id', v_transaction_id,
    'order_id', p_order_id,
    'financial_status', 'settled',
    'settled_at', v_settled_at,
    'settled_by', v_uid,
    'paid_net', v_paid,
    'released', v_released + v_protected,
    'committed', 0,
    'remaining', 0,
    'protection_variance', 0,
    'idempotent', false
  );
end;
$$;

create or replace function public.order_released_amount(p_order_id uuid)
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
  return private.order_released_amount(v_business_id, p_order_id);
end;
$$;

create or replace function public.order_protection_variance(p_order_id uuid)
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
  return private.order_protection_variance(v_business_id, p_order_id);
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
    'settled_at', v_financials.settled_at,
    'settled_by', v_financials.settled_by,
    'paid_net', private.order_paid_net(v_financials.business_id, p_order_id),
    'released', private.order_released_amount(v_financials.business_id, p_order_id),
    'committed', private.order_committed_amount(v_financials.business_id, p_order_id),
    'remaining', private.order_remaining(v_financials.business_id, p_order_id),
    'protection_variance', private.order_protection_variance(
      v_financials.business_id, p_order_id
    )
  );
end;
$$;

revoke all on function public.reopen_order_financials(
  uuid, uuid, uuid, text, text
) from public, anon, authenticated;
revoke all on function public.settle_order_financials(
  uuid, uuid, uuid, text, text
) from public, anon, authenticated;
revoke all on function public.order_released_amount(uuid)
  from public, anon, authenticated;
revoke all on function public.order_protection_variance(uuid)
  from public, anon, authenticated;
revoke all on function public.order_financial_summary(uuid)
  from public, anon, authenticated;

grant execute on function public.reopen_order_financials(
  uuid, uuid, uuid, text, text
) to authenticated;
grant execute on function public.settle_order_financials(
  uuid, uuid, uuid, text, text
) to authenticated;
grant execute on function public.order_released_amount(uuid) to authenticated;
grant execute on function public.order_protection_variance(uuid) to authenticated;
grant execute on function public.order_financial_summary(uuid) to authenticated;
