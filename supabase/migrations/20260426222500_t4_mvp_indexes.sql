-- T4: Índices y constraints del MVP
-- Alcance:
-- - Agregar índices faltantes para queries operativas reales
-- - Revisar constraints existentes sin modificar estructura de tablas

create index orders_business_id_delivery_date_idx
  on public.orders (business_id, delivery_date);
