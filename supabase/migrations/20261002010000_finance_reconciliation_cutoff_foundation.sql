-- Phase 3B: contractual reconciliation cutoff, historical balances, shared account locks,
-- durable command idempotency, and closed-period enforcement.

alter table public.finance_reconciliations
  add column cutoff_at timestamptz;

do $$
begin
  if exists (select 1 from public.finance_reconciliations where cutoff_at is null) then
    raise exception 'RECONCILIATION_CUTOFF_BACKFILL_REQUIRED';
  end if;
end;
$$;

alter table public.finance_reconciliations
  alter column cutoff_at set not null;

alter table public.finance_reconciliations
  drop constraint finance_reconciliations_open_metadata_chk;

alter table public.finance_reconciliations
  add constraint finance_reconciliations_status_metadata_chk check (
    (
      status = 'open'
      and system_balance is null
      and closed_by is null
      and closed_at is null
    )
    or
    (
      status = 'closed'
      and system_balance is not null
      and closed_by is not null
      and closed_at is not null
    )
  );

create unique index finance_reconciliations_one_open_account_uidx
  on public.finance_reconciliations(business_id, account_id)
  where status = 'open';

create index finance_reconciliations_account_cutoff_idx
  on public.finance_reconciliations(business_id, account_id, cutoff_at desc)
  where status = 'closed';

create table public.finance_reconciliation_commands (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  reconciliation_id uuid,
  command_type text not null,
  client_request_id uuid not null,
  request_hash text not null,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  constraint finance_reconciliation_commands_type_chk check (
    command_type in ('create', 'update', 'add_transaction', 'remove_transaction', 'close')
  ),
  constraint finance_reconciliation_commands_hash_chk
    check (char_length(trim(request_hash)) > 0),
  constraint finance_reconciliation_commands_reconciliation_business_fkey
    foreign key (reconciliation_id, business_id)
    references public.finance_reconciliations(id, business_id),
  constraint finance_reconciliation_commands_created_by_business_fkey
    foreign key (created_by, business_id)
    references public.profiles(id, business_id),
  constraint finance_reconciliation_commands_business_request_key
    unique (business_id, client_request_id),
  constraint finance_reconciliation_commands_id_business_key unique (id, business_id)
);

create index finance_reconciliation_commands_reconciliation_idx
  on public.finance_reconciliation_commands(reconciliation_id, created_at);

create or replace function private.lock_finance_reconciliation_request(
  p_business_id uuid,
  p_client_request_id uuid
)
returns void
language sql
volatile
security definer
set search_path = pg_catalog
as $$
  select pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'finance-reconciliation:' || p_business_id::text || ':' || p_client_request_id::text,
      0
    )
  );
$$;

create or replace function private.get_finance_reconciliation_command(
  p_business_id uuid,
  p_client_request_id uuid,
  p_request_hash text
)
returns public.finance_reconciliation_commands
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_command public.finance_reconciliation_commands%rowtype;
begin
  select * into v_command
  from public.finance_reconciliation_commands
  where business_id = p_business_id
    and client_request_id = p_client_request_id;

  if found and v_command.request_hash <> p_request_hash then
    raise exception 'IDEMPOTENCY_CONFLICT' using errcode = '23505';
  end if;

  return v_command;
end;
$$;

create or replace function private.lock_finance_accounts(
  p_business_id uuid,
  p_account_ids uuid[]
)
returns setof public.finance_accounts
language sql
volatile
security definer
set search_path = pg_catalog, public
as $$
  select a.*
  from public.finance_accounts a
  where a.business_id = p_business_id
    and a.id = any(coalesce(p_account_ids, array[]::uuid[]))
  order by a.id
  for update of a;
$$;

create or replace function private.lock_finance_funds(
  p_business_id uuid,
  p_fund_ids uuid[]
)
returns setof public.finance_funds
language plpgsql
volatile
security definer
set search_path = pg_catalog, public
as $$
declare
  v_account_ids uuid[];
begin
  select array_agg(distinct f.account_id order by f.account_id)
  into v_account_ids
  from public.finance_funds f
  where f.business_id = p_business_id
    and f.id = any(coalesce(p_fund_ids, array[]::uuid[]));

  perform 1
  from private.lock_finance_accounts(p_business_id, v_account_ids);

  return query
  select f.*
  from public.finance_funds f
  where f.business_id = p_business_id
    and f.id = any(coalesce(p_fund_ids, array[]::uuid[]))
  order by f.id
  for update of f;
end;
$$;

