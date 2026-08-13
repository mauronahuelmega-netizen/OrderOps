-- PUBLIC-CATALOG-CUSTOMIZATION-MULTI-QUANTITY-EXTRAS-SCHEMA-ADMIN-IMPL-1
-- Quantity-enabled option groups: schema columns for admin config.
-- Defaults preserve current binary behavior (allows_option_quantity=false, max_quantity=1).
-- No data backfill / no auto-enable / no public behavior / no RLS changes.

-- ---------------------------------------------------------------------------
-- customization_groups
-- ---------------------------------------------------------------------------

alter table public.customization_groups
  add column if not exists allows_option_quantity boolean not null default false,
  add column if not exists max_total_quantity integer;

comment on column public.customization_groups.allows_option_quantity is
  'When true and selection_type=multiple, options may be chosen with quantity > 1. Default false (binary checkbox).';

comment on column public.customization_groups.max_total_quantity is
  'Cap on total option units for quantity-enabled groups. Null when quantity disabled. Admin requires >=1 when enabled.';

alter table public.customization_groups
  drop constraint if exists customization_groups_max_total_quantity_positive;

alter table public.customization_groups
  add constraint customization_groups_max_total_quantity_positive
  check (max_total_quantity is null or max_total_quantity >= 1);

-- ---------------------------------------------------------------------------
-- customization_options
-- ---------------------------------------------------------------------------

alter table public.customization_options
  add column if not exists max_quantity integer not null default 1;

comment on column public.customization_options.max_quantity is
  'Per-option quantity cap for quantity-enabled groups. Default 1 preserves binary selection.';

alter table public.customization_options
  drop constraint if exists customization_options_max_quantity_positive;

alter table public.customization_options
  add constraint customization_options_max_quantity_positive
  check (max_quantity >= 1);
