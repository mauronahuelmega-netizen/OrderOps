-- Phase 3B: tenant-safe reconciliation read model. Open values are dynamic;
-- closed values and fund snapshots are frozen.

create or replace function public.finance_reconciliation_summary(
  p_reconciliation_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid := auth.uid();
  v_reconciliation public.finance_reconciliations%rowtype;
  v_account public.finance_accounts%rowtype;
  v_expected numeric(14, 2);
  v_previous_cutoff timestamptz;
  v_included bigint;
  v_pending bigint;
  v_snapshots jsonb;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select r.* into v_reconciliation
  from public.finance_reconciliations r
  join public.profiles p
    on p.business_id = r.business_id and p.id = v_uid
  where r.id = p_reconciliation_id;
  if not found then
    raise exception 'reconciliation not found' using errcode = '22023';
  end if;

  perform private.require_finance_permission(v_reconciliation.business_id, 'read');
  select * into strict v_account
  from public.finance_accounts
  where id = v_reconciliation.account_id
    and business_id = v_reconciliation.business_id;

  select max(r.cutoff_at) into v_previous_cutoff
  from public.finance_reconciliations r
  where r.business_id = v_reconciliation.business_id
    and r.account_id = v_reconciliation.account_id
    and r.status = 'closed'
    and r.id <> v_reconciliation.id
    and r.cutoff_at < v_reconciliation.cutoff_at;

  v_included := private.finance_reconciliation_included_entry_count(
    v_reconciliation.business_id, v_reconciliation.id
  );
  if v_reconciliation.status = 'open' then
    v_expected := private.finance_account_balance_at(
      v_reconciliation.business_id,
      v_reconciliation.account_id,
      v_reconciliation.cutoff_at
    );
    v_pending := private.finance_reconciliation_pending_entry_count(
      v_reconciliation.business_id, v_reconciliation.id
    );
    v_snapshots := '[]'::jsonb;
  else
    v_expected := v_reconciliation.system_balance;
    v_pending := 0;
    select coalesce(jsonb_agg(jsonb_build_object(
      'fund_id', s.fund_id,
      'fund_name', f.name,
      'fund_type', f.fund_type,
      'balance', s.balance
    ) order by f.sort_order, f.id), '[]'::jsonb)
    into v_snapshots
    from public.finance_reconciliation_fund_snapshots s
    join public.finance_funds f
      on f.id = s.fund_id and f.business_id = s.business_id
    where s.business_id = v_reconciliation.business_id
      and s.reconciliation_id = v_reconciliation.id;
  end if;

  return jsonb_build_object(
    'id', v_reconciliation.id,
    'business_id', v_reconciliation.business_id,
    'account_id', v_account.id,
    'account_name', v_account.name,
    'account_kind', v_account.kind,
    'status', v_reconciliation.status,
    'cutoff_at', v_reconciliation.cutoff_at,
    'previous_cutoff', v_previous_cutoff,
    'period_start_exclusive', v_previous_cutoff,
    'statement_balance', v_reconciliation.statement_balance,
    'expected_balance', v_expected,
    'difference', v_reconciliation.statement_balance - v_expected,
    'included_entry_count', v_included,
    'pending_entry_count', v_pending,
    'opened_at', v_reconciliation.opened_at,
    'opened_by', v_reconciliation.opened_by,
    'closed_at', v_reconciliation.closed_at,
    'closed_by', v_reconciliation.closed_by,
    'note', v_reconciliation.note,
    'fund_snapshots', v_snapshots
  );
end;
$$;

create or replace function public.finance_account_balance_at(
  p_account_id uuid,
  p_cutoff_at timestamptz
)
returns numeric
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid := auth.uid();
  v_business_id uuid;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  select a.business_id into v_business_id
  from public.finance_accounts a
  join public.profiles p on p.business_id = a.business_id and p.id = v_uid
  where a.id = p_account_id;
  if not found then raise exception 'account not found' using errcode = '22023'; end if;
  perform private.require_finance_permission(v_business_id, 'read');
  return private.finance_account_balance_at(v_business_id, p_account_id, p_cutoff_at);
end;
$$;

create or replace function public.finance_fund_balance_at(
  p_fund_id uuid,
  p_cutoff_at timestamptz
)
returns numeric
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_uid uuid := auth.uid();
  v_business_id uuid;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  select f.business_id into v_business_id
  from public.finance_funds f
  join public.profiles p on p.business_id = f.business_id and p.id = v_uid
  where f.id = p_fund_id;
  if not found then raise exception 'fund not found' using errcode = '22023'; end if;
  perform private.require_finance_permission(v_business_id, 'read');
  return private.finance_fund_balance_at(v_business_id, p_fund_id, p_cutoff_at);
end;
$$;