create or replace function private.finance_fund_balance_at(
  p_business_id uuid,
  p_fund_id uuid,
  p_cutoff_at timestamptz
)
returns numeric
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce(sum(
    case when e.direction = 'in' then e.amount else -e.amount end
  ), 0)::numeric(14, 2)
  from public.finance_transaction_entries e
  join public.finance_transactions t
    on t.id = e.transaction_id
   and t.business_id = e.business_id
  where e.business_id = p_business_id
    and e.fund_id = p_fund_id
    and t.status = 'posted'
    and t.occurred_at <= p_cutoff_at;
$$;

create or replace function private.finance_account_balance_at(
  p_business_id uuid,
  p_account_id uuid,
  p_cutoff_at timestamptz
)
returns numeric
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce(sum(
    case when e.direction = 'in' then e.amount else -e.amount end
  ), 0)::numeric(14, 2)
  from public.finance_transaction_entries e
  join public.finance_transactions t
    on t.id = e.transaction_id
   and t.business_id = e.business_id
  join public.finance_funds f
    on f.id = e.fund_id
   and f.business_id = e.business_id
  where e.business_id = p_business_id
    and f.account_id = p_account_id
    and t.status = 'posted'
    and t.occurred_at <= p_cutoff_at;
$$;

create or replace function private.latest_closed_finance_cutoff(
  p_business_id uuid,
  p_account_id uuid
)
returns timestamptz
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select max(r.cutoff_at)
  from public.finance_reconciliations r
  where r.business_id = p_business_id
    and r.account_id = p_account_id
    and r.status = 'closed';
$$;

create or replace function private.assert_finance_occurred_at_open_period(
  p_business_id uuid,
  p_account_ids uuid[],
  p_occurred_at timestamptz
)
returns void
language plpgsql
volatile
security definer
set search_path = pg_catalog, public
as $$
declare
  v_locked_count integer;
begin
  if p_occurred_at is null then
    raise exception 'occurred_at is required' using errcode = '22023';
  end if;

  select count(*) into v_locked_count
  from private.lock_finance_accounts(p_business_id, p_account_ids);
  if v_locked_count <> cardinality(coalesce(p_account_ids, array[]::uuid[])) then
    raise exception 'invalid finance account set' using errcode = '22023';
  end if;

  if exists (
    select 1
    from unnest(coalesce(p_account_ids, array[]::uuid[])) account_id
    where p_occurred_at <= private.latest_closed_finance_cutoff(p_business_id, account_id)
  ) then
    raise exception 'FINANCE_CLOSED_PERIOD' using errcode = 'P0001';
  end if;
end;
$$;

create or replace function private.finance_date_in_closed_period(
  p_business_id uuid,
  p_account_ids uuid[],
  p_occurred_at timestamptz
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from unnest(coalesce(p_account_ids, array[]::uuid[])) account_id
    where p_occurred_at <= private.latest_closed_finance_cutoff(p_business_id, account_id)
  );
$$;

create or replace function private.finance_reconciliation_included_entry_count(
  p_business_id uuid,
  p_reconciliation_id uuid
)
returns bigint
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select count(*)
  from public.finance_reconciliation_entries re
  where re.business_id = p_business_id
    and re.reconciliation_id = p_reconciliation_id;
$$;

create or replace function private.finance_reconciliation_pending_entry_count(
  p_business_id uuid,
  p_reconciliation_id uuid
)
returns bigint
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select count(*)
  from public.finance_reconciliations r
  join public.finance_funds f
    on f.business_id = r.business_id
   and f.account_id = r.account_id
  join public.finance_transaction_entries e
    on e.business_id = f.business_id
   and e.fund_id = f.id
  join public.finance_transactions t
    on t.business_id = e.business_id
   and t.id = e.transaction_id
  where r.business_id = p_business_id
    and r.id = p_reconciliation_id
    and t.status = 'posted'
    and t.occurred_at <= r.cutoff_at
    and not exists (
      select 1
      from public.finance_reconciliation_entries linked
      where linked.entry_id = e.id
    );
$$;

create or replace function private.enforce_finance_reconciliation_row_mutability()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'DELETE' then
    if old.status = 'closed' then
      raise exception 'CLOSED_RECONCILIATION_IMMUTABLE' using errcode = 'P0001';
    end if;
    return old;
  end if;

  if old.status = 'closed' then
    raise exception 'CLOSED_RECONCILIATION_IMMUTABLE' using errcode = 'P0001';
  end if;
  if new.business_id is distinct from old.business_id
     or new.account_id is distinct from old.account_id
     or new.cutoff_at is distinct from old.cutoff_at
     or new.opened_by is distinct from old.opened_by
     or new.opened_at is distinct from old.opened_at
     or new.created_at is distinct from old.created_at then
    raise exception 'RECONCILIATION_IDENTITY_IMMUTABLE' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger enforce_finance_reconciliation_row_mutability
  before update or delete on public.finance_reconciliations
  for each row execute function private.enforce_finance_reconciliation_row_mutability();

