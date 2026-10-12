-- Phase 3A: metadata-only edits and whole-operation void for the general ledger.

create or replace function public.edit_finance_transaction_metadata(
  p_business_id uuid,
  p_client_request_id uuid,
  p_request_hash text,
  p_target_operation_id uuid,
  p_note text,
  p_category_id uuid,
  p_area public.finance_category_area,
  p_occurred_at timestamptz
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
  v_tx public.finance_transactions%rowtype;
  v_edit_id uuid;
  v_accounts uuid[];
  v_before jsonb;
  v_after jsonb;
  v_tx_count integer;
begin
  v_uid := private.require_finance_permission(p_business_id, 'manage_finance_corrections');

  if p_client_request_id is null or coalesce(trim(p_request_hash), '') = '' then
    raise exception 'client_request_id and request_hash are required' using errcode = '22023';
  end if;
  if p_target_operation_id is null or p_occurred_at is null then
    raise exception 'target operation and occurred_at are required' using errcode = '22023';
  end if;

  v_fingerprint := private.finance_request_fingerprint(
    p_request_hash,
    jsonb_build_object(
      'action', 'metadata_edit',
      'target_operation_id', p_target_operation_id,
      'note', p_note,
      'category_id', p_category_id,
      'area', p_area,
      'occurred_at', p_occurred_at
    )
  );

  perform private.lock_finance_request(p_business_id, p_client_request_id);
  v_existing := private.get_idempotent_finance_operation(
    p_business_id, p_client_request_id, v_fingerprint
  );
  if v_existing.id is not null then
    if v_existing.operation_type <> 'metadata_edit'
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
    raise exception 'only root general-ledger operations support metadata edits'
      using errcode = 'P0001';
  end if;

  select count(*) into v_tx_count
  from public.finance_transactions
  where business_id = p_business_id
    and operation_id = p_target_operation_id;
  if v_tx_count <> 1 then
    raise exception 'general-ledger target must have exactly one transaction'
      using errcode = 'P0001';
  end if;

  select * into v_tx
  from public.finance_transactions
  where business_id = p_business_id
    and operation_id = p_target_operation_id
  for update;

  if v_tx.status <> 'posted' then
    raise exception 'target operation is not posted' using errcode = 'P0001';
  end if;
  if v_tx.order_id is not null or exists (
    select 1
    from public.finance_transaction_entries e
    join public.finance_funds f
      on f.id = e.fund_id and f.business_id = e.business_id
    where e.business_id = p_business_id
      and e.transaction_id = v_tx.id
      and (f.fund_type = 'committed' or f.order_id is not null)
  ) then
    raise exception 'order-linked finance cannot use general correction APIs'
      using errcode = 'P0001';
  end if;
  if private.operation_has_reconciliation_link(p_business_id, p_target_operation_id) then
    raise exception 'operation has a reconciliation link' using errcode = 'P0001';
  end if;

  v_accounts := private.finance_operation_account_ids(p_business_id, p_target_operation_id);
  if private.finance_date_in_closed_period(p_business_id, v_accounts, v_tx.occurred_at)
     or private.finance_date_in_closed_period(p_business_id, v_accounts, p_occurred_at) then
    raise exception 'metadata edit falls in a closed reconciliation period'
      using errcode = 'P0001';
  end if;

  if v_target.operation_type = 'transfer' then
    if p_category_id is not null or p_area is not null then
      raise exception 'transfer metadata does not accept category or area'
        using errcode = '22023';
    end if;
  else
    if p_area is null then
      raise exception 'income and expense metadata require area' using errcode = '22023';
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
      raise exception 'invalid category for target operation' using errcode = '22023';
    end if;
  end if;

  v_before := jsonb_build_object(
    'note', v_tx.note,
    'category_id', v_tx.category_id,
    'area', v_tx.area,
    'occurred_at', v_tx.occurred_at
  );
  v_after := jsonb_build_object(
    'note', p_note,
    'category_id', p_category_id,
    'area', p_area,
    'occurred_at', p_occurred_at
  );

  if v_before = v_after then
    raise exception 'NO_METADATA_CHANGE' using errcode = 'P0001';
  end if;

  insert into public.finance_operations (
    business_id, operation_type, client_request_id, request_hash,
    note, created_by, target_operation_id
  ) values (
    p_business_id, 'metadata_edit', p_client_request_id, v_fingerprint,
    p_note, v_uid, p_target_operation_id
  ) returning id into v_edit_id;

  update public.finance_operations
  set note = p_note
  where id = p_target_operation_id and business_id = p_business_id;

  update public.finance_transactions
  set note = p_note,
      category_id = p_category_id,
      area = p_area,
      occurred_at = p_occurred_at,
      updated_at = now()
  where id = v_tx.id and business_id = p_business_id;

  insert into public.finance_audit_events (
    business_id, actor_id, event_type, entity_type, entity_id, payload
  ) values (
    p_business_id, v_uid, 'finance_metadata_edited', 'operation', p_target_operation_id,
    jsonb_build_object(
      'metadata_edit_operation_id', v_edit_id,
      'transaction_id', v_tx.id,
      'before', v_before,
      'after', v_after
    )
  );

  return jsonb_build_object(
    'operation_id', v_edit_id,
    'target_operation_id', p_target_operation_id,
    'transaction_id', v_tx.id,
    'idempotent', false
  );
end;
$$;

create or replace function public.void_finance_operation(
  p_business_id uuid,
  p_client_request_id uuid,
  p_request_hash text,
  p_target_operation_id uuid,
  p_reason text
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
  v_void_id uuid;
  v_fund_ids uuid[];
  v_locked_count integer;
  v_tx_count integer;
  v_posted_count integer;
  v_fund_id uuid;
  v_effect numeric(14, 2);
  v_resulting numeric(14, 2);
  v_tx record;
begin
  v_uid := private.require_finance_permission(p_business_id, 'manage_finance_corrections');

  if p_client_request_id is null or coalesce(trim(p_request_hash), '') = ''
     or p_target_operation_id is null or coalesce(trim(p_reason), '') = '' then
    raise exception 'request id, request hash, target and reason are required'
      using errcode = '22023';
  end if;

  v_fingerprint := private.finance_request_fingerprint(
    p_request_hash,
    jsonb_build_object(
      'action', 'void',
      'target_operation_id', p_target_operation_id,
      'reason', p_reason
    )
  );

  perform private.lock_finance_request(p_business_id, p_client_request_id);
  v_existing := private.get_idempotent_finance_operation(
    p_business_id, p_client_request_id, v_fingerprint
  );
  if v_existing.id is not null then
    if v_existing.operation_type <> 'void'
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
    raise exception 'only root general-ledger operations can be voided'
      using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.finance_operations o
    where o.business_id = p_business_id
      and o.target_operation_id = p_target_operation_id
      and o.operation_type = 'void'
  ) then
    raise exception 'ALREADY_VOIDED' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.finance_operations o
    where o.business_id = p_business_id
      and o.target_operation_id = p_target_operation_id
      and o.operation_type = 'correction'
  ) then
    raise exception 'operation with economic corrections cannot be voided'
      using errcode = 'P0001';
  end if;

  perform 1
  from public.finance_transactions t
  where t.business_id = p_business_id
    and t.operation_id = p_target_operation_id
  order by t.id
  for update of t;

  select count(*), count(*) filter (where status = 'posted')
  into v_tx_count, v_posted_count
  from public.finance_transactions
  where business_id = p_business_id
    and operation_id = p_target_operation_id;
  if v_tx_count = 0 or v_posted_count <> v_tx_count then
    raise exception 'target operation is not fully posted' using errcode = 'P0001';
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
      and (t.order_id is not null or f.fund_type = 'committed' or f.order_id is not null)
  ) then
    raise exception 'order-linked finance cannot use general correction APIs'
      using errcode = 'P0001';
  end if;
  if private.operation_has_reconciliation_link(p_business_id, p_target_operation_id) then
    raise exception 'operation has a reconciliation link' using errcode = 'P0001';
  end if;

  for v_tx in
    select t.occurred_at
    from public.finance_transactions t
    where t.business_id = p_business_id
      and t.operation_id = p_target_operation_id
  loop
    if private.finance_date_in_closed_period(
      p_business_id,
      private.finance_operation_account_ids(p_business_id, p_target_operation_id),
      v_tx.occurred_at
    ) then
      raise exception 'target operation belongs to a closed reconciliation period'
        using errcode = 'P0001';
    end if;
  end loop;

  select array_agg(distinct e.fund_id order by e.fund_id)
  into v_fund_ids
  from public.finance_transactions t
  join public.finance_transaction_entries e
    on e.transaction_id = t.id and e.business_id = t.business_id
  where t.business_id = p_business_id
    and t.operation_id = p_target_operation_id;

  select count(*) into v_locked_count
  from private.lock_finance_funds(p_business_id, v_fund_ids);
  if v_locked_count <> cardinality(v_fund_ids) then
    raise exception 'invalid target fund set' using errcode = 'P0001';
  end if;

  for v_fund_id, v_effect in
    select e.fund_id,
           sum(case when e.direction = 'in' then e.amount else -e.amount end)::numeric(14, 2)
    from public.finance_transactions t
    join public.finance_transaction_entries e
      on e.transaction_id = t.id and e.business_id = t.business_id
    where t.business_id = p_business_id
      and t.operation_id = p_target_operation_id
      and t.status = 'posted'
    group by e.fund_id
  loop
    v_resulting := private.finance_fund_balance(p_business_id, v_fund_id) - v_effect;
    if v_resulting < 0 then
      raise exception 'VOID_NEGATIVE_BALANCE: fund %, resulting balance %',
        v_fund_id, v_resulting using errcode = 'P0001';
    end if;
  end loop;

  insert into public.finance_operations (
    business_id, operation_type, client_request_id, request_hash,
    note, created_by, target_operation_id
  ) values (
    p_business_id, 'void', p_client_request_id, v_fingerprint,
    p_reason, v_uid, p_target_operation_id
  ) returning id into v_void_id;

  update public.finance_transactions
  set status = 'voided', updated_at = now()
  where business_id = p_business_id
    and operation_id = p_target_operation_id
    and status = 'posted';

  insert into public.finance_audit_events (
    business_id, actor_id, event_type, entity_type, entity_id, payload
  ) values (
    p_business_id, v_uid, 'finance_operation_voided', 'operation', p_target_operation_id,
    jsonb_build_object(
      'void_operation_id', v_void_id,
      'reason', p_reason,
      'transaction_count', v_tx_count
    )
  );

  return jsonb_build_object(
    'operation_id', v_void_id,
    'target_operation_id', p_target_operation_id,
    'voided_transaction_count', v_tx_count,
    'idempotent', false
  );
end;
$$;
