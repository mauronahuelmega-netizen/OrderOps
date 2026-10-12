-- Phase 3B: account-level reconciliation workflow. Reconciliation never writes ledger.

create or replace function public.create_finance_reconciliation(
  p_business_id uuid,
  p_account_id uuid,
  p_cutoff_at timestamptz,
  p_statement_balance numeric,
  p_note text,
  p_client_request_id uuid,
  p_request_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid;
  v_fingerprint text;
  v_existing public.finance_reconciliation_commands%rowtype;
  v_reconciliation_id uuid;
  v_previous_cutoff timestamptz;
  v_locked_count integer;
begin
  v_uid := private.require_finance_permission(p_business_id, 'manage_finance_reconciliation');
  if p_account_id is null or p_cutoff_at is null or p_statement_balance is null
     or p_client_request_id is null or coalesce(trim(p_request_hash), '') = '' then
    raise exception 'account, cutoff, statement balance, request id and request hash are required'
      using errcode = '22023';
  end if;

  v_fingerprint := private.finance_request_fingerprint(
    p_request_hash,
    jsonb_build_object(
      'action', 'create_reconciliation',
      'account_id', p_account_id,
      'cutoff_at', p_cutoff_at,
      'statement_balance', p_statement_balance,
      'note', p_note
    )
  );
  perform private.lock_finance_reconciliation_request(p_business_id, p_client_request_id);
  v_existing := private.get_finance_reconciliation_command(
    p_business_id, p_client_request_id, v_fingerprint
  );
  if v_existing.id is not null then
    if v_existing.command_type <> 'create' or v_existing.reconciliation_id is null then
      raise exception 'IDEMPOTENCY_CONFLICT' using errcode = '23505';
    end if;
    return jsonb_build_object(
      'reconciliation_id', v_existing.reconciliation_id,
      'idempotent', true
    );
  end if;

  select count(*) into v_locked_count
  from private.lock_finance_accounts(p_business_id, array[p_account_id]);
  if v_locked_count <> 1 then
    raise exception 'invalid finance account' using errcode = '22023';
  end if;
  if exists (
    select 1 from public.finance_reconciliations r
    where r.business_id = p_business_id
      and r.account_id = p_account_id
      and r.status = 'open'
  ) then
    raise exception 'OPEN_RECONCILIATION_ALREADY_EXISTS' using errcode = 'P0001';
  end if;

  v_previous_cutoff := private.latest_closed_finance_cutoff(p_business_id, p_account_id);
  if v_previous_cutoff is not null and p_cutoff_at <= v_previous_cutoff then
    raise exception 'RECONCILIATION_CUTOFF_NOT_AFTER_PREVIOUS' using errcode = 'P0001';
  end if;

  insert into public.finance_reconciliations (
    business_id, account_id, cutoff_at, statement_balance, note, opened_by
  ) values (
    p_business_id, p_account_id, p_cutoff_at, p_statement_balance, p_note, v_uid
  ) returning id into v_reconciliation_id;

  insert into public.finance_reconciliation_commands (
    business_id, reconciliation_id, command_type,
    client_request_id, request_hash, created_by
  ) values (
    p_business_id, v_reconciliation_id, 'create',
    p_client_request_id, v_fingerprint, v_uid
  );

  insert into public.finance_audit_events (
    business_id, actor_id, event_type, entity_type, entity_id, payload
  ) values (
    p_business_id, v_uid, 'finance_reconciliation_created',
    'finance_reconciliation', v_reconciliation_id,
    jsonb_build_object(
      'account_id', p_account_id,
      'cutoff_at', p_cutoff_at,
      'statement_balance', p_statement_balance
    )
  );

  return jsonb_build_object(
    'reconciliation_id', v_reconciliation_id,
    'previous_cutoff', v_previous_cutoff,
    'idempotent', false
  );
end;
$$;

create or replace function public.update_finance_reconciliation(
  p_business_id uuid,
  p_reconciliation_id uuid,
  p_statement_balance numeric,
  p_note text,
  p_client_request_id uuid,
  p_request_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid;
  v_fingerprint text;
  v_existing public.finance_reconciliation_commands%rowtype;
  v_reconciliation public.finance_reconciliations%rowtype;
  v_account_id uuid;
  v_changed boolean;
begin
  v_uid := private.require_finance_permission(p_business_id, 'manage_finance_reconciliation');
  if p_reconciliation_id is null or p_statement_balance is null
     or p_client_request_id is null or coalesce(trim(p_request_hash), '') = '' then
    raise exception 'reconciliation, statement balance, request id and request hash are required'
      using errcode = '22023';
  end if;

  v_fingerprint := private.finance_request_fingerprint(
    p_request_hash,
    jsonb_build_object(
      'action', 'update_reconciliation',
      'reconciliation_id', p_reconciliation_id,
      'statement_balance', p_statement_balance,
      'note', p_note
    )
  );
  perform private.lock_finance_reconciliation_request(p_business_id, p_client_request_id);
  v_existing := private.get_finance_reconciliation_command(
    p_business_id, p_client_request_id, v_fingerprint
  );
  if v_existing.id is not null then
    if v_existing.command_type <> 'update'
       or v_existing.reconciliation_id <> p_reconciliation_id then
      raise exception 'IDEMPOTENCY_CONFLICT' using errcode = '23505';
    end if;
    return jsonb_build_object(
      'reconciliation_id', p_reconciliation_id,
      'idempotent', true
    );
  end if;

  select account_id into v_account_id
  from public.finance_reconciliations
  where id = p_reconciliation_id and business_id = p_business_id;
  if not found then raise exception 'reconciliation not found' using errcode = '22023'; end if;
  perform 1 from private.lock_finance_accounts(p_business_id, array[v_account_id]);
  select * into v_reconciliation
  from public.finance_reconciliations
  where id = p_reconciliation_id and business_id = p_business_id
  for update;
  if v_reconciliation.status <> 'open' then
    raise exception 'RECONCILIATION_CLOSED' using errcode = 'P0001';
  end if;

  v_changed := v_reconciliation.statement_balance is distinct from p_statement_balance
    or v_reconciliation.note is distinct from p_note;
  if v_changed then
    update public.finance_reconciliations
    set statement_balance = p_statement_balance,
        note = p_note
    where id = p_reconciliation_id and business_id = p_business_id;

    insert into public.finance_audit_events (
      business_id, actor_id, event_type, entity_type, entity_id, payload
    ) values (
      p_business_id, v_uid, 'finance_reconciliation_updated',
      'finance_reconciliation', p_reconciliation_id,
      jsonb_build_object(
        'before', jsonb_build_object(
          'statement_balance', v_reconciliation.statement_balance,
          'note', v_reconciliation.note
        ),
        'after', jsonb_build_object(
          'statement_balance', p_statement_balance,
          'note', p_note
        )
      )
    );
  end if;

  insert into public.finance_reconciliation_commands (
    business_id, reconciliation_id, command_type,
    client_request_id, request_hash, created_by
  ) values (
    p_business_id, p_reconciliation_id, 'update',
    p_client_request_id, v_fingerprint, v_uid
  );

  return jsonb_build_object(
    'reconciliation_id', p_reconciliation_id,
    'changed', v_changed,
    'idempotent', false
  );
end;
$$;

create or replace function public.add_finance_reconciliation_transaction(
  p_business_id uuid,
  p_reconciliation_id uuid,
  p_transaction_id uuid,
  p_client_request_id uuid,
  p_request_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid;
  v_fingerprint text;
  v_existing public.finance_reconciliation_commands%rowtype;
  v_reconciliation public.finance_reconciliations%rowtype;
  v_transaction public.finance_transactions%rowtype;
  v_account_id uuid;
  v_entry_count integer;
  v_added integer;
begin
  v_uid := private.require_finance_permission(p_business_id, 'manage_finance_reconciliation');
  if p_reconciliation_id is null or p_transaction_id is null
     or p_client_request_id is null or coalesce(trim(p_request_hash), '') = '' then
    raise exception 'reconciliation, transaction, request id and request hash are required'
      using errcode = '22023';
  end if;

  v_fingerprint := private.finance_request_fingerprint(
    p_request_hash,
    jsonb_build_object(
      'action', 'add_reconciliation_transaction',
      'reconciliation_id', p_reconciliation_id,
      'transaction_id', p_transaction_id
    )
  );
  perform private.lock_finance_reconciliation_request(p_business_id, p_client_request_id);
  v_existing := private.get_finance_reconciliation_command(
    p_business_id, p_client_request_id, v_fingerprint
  );
  if v_existing.id is not null then
    if v_existing.command_type <> 'add_transaction'
       or v_existing.reconciliation_id <> p_reconciliation_id then
      raise exception 'IDEMPOTENCY_CONFLICT' using errcode = '23505';
    end if;
    return jsonb_build_object(
      'reconciliation_id', p_reconciliation_id,
      'transaction_id', p_transaction_id,
      'idempotent', true
    );
  end if;

  select account_id into v_account_id
  from public.finance_reconciliations
  where id = p_reconciliation_id and business_id = p_business_id;
  if not found then raise exception 'reconciliation not found' using errcode = '22023'; end if;
  perform 1 from private.lock_finance_accounts(p_business_id, array[v_account_id]);
  select * into v_reconciliation
  from public.finance_reconciliations
  where id = p_reconciliation_id and business_id = p_business_id
  for update;
  if v_reconciliation.status <> 'open' then
    raise exception 'RECONCILIATION_CLOSED' using errcode = 'P0001';
  end if;

  select * into v_transaction
  from public.finance_transactions
  where id = p_transaction_id and business_id = p_business_id;
  if not found then raise exception 'transaction not found' using errcode = '22023'; end if;
  if v_transaction.status <> 'posted' then
    raise exception 'transaction is not posted' using errcode = 'P0001';
  end if;
  if v_transaction.occurred_at > v_reconciliation.cutoff_at then
    raise exception 'transaction occurs after reconciliation cutoff' using errcode = 'P0001';
  end if;

  select count(*) into v_entry_count
  from public.finance_transaction_entries e
  join public.finance_funds f
    on f.id = e.fund_id and f.business_id = e.business_id
  where e.business_id = p_business_id
    and e.transaction_id = p_transaction_id
    and f.account_id = v_account_id;
  if v_entry_count = 0 then
    raise exception 'transaction has no entries for reconciliation account'
      using errcode = '22023';
  end if;
  if exists (
    select 1
    from public.finance_transaction_entries e
    join public.finance_funds f
      on f.id = e.fund_id and f.business_id = e.business_id
    join public.finance_reconciliation_entries linked on linked.entry_id = e.id
    where e.business_id = p_business_id
      and e.transaction_id = p_transaction_id
      and f.account_id = v_account_id
      and linked.reconciliation_id <> p_reconciliation_id
  ) then
    raise exception 'entry already belongs to another reconciliation'
      using errcode = '23505';
  end if;

  insert into public.finance_reconciliation_entries (
    business_id, reconciliation_id, transaction_id, entry_id
  )
  select e.business_id, p_reconciliation_id, e.transaction_id, e.id
  from public.finance_transaction_entries e
  join public.finance_funds f
    on f.id = e.fund_id and f.business_id = e.business_id
  where e.business_id = p_business_id
    and e.transaction_id = p_transaction_id
    and f.account_id = v_account_id
  on conflict (entry_id) do nothing;
  get diagnostics v_added = row_count;

  insert into public.finance_reconciliation_commands (
    business_id, reconciliation_id, command_type,
    client_request_id, request_hash, created_by
  ) values (
    p_business_id, p_reconciliation_id, 'add_transaction',
    p_client_request_id, v_fingerprint, v_uid
  );
  if v_added > 0 then
    insert into public.finance_audit_events (
      business_id, actor_id, event_type, entity_type, entity_id, payload
    ) values (
      p_business_id, v_uid, 'finance_reconciliation_transaction_added',
      'finance_reconciliation', p_reconciliation_id,
      jsonb_build_object('transaction_id', p_transaction_id, 'entry_count', v_added)
    );
  end if;

  return jsonb_build_object(
    'reconciliation_id', p_reconciliation_id,
    'transaction_id', p_transaction_id,
    'entry_count', v_entry_count,
    'added_count', v_added,
    'changed', v_added > 0,
    'idempotent', false
  );
end;
$$;

create or replace function public.remove_finance_reconciliation_transaction(
  p_business_id uuid,
  p_reconciliation_id uuid,
  p_transaction_id uuid,
  p_client_request_id uuid,
  p_request_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid;
  v_fingerprint text;
  v_existing public.finance_reconciliation_commands%rowtype;
  v_reconciliation public.finance_reconciliations%rowtype;
  v_account_id uuid;
  v_removed integer;
begin
  v_uid := private.require_finance_permission(p_business_id, 'manage_finance_reconciliation');
  if p_reconciliation_id is null or p_transaction_id is null
     or p_client_request_id is null or coalesce(trim(p_request_hash), '') = '' then
    raise exception 'reconciliation, transaction, request id and request hash are required'
      using errcode = '22023';
  end if;

  v_fingerprint := private.finance_request_fingerprint(
    p_request_hash,
    jsonb_build_object(
      'action', 'remove_reconciliation_transaction',
      'reconciliation_id', p_reconciliation_id,
      'transaction_id', p_transaction_id
    )
  );
  perform private.lock_finance_reconciliation_request(p_business_id, p_client_request_id);
  v_existing := private.get_finance_reconciliation_command(
    p_business_id, p_client_request_id, v_fingerprint
  );
  if v_existing.id is not null then
    if v_existing.command_type <> 'remove_transaction'
       or v_existing.reconciliation_id <> p_reconciliation_id then
      raise exception 'IDEMPOTENCY_CONFLICT' using errcode = '23505';
    end if;
    return jsonb_build_object(
      'reconciliation_id', p_reconciliation_id,
      'transaction_id', p_transaction_id,
      'idempotent', true
    );
  end if;

  select account_id into v_account_id
  from public.finance_reconciliations
  where id = p_reconciliation_id and business_id = p_business_id;
  if not found then raise exception 'reconciliation not found' using errcode = '22023'; end if;
  perform 1 from private.lock_finance_accounts(p_business_id, array[v_account_id]);
  select * into v_reconciliation
  from public.finance_reconciliations
  where id = p_reconciliation_id and business_id = p_business_id
  for update;
  if v_reconciliation.status <> 'open' then
    raise exception 'RECONCILIATION_CLOSED' using errcode = 'P0001';
  end if;

  delete from public.finance_reconciliation_entries re
  using public.finance_transaction_entries e, public.finance_funds f
  where re.business_id = p_business_id
    and re.reconciliation_id = p_reconciliation_id
    and re.transaction_id = p_transaction_id
    and e.id = re.entry_id
    and e.business_id = re.business_id
    and f.id = e.fund_id
    and f.business_id = e.business_id
    and f.account_id = v_account_id;
  get diagnostics v_removed = row_count;

  insert into public.finance_reconciliation_commands (
    business_id, reconciliation_id, command_type,
    client_request_id, request_hash, created_by
  ) values (
    p_business_id, p_reconciliation_id, 'remove_transaction',
    p_client_request_id, v_fingerprint, v_uid
  );
  if v_removed > 0 then
    insert into public.finance_audit_events (
      business_id, actor_id, event_type, entity_type, entity_id, payload
    ) values (
      p_business_id, v_uid, 'finance_reconciliation_transaction_removed',
      'finance_reconciliation', p_reconciliation_id,
      jsonb_build_object('transaction_id', p_transaction_id, 'entry_count', v_removed)
    );
  end if;

  return jsonb_build_object(
    'reconciliation_id', p_reconciliation_id,
    'transaction_id', p_transaction_id,
    'removed_count', v_removed,
    'changed', v_removed > 0,
    'idempotent', false
  );
end;
$$;

create or replace function public.close_finance_reconciliation(
  p_business_id uuid,
  p_reconciliation_id uuid,
  p_client_request_id uuid,
  p_request_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid;
  v_fingerprint text;
  v_existing public.finance_reconciliation_commands%rowtype;
  v_reconciliation public.finance_reconciliations%rowtype;
  v_account_id uuid;
  v_expected numeric(14, 2);
  v_difference numeric(14, 2);
  v_pending bigint;
  v_snapshot_count integer;
begin
  v_uid := private.require_finance_permission(p_business_id, 'manage_finance_reconciliation');
  if p_reconciliation_id is null or p_client_request_id is null
     or coalesce(trim(p_request_hash), '') = '' then
    raise exception 'reconciliation, request id and request hash are required'
      using errcode = '22023';
  end if;

  v_fingerprint := private.finance_request_fingerprint(
    p_request_hash,
    jsonb_build_object(
      'action', 'close_reconciliation',
      'reconciliation_id', p_reconciliation_id
    )
  );
  perform private.lock_finance_reconciliation_request(p_business_id, p_client_request_id);
  v_existing := private.get_finance_reconciliation_command(
    p_business_id, p_client_request_id, v_fingerprint
  );
  if v_existing.id is not null then
    if v_existing.command_type <> 'close'
       or v_existing.reconciliation_id <> p_reconciliation_id then
      raise exception 'IDEMPOTENCY_CONFLICT' using errcode = '23505';
    end if;
    select * into v_reconciliation
    from public.finance_reconciliations
    where id = p_reconciliation_id and business_id = p_business_id;
    return jsonb_build_object(
      'reconciliation_id', p_reconciliation_id,
      'system_balance', v_reconciliation.system_balance,
      'difference', v_reconciliation.statement_balance - v_reconciliation.system_balance,
      'idempotent', true
    );
  end if;

  select account_id into v_account_id
  from public.finance_reconciliations
  where id = p_reconciliation_id and business_id = p_business_id;
  if not found then raise exception 'reconciliation not found' using errcode = '22023'; end if;
  perform 1 from private.lock_finance_accounts(p_business_id, array[v_account_id]);
  select * into v_reconciliation
  from public.finance_reconciliations
  where id = p_reconciliation_id and business_id = p_business_id
  for update;
  if v_reconciliation.status <> 'open' then
    raise exception 'RECONCILIATION_CLOSED' using errcode = 'P0001';
  end if;

  perform 1
  from public.finance_reconciliation_entries re
  where re.business_id = p_business_id
    and re.reconciliation_id = p_reconciliation_id
  order by re.entry_id
  for update of re;

  v_expected := private.finance_account_balance_at(
    p_business_id, v_reconciliation.account_id, v_reconciliation.cutoff_at
  );
  v_difference := v_reconciliation.statement_balance - v_expected;
  if v_difference <> 0 then
    raise exception 'RECONCILIATION_DIFFERENCE_NONZERO: %', v_difference
      using errcode = 'P0001';
  end if;

  v_pending := private.finance_reconciliation_pending_entry_count(
    p_business_id, p_reconciliation_id
  );
  if v_pending <> 0 then
    raise exception 'RECONCILIATION_PENDING_ENTRIES: %', v_pending
      using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.finance_reconciliation_fund_snapshots s
    where s.business_id = p_business_id
      and s.reconciliation_id = p_reconciliation_id
  ) then
    raise exception 'RECONCILIATION_SNAPSHOTS_ALREADY_EXIST' using errcode = 'P0001';
  end if;

  insert into public.finance_reconciliation_fund_snapshots (
    business_id, reconciliation_id, fund_id, balance
  )
  select f.business_id, p_reconciliation_id, f.id,
         private.finance_fund_balance_at(p_business_id, f.id, v_reconciliation.cutoff_at)
  from public.finance_funds f
  where f.business_id = p_business_id
    and f.account_id = v_reconciliation.account_id
  order by f.id;
  get diagnostics v_snapshot_count = row_count;

  update public.finance_reconciliations
  set status = 'closed',
      system_balance = v_expected,
      closed_at = clock_timestamp(),
      closed_by = v_uid
  where id = p_reconciliation_id and business_id = p_business_id;

  insert into public.finance_reconciliation_commands (
    business_id, reconciliation_id, command_type,
    client_request_id, request_hash, created_by
  ) values (
    p_business_id, p_reconciliation_id, 'close',
    p_client_request_id, v_fingerprint, v_uid
  );
  insert into public.finance_audit_events (
    business_id, actor_id, event_type, entity_type, entity_id, payload
  ) values (
    p_business_id, v_uid, 'finance_reconciliation_closed',
    'finance_reconciliation', p_reconciliation_id,
    jsonb_build_object(
      'account_id', v_reconciliation.account_id,
      'cutoff_at', v_reconciliation.cutoff_at,
      'statement_balance', v_reconciliation.statement_balance,
      'system_balance', v_expected,
      'snapshot_count', v_snapshot_count,
      'included_entry_count', private.finance_reconciliation_included_entry_count(
        p_business_id, p_reconciliation_id
      )
    )
  );

  return jsonb_build_object(
    'reconciliation_id', p_reconciliation_id,
    'system_balance', v_expected,
    'difference', 0,
    'snapshot_count', v_snapshot_count,
    'idempotent', false
  );
end;
$$;
