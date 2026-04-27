-- T3: Esquema de pedidos
-- Alcance:
-- - Tabla orders
-- - Tabla order_items
-- - orders.business_id -> businesses(id)
-- - order_items.order_id -> orders(id)
-- - snapshot en order_items: product_name, unit_price, quantity
-- - product_id nullable
-- - status: pending, in_progress, completed, cancelled
-- - total_price
-- - datos del cliente y entrega

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null
    references public.businesses (id)
    on delete restrict,
  customer_name text not null,
  phone text not null,
  delivery_date date not null,
  delivery_time text,
  delivery_method text not null,
  address text,
  notes text,
  total_price numeric(12, 2) not null,
  status text not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),

  constraint orders_customer_name_not_empty
    check (char_length(trim(customer_name)) > 0),
  constraint orders_phone_not_empty
    check (char_length(trim(phone)) > 0),
  constraint orders_delivery_method_valid
    check (delivery_method in ('delivery', 'pickup')),
  constraint orders_address_required_for_delivery
    check (
      delivery_method <> 'delivery'
      or char_length(trim(coalesce(address, ''))) > 0
    ),
  constraint orders_status_valid
    check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
  constraint orders_total_price_non_negative
    check (total_price >= 0)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null
    references public.orders (id)
    on delete cascade,
  product_id uuid
    references public.products (id)
    on delete set null,
  product_name text not null,
  unit_price numeric(12, 2) not null,
  quantity integer not null,

  constraint order_items_product_name_not_empty
    check (char_length(trim(product_name)) > 0),
  constraint order_items_unit_price_non_negative
    check (unit_price >= 0),
  constraint order_items_quantity_positive
    check (quantity > 0)
);

create index orders_business_id_idx
  on public.orders (business_id);

create index orders_delivery_date_idx
  on public.orders (delivery_date);

create index order_items_order_id_idx
  on public.order_items (order_id);

create index order_items_product_id_idx
  on public.order_items (product_id);
