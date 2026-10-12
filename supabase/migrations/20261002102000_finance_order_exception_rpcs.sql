-- M1.B-M1.D: refunds, financial cancellation/retention, and payment reversal.

create or replace function public.create_order_refund(
  p_business_id uuid,
  p_order_id uuid,
  p_client_request_id uuid,
  p_request_hash text,
  p_payout_splits jsonb,
  p_protected_amount numeric,
  p_released_amount numeric,
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
  v_result jsonb;
begin
  v_uid := private.require_finance_permission(p_business_id, 'manage_order_exceptions');
  if p_order_id is null or p_client_request_id is null
     or coalesce(trim(p_request_hash), '') = '' then
    raise exception 'order_id, client_request_id and request_hash are required'
      using errcode = '22023';
  end if;
  v_fingerprint := private.finance_request_fingerprint(
    p_request_hash,
    jsonb_build_object(
      'kind', 'order_refund', 'order_id', p_order_id,
      'payout_splits', p_payout_splits,
      'protected_amount', p_protected_amount,
      'released_amount', p_released_amount,
      'note', p_note, 'occurred_at', p_occurred_at
    )
  );
  perform private.lock_finance_request(p_business_id, p_client_request_id);
  v_existing := private.get_idempotent_finance_operation(
    p_business_id, p_client_request_id, v_fingerprint
  );
  if v_existing.id is not null then
    if v_existing.operation_type <> 'order_refund' then
      raise exception 'refund idempotency state is inconsistent' using errcode = 'P0001';
    end if;
    return jsonb_build_object(
      'operation_id', v_existing.id,
      'order_id', p_order_id,
      'refunded_amount', private.order_refunded_amount(p_business_id, p_order_id),
      'refundable_amount', private.order_refundable_amount(p_business_id, p_order_id),
      'idempotent', true
    );
  end if;
  select * into v_financials from public.order_financials
  where business_id = p_business_id and order_id = p_order_id
  for update;
  if not found then
    raise exception 'order_financials not initialized' using errcode = '22023';
  end if;
  v_result := private.create_order_outflow(
    p_business_id, p_order_id, 'order_refund', p_client_request_id,
    v_fingerprint, null, p_payout_splits, p_protected_amount,
    p_released_amount, p_note, p_occurred_at, v_uid
  );
  if private.order_protection_variance(p_business_id, p_order_id) <> 0 then
    raise exception 'refund protection invariant failed' using errcode = 'P0001';
  end if;
  return v_result || jsonb_build_object(
    'order_id', p_order_id,
    'financial_status', v_financials.financial_status,
    'refunded_amount', private.order_refunded_amount(p_business_id, p_order_id),
    'refundable_amount', private.order_refundable_amount(p_business_id, p_order_id),
    'idempotent', false
  );
end;
$$;

create or replace function public.reverse_order_payment(
  p_business_id uuid,
  p_order_id uuid,
  p_target_operation_id uuid,
  p_client_request_id uuid,
  p_request_hash text,
  p_out_splits jsonb,
  p_protected_amount numeric,
  p_released_amount numeric,
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
  v_target public.finance_operations%rowtype;
  v_financials public.order_financials%rowtype;
  v_amount numeric(14, 2);
  v_result jsonb;
begin
  v_uid := private.require_finance_permission(p_business_id, 'manage_order_exceptions');
  if p_order_id is null or p_target_operation_id is null
     or p_client_request_id is null or coalesce(trim(p_request_hash), '') = '' then
    raise exception 'order, target operation, client request and hash are required'
      using errcode = '22023';
  end if;
  v_fingerprint := private.finance_request_fingerprint(
    p_request_hash,
    jsonb_build_object(
      'kind', 'order_payment_reversal', 'order_id', p_order_id,
      'target_operation_id', p_target_operation_id,
      'out_splits', p_out_splits,
      'protected_amount', p_protected_amount,
      'released_amount', p_released_amount,
      'note', p_note, 'occurred_at', p_occurred_at
    )
  );
  perform private.lock_finance_request(p_business_id, p_client_request_id);
  v_existing := private.get_idempotent_finance_operation(
    p_business_id, p_client_request_id, v_fingerprint
  );
  if v_existing.id is not null then
    if v_existing.operation_type <> 'order_payment_reversal'
       or v_existing.target_operation_id <> p_target_operation_id then
      raise exception 'payment reversal idempotency state is inconsistent'
        using errcode = 'P0001';
    end if;
    return jsonb_build_object(
      'operation_id', v_existing.id, 'order_id', p_order_id,
      'paid_net', private.order_paid_net(p_business_id, p_order_id),
      'idempotent', true
    );
  end if;
  v_financials := private.lock_order_financials(p_business_id, p_order_id);
  if private.order_refunded_amount(p_business_id, p_order_id) <> 0 then
    raise exception 'payment reversal requires order without refunds'
      using errcode = 'P0001';
  end if;
  v_target := private.lock_finance_operation(p_business_id, p_target_operation_id);
  if v_target.id is null
     or v_target.operation_type not in ('deposit', 'order_payment', 'historical_deposit')
     or not exists (
       select 1 from public.finance_transactions t
       where t.business_id = p_business_id
         and t.operation_id = p_target_operation_id
         and t.order_id = p_order_id
         and t.status = 'posted'
     ) then
    raise exception 'invalid order payment reversal target' using errcode = '22023';
  end if;
  if exists (
    select 1 from public.finance_operations o
    where o.business_id = p_business_id
      and o.operation_type = 'order_payment_reversal'
      and o.target_operation_id = p_target_operation_id
  ) then
    raise exception 'order payment already reversed' using errcode = 'P0001';
  end if;
  v_amount := private.order_collection_operation_amount(
    p_business_id, p_order_id, p_target_operation_id
  );
  if v_amount <= 0 or coalesce(p_protected_amount, 0) + coalesce(p_released_amount, 0) <> v_amount then
    raise exception 'payment reversal must reverse the full recognized collection'
      using errcode = '22023';
  end if;
  v_result := private.create_order_outflow(
    p_business_id, p_order_id, 'order_payment_reversal', p_client_request_id,
    v_fingerprint, p_target_operation_id, p_out_splits,
    p_protected_amount, p_released_amount, p_note, p_occurred_at, v_uid
  );
  if private.order_protection_variance(p_business_id, p_order_id) <> 0 then
    raise exception 'payment reversal protection invariant failed' using errcode = 'P0001';
  end if;
  return v_result || jsonb_build_object(
    'order_id', p_order_id, 'target_operation_id', p_target_operation_id,
    'paid_net', private.order_paid_net(p_business_id, p_order_id),
    'remaining', private.order_remaining(p_business_id, p_order_id),
    'idempotent', false
  );
end;
$$;

create or replace function public.cancel_order_financials(
  p_business_id uuid,
  p_order_id uuid,
  p_client_request_id uuid,
  p_request_hash text,
  p_refund_splits jsonb default null,
  p_refund_protected_amount numeric default 0,
  p_refund_released_amount numeric default 0,
  p_retain_amount numeric default 0,
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
  v_protected numeric(14, 2);
  v_refund_total numeric(14, 2);
  v_refund_operation jsonb;
  v_committed public.finance_funds%rowtype;
  v_destination public.finance_funds%rowtype;
  v_lock_ids uuid[];
  v_locked_count integer;
  v_retention_operation_id uuid;
  v_retention_transaction_id uuid;
  v_cancel_operation_id uuid;
  v_cancelled_at timestamptz;
  v_child_request_id uuid;
begin
  v_uid := private.require_finance_permission(p_business_id, 'manage_order_exceptions');
  if p_order_id is null or p_client_request_id is null
     or coalesce(trim(p_request_hash), '') = '' then
    raise exception 'order_id, client_request_id and request_hash are required'
      using errcode = '22023';
  end if;
  v_fingerprint := private.finance_request_fingerprint(
    p_request_hash,
    jsonb_build_object(
      'kind', 'order_financial_cancel', 'order_id', p_order_id,
      'refund_splits', p_refund_splits,
      'refund_protected_amount', p_refund_protected_amount,
      'refund_released_amount', p_refund_released_amount,
      'retain_amount', p_retain_amount,
      'note', p_note, 'occurred_at', p_occurred_at
    )
  );
  perform private.lock_finance_request(p_business_id, p_client_request_id);
  v_existing := private.get_idempotent_finance_operation(
    p_business_id, p_client_request_id, v_fingerprint
  );
  if v_existing.id is not null then
    if v_existing.operation_type <> 'order_financial_cancel' then
      raise exception 'financial cancel idempotency state is inconsistent'
        using errcode = 'P0001';
    end if;
    return jsonb_build_object(
      'operation_id', v_existing.id, 'order_id', p_order_id,
      'financial_status', 'cancelled',
      'refunded_amount', private.order_refunded_amount(p_business_id, p_order_id),
      'retained_amount', private.order_retained_amount(p_business_id, p_order_id),
      'idempotent', true
    );
  end if;
  select * into v_financials from public.order_financials
  where business_id = p_business_id and order_id = p_order_id
  for update;
  if not found then
    raise exception 'order_financials not initialized' using errcode = '22023';
  end if;
  if v_financials.financial_status = 'cancelled' then
    raise exception 'order finance already cancelled' using errcode = 'P0001';
  end if;
  if coalesce(p_refund_protected_amount, 0) < 0
     or coalesce(p_refund_released_amount, 0) < 0
     or coalesce(p_retain_amount, 0) < 0 then
    raise exception 'cancel disposition cannot be negative' using errcode = '22023';
  end if;
  v_protected := private.order_committed_amount(p_business_id, p_order_id);
  if coalesce(p_refund_protected_amount, 0) + coalesce(p_retain_amount, 0) <> v_protected then
    raise exception 'cancel must fully resolve committed amount' using errcode = 'P0001';
  end if;
  v_refund_total := coalesce(p_refund_protected_amount, 0)
    + coalesce(p_refund_released_amount, 0);
  if v_refund_total > 0 then
    if p_refund_splits is null then
      raise exception 'refund payout splits required' using errcode = '22023';
    end if;
    v_child_request_id := md5(
      p_business_id::text || ':' || p_client_request_id::text || ':refund'
    )::uuid;
    v_refund_operation := private.create_order_outflow(
      p_business_id, p_order_id, 'order_refund', v_child_request_id,
      v_fingerprint || ':refund', null, p_refund_splits,
      p_refund_protected_amount, p_refund_released_amount,
      p_note, p_occurred_at, v_uid
    );
  elsif p_refund_splits is not null then
    raise exception 'refund splits supplied without refund amount' using errcode = '22023';
  end if;
  if coalesce(p_retain_amount, 0) > 0 then
    select * into v_committed from public.finance_funds
    where business_id = p_business_id and order_id = p_order_id
      and fund_type = 'committed'
      and private.finance_fund_balance(business_id, id) > 0
    order by active desc, created_at desc limit 1;
    if not found then
      raise exception 'committed fund missing for retention' using errcode = 'P0001';
    end if;
    v_destination := private.resolve_order_coverage_fund(p_business_id, null);
    select array_agg(distinct x order by x) into v_lock_ids
    from unnest(array[v_committed.id, v_destination.id]) x;
    select count(*) into v_locked_count
    from private.lock_finance_funds(p_business_id, v_lock_ids);
    if v_locked_count <> cardinality(v_lock_ids)
       or private.finance_fund_balance(p_business_id, v_committed.id) < p_retain_amount then
      raise exception 'retention fund invariant failed' using errcode = 'P0001';
    end if;
    insert into public.finance_operations (
      business_id, operation_type, client_request_id, request_hash, note, created_by
    ) values (
      p_business_id, 'order_retention',
      md5(p_business_id::text || ':' || p_client_request_id::text || ':retention')::uuid,
      v_fingerprint || ':retention', p_note, v_uid
    ) returning id into v_retention_operation_id;
    insert into public.finance_transactions (
      business_id, operation_id, status, order_id, occurred_at, note, created_by
    ) values (
      p_business_id, v_retention_operation_id, 'posted', p_order_id,
      coalesce(p_occurred_at, now()), p_note, v_uid
    ) returning id into v_retention_transaction_id;
    insert into public.finance_transaction_entries (
      business_id, transaction_id, fund_id, direction, amount
    ) values
      (p_business_id, v_retention_transaction_id, v_committed.id, 'out', p_retain_amount),
      (p_business_id, v_retention_transaction_id, v_destination.id, 'in', p_retain_amount);
    insert into public.finance_audit_events (
      business_id, actor_id, event_type, entity_type, entity_id, payload
    ) values (
      p_business_id, v_uid, 'order_deposit_retained', 'order_financials', p_order_id,
      jsonb_build_object(
        'operation_id', v_retention_operation_id,
        'amount', p_retain_amount
      )
    );
  end if;
  if private.order_committed_amount(p_business_id, p_order_id) <> 0
     or private.order_protection_variance(p_business_id, p_order_id) <> 0 then
    raise exception 'cancel disposition invariant failed' using errcode = 'P0001';
  end if;
  update public.finance_funds set active = false
  where business_id = p_business_id and order_id = p_order_id
    and fund_type = 'committed' and active
    and private.finance_fund_balance(business_id, id) = 0;
  v_cancelled_at := clock_timestamp();
  insert into public.finance_operations (
    business_id, operation_type, client_request_id, request_hash, note, created_by
  ) values (
    p_business_id, 'order_financial_cancel', p_client_request_id,
    v_fingerprint, p_note, v_uid
  ) returning id into v_cancel_operation_id;
  update public.order_financials
  set financial_status = 'cancelled', settled_at = null, settled_by = null,
      cancelled_at = v_cancelled_at, cancelled_by = v_uid
  where business_id = p_business_id and order_id = p_order_id;
  insert into public.finance_audit_events (
    business_id, actor_id, event_type, entity_type, entity_id, payload, created_at
  ) values (
    p_business_id, v_uid, 'order_financials_cancelled',
    'order_financials', p_order_id,
    jsonb_build_object(
      'operation_id', v_cancel_operation_id,
      'refund_operation_id', v_refund_operation->>'operation_id',
      'retention_operation_id', v_retention_operation_id,
      'refund_amount', v_refund_total,
      'retained_amount', coalesce(p_retain_amount, 0)
    ), v_cancelled_at
  );
  return jsonb_build_object(
    'operation_id', v_cancel_operation_id, 'order_id', p_order_id,
    'financial_status', 'cancelled', 'cancelled_at', v_cancelled_at,
    'cancelled_by', v_uid,
    'refunded_amount', private.order_refunded_amount(p_business_id, p_order_id),
    'retained_amount', private.order_retained_amount(p_business_id, p_order_id),
    'paid_net', private.order_paid_net(p_business_id, p_order_id),
    'committed', 0, 'protection_variance', 0, 'idempotent', false
  );
end;
$$;
