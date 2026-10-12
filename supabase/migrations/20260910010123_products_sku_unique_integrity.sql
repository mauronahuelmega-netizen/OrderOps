-- ADMIN-PRODUCTS-SKU-DATA-INTEGRITY-1
-- Exact uniqueness for non-null SKUs per business. Multiple NULL SKUs remain allowed.
-- DDL only: no backfill, no RLS, no triggers.

create unique index if not exists products_business_sku_uidx
  on public.products (business_id, sku)
  where sku is not null;
