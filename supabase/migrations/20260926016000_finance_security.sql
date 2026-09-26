-- Finance authorization foundation. No commercial write RPCs are created here.

grant usage on schema private to authenticated, service_role;

create or replace function private.require_business_member(p_business_id uuid)
returns uuid
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null or not exists (
    select 1
    from public.profiles p
    where p.id = v_uid
      and p.business_id = p_business_id
  ) then
    raise exception 'business membership required' using errcode = '42501';
  end if;

  return v_uid;
end;
$$;

create or replace function private.require_finance_enabled(p_business_id uuid)
returns uuid
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid;
begin
  v_uid := private.require_business_member(p_business_id);

  if not exists (
    select 1
    from public.business_settings s
    where s.business_id = p_business_id
      and s.finance_enabled = true
      and s.timezone is not null
  ) then
    raise exception 'finance is disabled for this business' using errcode = '42501';
  end if;

  return v_uid;
end;
$$;

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

  if p_permission not in ('read', 'operate', 'reconcile', 'correct', 'admin') then
    raise exception 'unknown finance permission' using errcode = '22023';
  end if;

  if p_permission <> 'read' then
    perform private.require_finance_enabled(p_business_id);
  end if;

  select p.role into v_role
  from public.profiles p
  where p.id = v_uid;

  if v_role in ('owner', 'admin')
     or (v_role = 'manager' and p_permission in ('read', 'operate', 'reconcile', 'correct'))
     or (v_role = 'operator' and p_permission in ('read', 'operate'))
     or (v_role = 'viewer' and p_permission = 'read') then
    return v_uid;
  end if;

  raise exception 'finance permission denied' using errcode = '42501';
end;
$$;

revoke all on function private.require_business_member(uuid) from public;
revoke all on function private.require_finance_enabled(uuid) from public;
revoke all on function private.require_finance_permission(uuid, text) from public;
grant execute on function private.require_business_member(uuid) to authenticated, service_role;
grant execute on function private.require_finance_enabled(uuid) to authenticated, service_role;
grant execute on function private.require_finance_permission(uuid, text) to authenticated, service_role;

alter table public.order_financials enable row level security;
alter table public.business_finance_settings enable row level security;
alter table public.finance_accounts enable row level security;
alter table public.finance_categories enable row level security;
alter table public.finance_funds enable row level security;
alter table public.finance_operations enable row level security;
alter table public.finance_transactions enable row level security;
alter table public.finance_transaction_entries enable row level security;
alter table public.finance_audit_events enable row level security;
alter table public.finance_reconciliations enable row level security;
alter table public.finance_reconciliation_fund_snapshots enable row level security;
alter table public.finance_reconciliation_entries enable row level security;

create policy order_financials_select_business_member
  on public.order_financials for select to authenticated
  using (business_id = (select p.business_id from public.profiles p where p.id = auth.uid()));
create policy business_finance_settings_select_business_member
  on public.business_finance_settings for select to authenticated
  using (business_id = (select p.business_id from public.profiles p where p.id = auth.uid()));
create policy finance_accounts_select_business_member
  on public.finance_accounts for select to authenticated
  using (business_id = (select p.business_id from public.profiles p where p.id = auth.uid()));
create policy finance_categories_select_business_member
  on public.finance_categories for select to authenticated
  using (business_id = (select p.business_id from public.profiles p where p.id = auth.uid()));
create policy finance_funds_select_business_member
  on public.finance_funds for select to authenticated
  using (business_id = (select p.business_id from public.profiles p where p.id = auth.uid()));
create policy finance_operations_select_business_member
  on public.finance_operations for select to authenticated
  using (business_id = (select p.business_id from public.profiles p where p.id = auth.uid()));
create policy finance_transactions_select_business_member
  on public.finance_transactions for select to authenticated
  using (business_id = (select p.business_id from public.profiles p where p.id = auth.uid()));
create policy finance_transaction_entries_select_business_member
  on public.finance_transaction_entries for select to authenticated
  using (business_id = (select p.business_id from public.profiles p where p.id = auth.uid()));
create policy finance_audit_events_select_business_member
  on public.finance_audit_events for select to authenticated
  using (business_id = (select p.business_id from public.profiles p where p.id = auth.uid()));
create policy finance_reconciliations_select_business_member
  on public.finance_reconciliations for select to authenticated
  using (business_id = (select p.business_id from public.profiles p where p.id = auth.uid()));
create policy finance_reconciliation_snapshots_select_business_member
  on public.finance_reconciliation_fund_snapshots for select to authenticated
  using (business_id = (select p.business_id from public.profiles p where p.id = auth.uid()));
create policy finance_reconciliation_entries_select_business_member
  on public.finance_reconciliation_entries for select to authenticated
  using (business_id = (select p.business_id from public.profiles p where p.id = auth.uid()));

revoke all on table public.order_financials from anon, authenticated;
revoke all on table public.business_finance_settings from anon, authenticated;
revoke all on table public.finance_accounts from anon, authenticated;
revoke all on table public.finance_categories from anon, authenticated;
revoke all on table public.finance_funds from anon, authenticated;
revoke all on table public.finance_operations from anon, authenticated;
revoke all on table public.finance_transactions from anon, authenticated;
revoke all on table public.finance_transaction_entries from anon, authenticated;
revoke all on table public.finance_audit_events from anon, authenticated;
revoke all on table public.finance_reconciliations from anon, authenticated;
revoke all on table public.finance_reconciliation_fund_snapshots from anon, authenticated;
revoke all on table public.finance_reconciliation_entries from anon, authenticated;

grant select on table public.order_financials to authenticated;
grant select on table public.business_finance_settings to authenticated;
grant select on table public.finance_accounts to authenticated;
grant select on table public.finance_categories to authenticated;
grant select on table public.finance_funds to authenticated;
grant select on table public.finance_operations to authenticated;
grant select on table public.finance_transactions to authenticated;
grant select on table public.finance_transaction_entries to authenticated;
grant select on table public.finance_audit_events to authenticated;
grant select on table public.finance_reconciliations to authenticated;
grant select on table public.finance_reconciliation_fund_snapshots to authenticated;
grant select on table public.finance_reconciliation_entries to authenticated;
