-- Expansión operativa de business_settings para Modo Scheduled

alter table public.business_settings
  add column if not exists scheduled_min_lead_time_hours integer not null default 24,
  add column if not exists scheduled_max_days_in_advance integer not null default 30,
  add column if not exists scheduled_cutoff_time time without time zone not null default '18:00:00',
  add column if not exists inactive_working_days integer[] not null default '{}';

comment on column public.business_settings.scheduled_min_lead_time_hours is
  'Horas mínimas de anticipación requeridas para un pedido programado.';

comment on column public.business_settings.scheduled_max_days_in_advance is
  'Ventana máxima a futuro en días para pedidos programados.';

comment on column public.business_settings.scheduled_cutoff_time is
  'Hora límite de corte para pedidos del día siguiente.';

comment on column public.business_settings.inactive_working_days is
  'Array de enteros [0-6] donde 0=Domingo, 1=Lunes, representando días sin operación física.';
