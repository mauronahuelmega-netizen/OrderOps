-- T9: Evolución operativa de estados de pedidos
-- - in_progress -> preparing
-- - agrega ready
-- - mantiene pending/completed/cancelled

update public.orders
set status = 'preparing'
where status = 'in_progress';

alter table public.orders
  drop constraint if exists orders_status_valid;

alter table public.orders
  add constraint orders_status_valid
    check (status in ('pending', 'preparing', 'ready', 'completed', 'cancelled'));
