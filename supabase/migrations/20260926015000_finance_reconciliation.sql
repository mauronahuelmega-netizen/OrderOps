-- Empty reconciliation structure. Reconciliation RPCs arrive in a later phase.

create type public.finance_reconciliation_status as enum ('open', 'closed');

create table public.finance_reconciliations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  account_id uuid not null,
  status public.finance_reconciliation_status not null default 'open',
  statement_balance numeric(14, 2) not null default 0,
  system_balance numeric(14, 2),
  note text,
  opened_by uuid not null,
  closed_by uuid,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint finance_reconciliations_account_business_fkey
    foreign key (account_id, business_id)
    references public.finance_accounts(id, business_id),
  constraint finance_reconciliations_opened_by_business_fkey
    foreign key (opened_by, business_id)
    references public.profiles(id, business_id),
  constraint finance_reconciliations_closed_by_business_fkey
    foreign key (closed_by, business_id)
    references public.profiles(id, business_id)
    on delete set null (closed_by),
  constraint finance_reconciliations_open_metadata_chk
    check (status = 'closed' or (closed_by is null and closed_at is null)),
  constraint finance_reconciliations_id_business_key unique (id, business_id)
);

create table public.finance_reconciliation_fund_snapshots (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  reconciliation_id uuid not null,
  fund_id uuid not null,
  balance numeric(14, 2) not null,
  constraint finance_reconciliation_snapshots_reconciliation_business_fkey
    foreign key (reconciliation_id, business_id)
    references public.finance_reconciliations(id, business_id) on delete cascade,
  constraint finance_reconciliation_snapshots_fund_business_fkey
    foreign key (fund_id, business_id)
    references public.finance_funds(id, business_id),
  constraint finance_reconciliation_snapshots_reconciliation_fund_key
    unique (reconciliation_id, fund_id)
);

create table public.finance_reconciliation_entries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  reconciliation_id uuid not null,
  transaction_id uuid not null,
  entry_id uuid not null,
  constraint finance_reconciliation_entries_reconciliation_business_fkey
    foreign key (reconciliation_id, business_id)
    references public.finance_reconciliations(id, business_id) on delete cascade,
  constraint finance_reconciliation_entries_transaction_business_fkey
    foreign key (transaction_id, business_id)
    references public.finance_transactions(id, business_id),
  constraint finance_reconciliation_entries_entry_transaction_business_fkey
    foreign key (entry_id, transaction_id, business_id)
    references public.finance_transaction_entries(id, transaction_id, business_id),
  constraint finance_reconciliation_entries_reconciliation_entry_key
    unique (reconciliation_id, entry_id)
);

create index finance_reconciliations_business_opened_idx
  on public.finance_reconciliations(business_id, opened_at desc);
create index finance_reconciliation_snapshots_reconciliation_idx
  on public.finance_reconciliation_fund_snapshots(reconciliation_id);
create index finance_reconciliation_entries_reconciliation_idx
  on public.finance_reconciliation_entries(reconciliation_id);
create index finance_reconciliation_entries_transaction_idx
  on public.finance_reconciliation_entries(transaction_id);
