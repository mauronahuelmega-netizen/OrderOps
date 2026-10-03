-- M1.A: durable order-finance exception provenance and lifecycle metadata.

alter table public.order_financials
  add column cancelled_at timestamptz,
  add column cancelled_by uuid;

alter table public.order_financials
  add constraint order_financials_cancelled_by_business_fkey
  foreign key (cancelled_by, business_id)
  references public.profiles(id, business_id)
  on delete set null (cancelled_by);

alter table public.order_financials
  add constraint order_financials_cancellation_metadata_chk check (
    financial_status = 'cancelled'
    or (cancelled_at is null and cancelled_by is null)
  );

alter table public.finance_operations
  drop constraint finance_operations_provenance_chk;

alter table public.finance_operations
  add constraint finance_operations_provenance_chk check (
    (
      operation_type in ('metadata_edit', 'void', 'correction', 'order_payment_reversal')
      and target_operation_id is not null
    )
    or
    (
      operation_type not in ('metadata_edit', 'void', 'correction', 'order_payment_reversal')
      and target_operation_id is null
    )
  );

create unique index finance_operations_one_order_payment_reversal_uidx
  on public.finance_operations(business_id, target_operation_id)
  where operation_type = 'order_payment_reversal';

create type public.finance_order_outflow_kind as enum ('refund', 'payment_reversal');

create table public.finance_order_outflow_allocations (
  operation_id uuid primary key,
  business_id uuid not null,
  order_id uuid not null,
  outflow_kind public.finance_order_outflow_kind not null,
  protected_amount numeric(14, 2) not null default 0,
  released_amount numeric(14, 2) not null default 0,
  total_amount numeric(14, 2) generated always as (
    protected_amount + released_amount
  ) stored,
  created_at timestamptz not null default now(),
  constraint finance_order_outflow_allocations_operation_business_fkey
    foreign key (operation_id, business_id)
    references public.finance_operations(id, business_id),
  constraint finance_order_outflow_allocations_order_business_fkey
    foreign key (order_id, business_id)
    references public.order_financials(order_id, business_id),
  constraint finance_order_outflow_allocations_nonnegative_chk check (
    protected_amount >= 0 and released_amount >= 0
  ),
  constraint finance_order_outflow_allocations_positive_chk check (
    protected_amount + released_amount > 0
  ),
  constraint finance_order_outflow_allocations_operation_business_key
    unique (operation_id, business_id)
);

create index finance_order_outflow_allocations_order_idx
  on public.finance_order_outflow_allocations(business_id, order_id, created_at);

alter table public.finance_order_outflow_allocations enable row level security;

create policy finance_order_outflow_allocations_select_business_member
  on public.finance_order_outflow_allocations
  for select to authenticated
  using (
    business_id = (
      select p.business_id from public.profiles p where p.id = auth.uid()
    )
  );

revoke all on table public.finance_order_outflow_allocations from anon, authenticated;
grant select on table public.finance_order_outflow_allocations to authenticated;
