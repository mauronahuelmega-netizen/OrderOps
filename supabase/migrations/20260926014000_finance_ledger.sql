-- Empty immutable-by-client ledger structure. Commercial RPCs are intentionally absent.

create type public.finance_operation_type as enum (
  'income',
  'expense',
  'transfer',
  'adjustment',
  'opening_balance',
  'deposit',
  'historical_deposit',
  'order_payment',
  'release_deposit',
  'void',
  'correction'
);

create type public.finance_transaction_status as enum ('posted', 'voided');
create type public.finance_entry_direction as enum ('in', 'out');

create table public.finance_operations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  operation_type public.finance_operation_type not null,
  client_request_id uuid not null,
  request_hash text not null,
  note text,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  constraint finance_operations_request_hash_not_empty_chk
    check (char_length(trim(request_hash)) > 0),
  constraint finance_operations_created_by_business_fkey
    foreign key (created_by, business_id)
    references public.profiles(id, business_id),
  constraint finance_operations_business_request_key unique (business_id, client_request_id),
  constraint finance_operations_id_business_key unique (id, business_id)
);

create table public.finance_transactions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  operation_id uuid not null,
  status public.finance_transaction_status not null default 'posted',
  area public.finance_category_area,
  category_id uuid,
  order_id uuid,
  occurred_at timestamptz not null default now(),
  note text,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint finance_transactions_operation_business_fkey
    foreign key (operation_id, business_id)
    references public.finance_operations(id, business_id) on delete cascade,
  constraint finance_transactions_created_by_business_fkey
    foreign key (created_by, business_id)
    references public.profiles(id, business_id),
  constraint finance_transactions_category_business_fkey
    foreign key (category_id, business_id)
    references public.finance_categories(id, business_id),
  constraint finance_transactions_order_business_fkey
    foreign key (order_id, business_id)
    references public.order_financials(order_id, business_id),
  constraint finance_transactions_id_business_key unique (id, business_id)
);

create table public.finance_transaction_entries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  transaction_id uuid not null,
  fund_id uuid not null,
  direction public.finance_entry_direction not null,
  amount numeric(14, 2) not null,
  created_at timestamptz not null default now(),
  constraint finance_transaction_entries_transaction_business_fkey
    foreign key (transaction_id, business_id)
    references public.finance_transactions(id, business_id) on delete cascade,
  constraint finance_transaction_entries_fund_business_fkey
    foreign key (fund_id, business_id)
    references public.finance_funds(id, business_id),
  constraint finance_transaction_entries_amount_positive_chk check (amount > 0),
  constraint finance_transaction_entries_id_business_key unique (id, business_id),
  constraint finance_transaction_entries_id_transaction_business_key
    unique (id, transaction_id, business_id)
);

create table public.finance_audit_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  actor_id uuid,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint finance_audit_events_event_type_not_empty_chk
    check (char_length(trim(event_type)) > 0),
  constraint finance_audit_events_actor_business_fkey
    foreign key (actor_id, business_id)
    references public.profiles(id, business_id)
    on delete set null (actor_id),
  constraint finance_audit_events_entity_type_not_empty_chk
    check (char_length(trim(entity_type)) > 0)
);

create index finance_operations_business_created_idx
  on public.finance_operations(business_id, created_at desc);
create index finance_transactions_business_occurred_idx
  on public.finance_transactions(business_id, occurred_at desc);
create index finance_transactions_operation_idx on public.finance_transactions(operation_id);
create index finance_transactions_order_idx on public.finance_transactions(order_id) where order_id is not null;
create index finance_transaction_entries_transaction_idx on public.finance_transaction_entries(transaction_id);
create index finance_transaction_entries_fund_idx on public.finance_transaction_entries(fund_id);
create index finance_audit_events_business_created_idx
  on public.finance_audit_events(business_id, created_at desc);

create trigger handle_finance_transactions_updated_at
  before update on public.finance_transactions
  for each row execute function extensions.moddatetime('updated_at');
