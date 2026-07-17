-- PRODUCT-STOCK-MOVEMENTS-SCHEMA-1
-- Ledger for auditable, idempotent stock movements (decrement / restock / manual).
-- Schema-only: does NOT modify create_order, updateOrderStatusAction, stock values, or insert rows.

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null references public.businesses(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,

  order_id uuid null references public.orders(id) on delete set null,
  order_item_id uuid null references public.order_items(id) on delete set null,

  movement_type text not null,
  quantity_delta integer not null,

  stock_before integer not null,
  stock_after integer not null,

  reason text null,
  metadata jsonb not null default '{}'::jsonb,

  created_by uuid null,
  created_at timestamptz not null default now(),

  constraint stock_movements_movement_type_check
    check (movement_type in ('order_decrement', 'order_restock', 'manual_adjustment')),

  constraint stock_movements_quantity_delta_nonzero_check
    check (quantity_delta <> 0),

  constraint stock_movements_quantity_delta_direction_check
    check (
      (movement_type = 'order_decrement' and quantity_delta < 0)
      or (movement_type = 'order_restock' and quantity_delta > 0)
      or (movement_type = 'manual_adjustment' and quantity_delta <> 0)
    ),

  constraint stock_movements_stock_math_check
    check (stock_after = stock_before + quantity_delta),

  constraint stock_movements_stock_nonnegative_check
    check (stock_before >= 0 and stock_after >= 0),

  constraint stock_movements_order_context_check
    check (
      (
        movement_type in ('order_decrement', 'order_restock')
        and order_id is not null
        and order_item_id is not null
      )
      or movement_type = 'manual_adjustment'
    )
);

comment on table public.stock_movements is
  'Ledger of stock changes for tracked products. Used for auditability and idempotent order decrement/restock flows.';

comment on column public.stock_movements.movement_type is
  'Allowed values: order_decrement, order_restock, manual_adjustment.';

comment on column public.stock_movements.quantity_delta is
  'Signed stock delta. Negative for order_decrement, positive for order_restock.';

comment on column public.stock_movements.metadata is
  'Additional structured context for future stock movement flows.';

create index if not exists stock_movements_business_created_at_idx
  on public.stock_movements (business_id, created_at desc);

create index if not exists stock_movements_product_created_at_idx
  on public.stock_movements (product_id, created_at desc);

create index if not exists stock_movements_order_idx
  on public.stock_movements (order_id);

create index if not exists stock_movements_order_item_idx
  on public.stock_movements (order_item_id);

create index if not exists stock_movements_movement_type_idx
  on public.stock_movements (movement_type);

create unique index if not exists stock_movements_order_item_decrement_once_idx
  on public.stock_movements (order_item_id)
  where movement_type = 'order_decrement'
    and order_item_id is not null;

create unique index if not exists stock_movements_order_item_restock_once_idx
  on public.stock_movements (order_item_id)
  where movement_type = 'order_restock'
    and order_item_id is not null;

alter table public.stock_movements enable row level security;

drop policy if exists "stock_movements_select_own_business" on public.stock_movements;

-- Read-only for tenant members (+ super_admin). Writes deferred to SECURITY DEFINER / service role in later phases.
create policy "stock_movements_select_own_business"
  on public.stock_movements
  for select
  to authenticated
  using (
    business_id = (
      select p.business_id
      from public.profiles p
      where p.id = auth.uid()
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'super_admin'
    )
  );
