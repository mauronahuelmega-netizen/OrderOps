-- ADMIN-ORDER-RESPONSIBILITY-FEATURE-FLAG-1
-- Tenant capability: order assignment / responsibility UI (default OFF for all businesses).

alter table public.business_settings
  add column if not exists order_assignment_enabled boolean not null default false;

comment on column public.business_settings.order_assignment_enabled is
  'Capability por tenant: habilita asignación de responsables en pedidos admin. Default false.';