create or replace function private.enforce_finance_reconciliation_child_mutability()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_reconciliation_id uuid := coalesce(new.reconciliation_id, old.reconciliation_id);
  v_status public.finance_reconciliation_status;
begin
  select status into v_status
  from public.finance_reconciliations
  where id = v_reconciliation_id;
  if v_status <> 'open' then
    raise exception 'CLOSED_RECONCILIATION_IMMUTABLE' using errcode = 'P0001';
  end if;
  if tg_table_name = 'finance_reconciliation_fund_snapshots' and tg_op = 'UPDATE' then
    raise exception 'RECONCILIATION_SNAPSHOT_IMMUTABLE' using errcode = 'P0001';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger enforce_finance_reconciliation_snapshot_mutability
  before insert or update or delete on public.finance_reconciliation_fund_snapshots
  for each row execute function private.enforce_finance_reconciliation_child_mutability();

create trigger enforce_finance_reconciliation_entry_mutability
  before insert or update or delete on public.finance_reconciliation_entries
  for each row execute function private.enforce_finance_reconciliation_child_mutability();

create or replace function private.guard_finance_entry_closed_period()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_occurred_at timestamptz;
  v_status public.finance_transaction_status;
  v_account_id uuid;
begin
  select t.occurred_at, t.status
  into v_occurred_at, v_status
  from public.finance_transactions t
  where t.id = new.transaction_id
    and t.business_id = new.business_id;

  select f.account_id into v_account_id
  from public.finance_funds f
  where f.id = new.fund_id
    and f.business_id = new.business_id;

  if v_status = 'posted' then
    perform private.assert_finance_occurred_at_open_period(
      new.business_id, array[v_account_id], v_occurred_at
    );
  end if;
  return new;
end;
$$;

create trigger guard_finance_entry_closed_period
  before insert on public.finance_transaction_entries
  for each row execute function private.guard_finance_entry_closed_period();

create or replace function private.guard_finance_transaction_mutation()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_account_ids uuid[];
begin
  if new.occurred_at is not distinct from old.occurred_at
     and new.status is not distinct from old.status then
    return new;
  end if;

  select array_agg(distinct f.account_id order by f.account_id)
  into v_account_ids
  from public.finance_transaction_entries e
  join public.finance_funds f
    on f.id = e.fund_id and f.business_id = e.business_id
  where e.business_id = old.business_id
    and e.transaction_id = old.id;

  perform 1 from private.lock_finance_accounts(old.business_id, v_account_ids);

  if new.occurred_at is distinct from old.occurred_at
     and (
       private.finance_date_in_closed_period(old.business_id, v_account_ids, old.occurred_at)
       or private.finance_date_in_closed_period(old.business_id, v_account_ids, new.occurred_at)
     ) then
    raise exception 'FINANCE_CLOSED_PERIOD' using errcode = 'P0001';
  end if;

  if new.occurred_at is distinct from old.occurred_at and exists (
    select 1
    from public.finance_reconciliation_entries re
    where re.business_id = old.business_id
      and re.transaction_id = old.id
  ) then
    raise exception 'RECONCILED_TRANSACTION_IMMUTABLE' using errcode = 'P0001';
  end if;

  if old.status = 'posted' and new.status = 'voided' and exists (
    select 1
    from public.finance_reconciliation_entries re
    where re.business_id = old.business_id
      and re.transaction_id = old.id
  ) then
    raise exception 'RECONCILED_TRANSACTION_IMMUTABLE' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger guard_finance_transaction_mutation
  before update of occurred_at, status on public.finance_transactions
  for each row execute function private.guard_finance_transaction_mutation();

revoke all on function private.lock_finance_reconciliation_request(uuid, uuid) from public, anon, authenticated;
revoke all on function private.get_finance_reconciliation_command(uuid, uuid, text) from public, anon, authenticated;
revoke all on function private.lock_finance_accounts(uuid, uuid[]) from public, anon, authenticated;
revoke all on function private.finance_fund_balance_at(uuid, uuid, timestamptz) from public, anon, authenticated;
revoke all on function private.finance_account_balance_at(uuid, uuid, timestamptz) from public, anon, authenticated;
revoke all on function private.latest_closed_finance_cutoff(uuid, uuid) from public, anon, authenticated;
revoke all on function private.assert_finance_occurred_at_open_period(uuid, uuid[], timestamptz) from public, anon, authenticated;
revoke all on function private.finance_reconciliation_included_entry_count(uuid, uuid) from public, anon, authenticated;
revoke all on function private.finance_reconciliation_pending_entry_count(uuid, uuid) from public, anon, authenticated;
