-- Optional 1:1 financial extension of the canonical OrderOps order.

create type public.order_financial_status as enum (
  'open',
  'settled',
  'cancelled'
);

alter table public.orders
  add constraint orders_id_business_id_key unique (id, business_id);

alter table public.profiles
  add constraint profiles_id_business_id_key unique (id, business_id);

create table public.order_financials (
  order_id uuid primary key,
  business_id uuid not null,
  agreed_total numeric(14, 2),
  financial_status public.order_financial_status not null default 'open',
  settled_at timestamptz,
  settled_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint order_financials_order_business_fkey
    foreign key (order_id, business_id)
    references public.orders(id, business_id)
    on delete cascade,
  constraint order_financials_order_business_key
    unique (order_id, business_id),
  constraint order_financials_settled_by_business_fkey
    foreign key (settled_by, business_id)
    references public.profiles(id, business_id)
    on delete set null (settled_by),
  constraint order_financials_agreed_total_positive_chk
    check (agreed_total is null or agreed_total > 0),
  constraint order_financials_settlement_metadata_chk
    check (
      financial_status = 'settled'
      or (settled_at is null and settled_by is null)
    )
);

create index order_financials_business_id_idx
  on public.order_financials(business_id);

create trigger handle_order_financials_updated_at
  before update on public.order_financials
  for each row
  execute function extensions.moddatetime('updated_at');
