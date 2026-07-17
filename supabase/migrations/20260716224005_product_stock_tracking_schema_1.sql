-- PRODUCT-STOCK-TRACKING-SCHEMA-1
-- Hybrid inventory: opt-in stock tracking per product.
-- Default false preserves legacy manual availability (is_available) behavior.
-- Does NOT modify create_order, triggers, stock values, or is_available.

alter table public.products
  add column if not exists track_stock boolean not null default false;

comment on column public.products.track_stock is
  'When true, future order creation flows must validate and decrement stock transactionally. Default false preserves legacy manual availability behavior.';
