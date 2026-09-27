-- Phase 3A: provenance and guards for general-ledger corrections.

alter table public.finance_operations
  add column target_operation_id uuid;

alter table public.finance_operations
  add constraint finance_operations_target_business_fkey
  foreign key (target_operation_id, business_id)
  references public.finance_operations(id, business_id);

alter table public.finance_operations
  add constraint finance_operations_target_not_self_chk
  check (target_operation_id is null or target_operation_id <> id);

alter table public.finance_operations
  add constraint finance_operations_provenance_chk
  check (
    (operation_type in ('metadata_edit', 'void', 'correction') and target_operation_id is not null)
    or
    (operation_type not in ('metadata_edit', 'void', 'correction') and target_operation_id is null)
  );

create index finance_operations_target_business_idx
  on public.finance_operations(business_id, target_operation_id)
  where target_operation_id is not null;

create unique index finance_operations_one_void_per_target_uidx
  on public.finance_operations(business_id, target_operation_id)
  where operation_type = 'void';

alter table public.finance_reconciliation_entries
  add constraint finance_reconciliation_entries_entry_key unique (entry_id);

create or replace function private.require_finance_permission(
  p_business_id uuid,
  p_permission text
)
returns uuid
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid;
  v_role text;
begin
  v_uid := private.require_business_member(p_business_id);
  if p_permission not in (
    'read', 'operate', 'reconcile', 'correct', 'admin',
    'manage_order_contract', 'record_historical_deposit',
    'manage_finance_corrections'
  ) then
    raise exception 'unknown finance permission' using errcode = '22023';
  end if;
  if p_permission <> 'read' then
    perform private.require_finance_enabled(p_business_id);
  end if;
  select p.role into v_role from public.profiles p where p.id = v_uid;
  if v_role in ('owner', 'admin')
     or (v_role = 'manager' and p_permission in (
       'read', 'operate', 'reconcile', 'correct',
       'manage_order_contract', 'record_historical_deposit',
       'manage_finance_corrections'
     ))
     or (v_role = 'operator' and p_permission in ('read', 'operate'))
     or (v_role = 'viewer' and p_permission = 'read') then
    return v_uid;
  end if;
  raise exception 'finance permission denied' using errcode = '42501';
end;
$$;

create or replace function private.lock_finance_operation(p_business_id uuid, p_operation_id uuid)
returns public.finance_operations
language sql volatile security definer
set search_path = pg_catalog, public
as $$
  select o.* from public.finance_operations o
  where o.business_id = p_business_id and o.id = p_operation_id
  for update of o;
$$;

create or replace function private.operation_has_reconciliation_link(
  p_business_id uuid, p_operation_id uuid
)
returns boolean
language sql stable security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.finance_transactions t
    join public.finance_transaction_entries e
      on e.transaction_id = t.id and e.business_id = t.business_id
    join public.finance_reconciliation_entries re
      on re.entry_id = e.id and re.transaction_id = t.id and re.business_id = t.business_id
    where t.business_id = p_business_id and t.operation_id = p_operation_id
  );
$$;

create or replace function private.finance_date_in_closed_period(
  p_business_id uuid, p_account_ids uuid[], p_occurred_at timestamptz
)
returns boolean
language sql stable security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from public.finance_reconciliations r
    where r.business_id = p_business_id
      and r.status = 'closed'
      and r.account_id = any(coalesce(p_account_ids, array[]::uuid[]))
      and r.closed_at is not null
      and p_occurred_at >= r.opened_at
      and p_occurred_at <= r.closed_at
  );
$$;

create or replace function private.finance_operation_account_ids(
  p_business_id uuid, p_operation_id uuid
)
returns uuid[]
language sql stable security definer
set search_path = pg_catalog, public
as $$
  select coalesce(array_agg(distinct f.account_id order by f.account_id), array[]::uuid[])
  from public.finance_transactions t
  join public.finance_transaction_entries e
    on e.transaction_id = t.id and e.business_id = t.business_id
  join public.finance_funds f
    on f.id = e.fund_id and f.business_id = e.business_id
  where t.business_id = p_business_id and t.operation_id = p_operation_id;
$$;

revoke all on function private.lock_finance_operation(uuid, uuid) from public, anon, authenticated;
revoke all on function private.operation_has_reconciliation_link(uuid, uuid) from public, anon, authenticated;
revoke all on function private.finance_date_in_closed_period(uuid, uuid[], timestamptz) from public, anon, authenticated;
revoke all on function private.finance_operation_account_ids(uuid, uuid) from public, anon, authenticated;
