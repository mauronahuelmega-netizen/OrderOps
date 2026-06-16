-- Fase 11: SKU y stock operativo en catálogo de productos.

alter table public.products
  add column if not exists sku text,
  add column if not exists stock integer not null default 0;

alter table public.products
  drop constraint if exists products_stock_non_negative;

alter table public.products
  add constraint products_stock_non_negative
    check (stock >= 0);
