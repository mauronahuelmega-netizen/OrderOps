-- Empty finance foundation. No tenant configuration or financial rows are seeded.

create type public.finance_account_kind as enum (
  'mercado_pago', 'naranja_x', 'cash', 'other'
);

create type public.finance_fund_type as enum (
  'business_operating',
  'business_capital',
  'family',
  'committed',
  'protected_reserve'
);

create type public.finance_area_hint as enum ('business', 'family');
create type public.finance_category_area as enum ('business', 'family');
create type public.finance_category_kind as enum ('income', 'expense', 'transfer');

create table public.finance_accounts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  kind public.finance_account_kind not null default 'other',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint finance_accounts_name_not_empty_chk check (char_length(trim(name)) > 0),
  constraint finance_accounts_business_name_key unique (business_id, name),
  constraint finance_accounts_id_business_key unique (id, business_id)
);

create table public.finance_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  area public.finance_category_area not null,
  kind public.finance_category_kind not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint finance_categories_name_not_empty_chk check (char_length(trim(name)) > 0),
  constraint finance_categories_business_name_area_kind_key
    unique (business_id, name, area, kind),
  constraint finance_categories_id_business_key unique (id, business_id)
);

create table public.finance_funds (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  account_id uuid not null,
  name text not null,
  fund_type public.finance_fund_type not null,
  area_hint public.finance_area_hint not null,
  order_id uuid,
  active boolean not null default true,
  requires_strong_confirmation boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint finance_funds_account_business_fkey
    foreign key (account_id, business_id)
    references public.finance_accounts(id, business_id),
  constraint finance_funds_order_business_fkey
    foreign key (order_id, business_id)
    references public.order_financials(order_id, business_id),
  constraint finance_funds_name_not_empty_chk check (char_length(trim(name)) > 0),
  constraint finance_funds_committed_requires_order_chk
    check (fund_type <> 'committed' or order_id is not null),
  constraint finance_funds_business_capital_area_chk
    check (fund_type <> 'business_capital' or area_hint = 'business'),
  constraint finance_funds_id_business_key unique (id, business_id)
);

create unique index finance_funds_one_active_committed_per_order_uidx
  on public.finance_funds(order_id)
  where fund_type = 'committed' and active = true and order_id is not null;

create index finance_accounts_business_id_idx on public.finance_accounts(business_id);
create index finance_categories_business_id_idx on public.finance_categories(business_id);
create index finance_funds_business_id_idx on public.finance_funds(business_id);
create index finance_funds_account_id_idx on public.finance_funds(account_id);
create index finance_funds_order_id_idx on public.finance_funds(order_id) where order_id is not null;

create trigger handle_finance_accounts_updated_at
  before update on public.finance_accounts
  for each row execute function extensions.moddatetime('updated_at');

create trigger handle_finance_categories_updated_at
  before update on public.finance_categories
  for each row execute function extensions.moddatetime('updated_at');

create trigger handle_finance_funds_updated_at
  before update on public.finance_funds
  for each row execute function extensions.moddatetime('updated_at');
