-- Phase 3B: centralized reconciliation capability and least-privilege grants.

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
    'manage_finance_corrections', 'manage_finance_reconciliation'
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
       'manage_finance_corrections', 'manage_finance_reconciliation'
     ))
     or (v_role = 'operator' and p_permission in ('read', 'operate'))
     or (v_role = 'viewer' and p_permission = 'read') then
    return v_uid;
  end if;
  raise exception 'finance permission denied' using errcode = '42501';
end;
$$;

alter table public.finance_reconciliation_commands enable row level security;

create policy finance_reconciliation_commands_select_business_member
  on public.finance_reconciliation_commands for select to authenticated
  using (
    business_id = (
      select p.business_id from public.profiles p where p.id = auth.uid()
    )
  );

revoke all on table public.finance_reconciliation_commands from anon, authenticated;
grant select on table public.finance_reconciliation_commands to authenticated;

revoke all on function public.create_finance_reconciliation(
  uuid, uuid, timestamptz, numeric, text, uuid, text
) from public, anon, authenticated;
revoke all on function public.update_finance_reconciliation(
  uuid, uuid, numeric, text, uuid, text
) from public, anon, authenticated;
revoke all on function public.add_finance_reconciliation_transaction(
  uuid, uuid, uuid, uuid, text
) from public, anon, authenticated;
revoke all on function public.remove_finance_reconciliation_transaction(
  uuid, uuid, uuid, uuid, text
) from public, anon, authenticated;
revoke all on function public.close_finance_reconciliation(
  uuid, uuid, uuid, text
) from public, anon, authenticated;
revoke all on function public.finance_reconciliation_summary(uuid)
  from public, anon, authenticated;
revoke all on function public.finance_account_balance_at(uuid, timestamptz)
  from public, anon, authenticated;
revoke all on function public.finance_fund_balance_at(uuid, timestamptz)
  from public, anon, authenticated;

grant execute on function public.create_finance_reconciliation(
  uuid, uuid, timestamptz, numeric, text, uuid, text
) to authenticated;
grant execute on function public.update_finance_reconciliation(
  uuid, uuid, numeric, text, uuid, text
) to authenticated;
grant execute on function public.add_finance_reconciliation_transaction(
  uuid, uuid, uuid, uuid, text
) to authenticated;
grant execute on function public.remove_finance_reconciliation_transaction(
  uuid, uuid, uuid, uuid, text
) to authenticated;
grant execute on function public.close_finance_reconciliation(
  uuid, uuid, uuid, text
) to authenticated;
grant execute on function public.finance_reconciliation_summary(uuid) to authenticated;
grant execute on function public.finance_account_balance_at(uuid, timestamptz) to authenticated;
grant execute on function public.finance_fund_balance_at(uuid, timestamptz) to authenticated;

revoke all on function private.enforce_finance_reconciliation_row_mutability() from public, anon, authenticated;
revoke all on function private.enforce_finance_reconciliation_child_mutability() from public, anon, authenticated;
revoke all on function private.guard_finance_entry_closed_period() from public, anon, authenticated;
revoke all on function private.guard_finance_transaction_mutation() from public, anon, authenticated;
