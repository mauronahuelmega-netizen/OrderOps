-- PRODUCT-CUSTOMIZATION-DB-1 — Schema, RLS & Types
-- Product Customization V1: grupos, opciones, assignments, overrides, upsell + order_items extensions.
-- Backward-compatible: feature flag default false; create_order sin cambios; pedidos legacy intactos.

-- ---------------------------------------------------------------------------
-- 0) Feature flag (default off)
-- ---------------------------------------------------------------------------

alter table public.business_settings
  add column if not exists product_customization_enabled boolean not null default false;

comment on column public.business_settings.product_customization_enabled is
  'Capability por tenant: habilita Product Customization V1 (opcionales, extras, plus). Default false.';

-- ---------------------------------------------------------------------------
-- 1) order_items extensions (nullable / default-safe)
-- ---------------------------------------------------------------------------

alter table public.order_items
  add column if not exists customization_snapshot jsonb,
  add column if not exists parent_order_item_id uuid,
  add column if not exists item_kind text not null default 'product';

alter table public.order_items
  drop constraint if exists order_items_item_kind_check;

alter table public.order_items
  add constraint order_items_item_kind_check
  check (item_kind in ('product', 'upsell'));

alter table public.order_items
  drop constraint if exists order_items_parent_kind_consistency_check;

alter table public.order_items
  add constraint order_items_parent_kind_consistency_check
  check (
    (item_kind = 'product' and parent_order_item_id is null)
    or (item_kind = 'upsell' and parent_order_item_id is not null)
  );

alter table public.order_items
  drop constraint if exists order_items_snapshot_only_on_product_check;

alter table public.order_items
  add constraint order_items_snapshot_only_on_product_check
  check (
    customization_snapshot is null
    or item_kind = 'product'
  );

alter table public.order_items
  drop constraint if exists order_items_parent_order_item_id_fkey;

alter table public.order_items
  add constraint order_items_parent_order_item_id_fkey
  foreign key (parent_order_item_id)
  references public.order_items (id)
  on delete cascade;

create index if not exists order_items_parent_order_item_id_idx
  on public.order_items (parent_order_item_id);

create index if not exists order_items_item_kind_idx
  on public.order_items (item_kind);

comment on column public.order_items.customization_snapshot is
  'JSONB versionado (v1) con grupos/opciones y pricing histórico. Null = legacy o sin customization.';

comment on column public.order_items.parent_order_item_id is
  'FK self: línea upsell hija apunta al order_item padre. ON DELETE CASCADE.';

comment on column public.order_items.item_kind is
  'product = línea principal; upsell = plus sugerido (producto real hijo).';

-- GIN sobre customization_snapshot omitido en V1 (sin queries JSONB operativas aún).
-- Evaluar en analytics futuro.

-- ---------------------------------------------------------------------------
-- 2) customization_groups
-- ---------------------------------------------------------------------------

create table if not exists public.customization_groups (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null
    references public.businesses (id)
    on delete cascade,
  name text not null,
  description text,
  selection_type text not null,
  is_required boolean not null default false,
  min_selections integer not null default 0,
  max_selections integer,
  is_available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint customization_groups_name_not_empty
    check (char_length(trim(name)) > 0),
  constraint customization_groups_selection_type_check
    check (selection_type in ('single', 'multiple')),
  constraint customization_groups_min_selections_check
    check (min_selections >= 0),
  constraint customization_groups_max_selections_check
    check (max_selections is null or max_selections >= min_selections),
  constraint customization_groups_single_max_check
    check (
      selection_type <> 'single'
      or max_selections is null
      or max_selections <= 1
    ),
  constraint customization_groups_required_min_check
    check (is_required = false or min_selections >= 1),
  constraint customization_groups_id_business_id_unique
    unique (id, business_id)
);

create index if not exists customization_groups_business_id_idx
  on public.customization_groups (business_id);

create index if not exists customization_groups_business_available_idx
  on public.customization_groups (business_id, is_available);

create index if not exists customization_groups_business_sort_idx
  on public.customization_groups (business_id, sort_order);

-- ---------------------------------------------------------------------------
-- 3) customization_options
-- ---------------------------------------------------------------------------

create table if not exists public.customization_options (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null
    references public.businesses (id)
    on delete cascade,
  group_id uuid not null,
  name text not null,
  description text,
  price_delta numeric(12, 2) not null default 0,
  is_available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint customization_options_name_not_empty
    check (char_length(trim(name)) > 0),
  constraint customization_options_price_delta_check
    check (price_delta >= 0),
  constraint customization_options_group_same_business_fk
    foreign key (group_id, business_id)
    references public.customization_groups (id, business_id)
    on delete cascade,
  constraint customization_options_id_business_id_unique
    unique (id, business_id)
);

create index if not exists customization_options_business_id_idx
  on public.customization_options (business_id);

create index if not exists customization_options_group_id_idx
  on public.customization_options (group_id);

create index if not exists customization_options_business_group_idx
  on public.customization_options (business_id, group_id);

create index if not exists customization_options_group_sort_idx
  on public.customization_options (group_id, sort_order);

create index if not exists customization_options_business_available_idx
  on public.customization_options (business_id, is_available);

-- ---------------------------------------------------------------------------
-- 4) customization_group_assignments (polimórfico category|product)
-- ---------------------------------------------------------------------------

create table if not exists public.customization_group_assignments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null
    references public.businesses (id)
    on delete cascade,
  group_id uuid not null,
  target_type text not null,
  target_id uuid not null,
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint customization_group_assignments_target_type_check
    check (target_type in ('category', 'product')),
  constraint customization_group_assignments_group_same_business_fk
    foreign key (group_id, business_id)
    references public.customization_groups (id, business_id)
    on delete cascade,
  constraint customization_group_assignments_unique
    unique (business_id, group_id, target_type, target_id)
);

-- Nota: target_id es polimórfico (categories.id | products.id) — sin FK declarativa.
-- Validación de existencia/tenant queda en server actions (ADMIN-2).

create index if not exists customization_group_assignments_business_id_idx
  on public.customization_group_assignments (business_id);

create index if not exists customization_group_assignments_group_id_idx
  on public.customization_group_assignments (group_id);

create index if not exists customization_group_assignments_target_idx
  on public.customization_group_assignments (business_id, target_type, target_id);

create index if not exists customization_group_assignments_target_enabled_idx
  on public.customization_group_assignments (business_id, target_type, target_id, is_enabled);

-- ---------------------------------------------------------------------------
-- 5) product_customization_overrides
-- ---------------------------------------------------------------------------

create table if not exists public.product_customization_overrides (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null
    references public.businesses (id)
    on delete cascade,
  product_id uuid not null
    references public.products (id)
    on delete cascade,
  override_type text not null,
  group_id uuid,
  option_id uuid,
  is_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint product_customization_overrides_type_check
    check (override_type in ('group', 'option')),
  constraint product_customization_overrides_shape_check
    check (
      (
        override_type = 'group'
        and group_id is not null
        and option_id is null
      )
      or (
        override_type = 'option'
        and option_id is not null
        and group_id is null
      )
    ),
  constraint product_customization_overrides_group_same_business_fk
    foreign key (group_id, business_id)
    references public.customization_groups (id, business_id)
    on delete cascade,
  constraint product_customization_overrides_option_same_business_fk
    foreign key (option_id, business_id)
    references public.customization_options (id, business_id)
    on delete cascade
);

-- Índices únicos parciales (evitan duplicados con NULLs en unique compuesto)
create unique index if not exists product_customization_group_override_unique_idx
  on public.product_customization_overrides (business_id, product_id, group_id)
  where override_type = 'group';

create unique index if not exists product_customization_option_override_unique_idx
  on public.product_customization_overrides (business_id, product_id, option_id)
  where override_type = 'option';

create index if not exists product_customization_overrides_product_idx
  on public.product_customization_overrides (business_id, product_id);

create index if not exists product_customization_overrides_product_type_idx
  on public.product_customization_overrides (business_id, product_id, override_type);

create index if not exists product_customization_overrides_group_id_idx
  on public.product_customization_overrides (group_id);

create index if not exists product_customization_overrides_option_id_idx
  on public.product_customization_overrides (option_id);

comment on column public.product_customization_overrides.is_enabled is
  'V1: false = desactivar grupo/opción heredado para este producto. No hay price/name overrides.';

-- ---------------------------------------------------------------------------
-- 6) upsell_groups (target embebido; max 1 por target)
-- ---------------------------------------------------------------------------

create table if not exists public.upsell_groups (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null
    references public.businesses (id)
    on delete cascade,
  name text not null,
  description text,
  target_type text not null,
  target_id uuid not null,
  is_available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint upsell_groups_name_not_empty
    check (char_length(trim(name)) > 0),
  constraint upsell_groups_target_type_check
    check (target_type in ('category', 'product')),
  constraint upsell_groups_id_business_id_unique
    unique (id, business_id),
  constraint upsell_groups_one_per_target_unique
    unique (business_id, target_type, target_id)
);

-- Nota: target_id polimórfico — sin FK declarativa. Validación en ADMIN-2.

create index if not exists upsell_groups_business_id_idx
  on public.upsell_groups (business_id);

create index if not exists upsell_groups_target_idx
  on public.upsell_groups (business_id, target_type, target_id);

create index if not exists upsell_groups_business_available_idx
  on public.upsell_groups (business_id, is_available);

-- ---------------------------------------------------------------------------
-- 7) upsell_group_items
-- ---------------------------------------------------------------------------

create table if not exists public.upsell_group_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null
    references public.businesses (id)
    on delete cascade,
  upsell_group_id uuid not null,
  product_id uuid not null
    references public.products (id)
    on delete restrict,
  is_available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint upsell_group_items_group_same_business_fk
    foreign key (upsell_group_id, business_id)
    references public.upsell_groups (id, business_id)
    on delete cascade,
  constraint upsell_group_items_unique
    unique (business_id, upsell_group_id, product_id)
);

create index if not exists upsell_group_items_business_id_idx
  on public.upsell_group_items (business_id);

create index if not exists upsell_group_items_group_idx
  on public.upsell_group_items (upsell_group_id);

create index if not exists upsell_group_items_product_idx
  on public.upsell_group_items (product_id);

create index if not exists upsell_group_items_group_available_idx
  on public.upsell_group_items (business_id, upsell_group_id, is_available);

create index if not exists upsell_group_items_group_sort_idx
  on public.upsell_group_items (upsell_group_id, sort_order);

-- Precio del plus: siempre products.price en ORDER-1 — no se duplica aquí.

-- ---------------------------------------------------------------------------
-- 8) updated_at triggers (patrón extensions.moddatetime)
-- ---------------------------------------------------------------------------

create extension if not exists moddatetime schema extensions;

drop trigger if exists handle_customization_groups_updated_at on public.customization_groups;
create trigger handle_customization_groups_updated_at
  before update on public.customization_groups
  for each row
  execute function extensions.moddatetime('updated_at');

drop trigger if exists handle_customization_options_updated_at on public.customization_options;
create trigger handle_customization_options_updated_at
  before update on public.customization_options
  for each row
  execute function extensions.moddatetime('updated_at');

drop trigger if exists handle_customization_group_assignments_updated_at on public.customization_group_assignments;
create trigger handle_customization_group_assignments_updated_at
  before update on public.customization_group_assignments
  for each row
  execute function extensions.moddatetime('updated_at');

drop trigger if exists handle_product_customization_overrides_updated_at on public.product_customization_overrides;
create trigger handle_product_customization_overrides_updated_at
  before update on public.product_customization_overrides
  for each row
  execute function extensions.moddatetime('updated_at');

drop trigger if exists handle_upsell_groups_updated_at on public.upsell_groups;
create trigger handle_upsell_groups_updated_at
  before update on public.upsell_groups
  for each row
  execute function extensions.moddatetime('updated_at');

drop trigger if exists handle_upsell_group_items_updated_at on public.upsell_group_items;
create trigger handle_upsell_group_items_updated_at
  before update on public.upsell_group_items
  for each row
  execute function extensions.moddatetime('updated_at');

-- ---------------------------------------------------------------------------
-- 9) RLS — enable
-- ---------------------------------------------------------------------------

alter table public.customization_groups enable row level security;
alter table public.customization_options enable row level security;
alter table public.customization_group_assignments enable row level security;
alter table public.product_customization_overrides enable row level security;
alter table public.upsell_groups enable row level security;
alter table public.upsell_group_items enable row level security;

-- No se modifican policies de order_items / business_settings existentes
-- (columnas nuevas heredan policies SELECT actuales de order_items).

-- ---------------------------------------------------------------------------
-- 10) RLS — Admin CRUD (mismo patrón products/categories)
-- ---------------------------------------------------------------------------

-- customization_groups
drop policy if exists "customization_groups_select_own_business" on public.customization_groups;
drop policy if exists "customization_groups_insert_own_business" on public.customization_groups;
drop policy if exists "customization_groups_update_own_business" on public.customization_groups;
drop policy if exists "customization_groups_delete_own_business" on public.customization_groups;

create policy "customization_groups_select_own_business"
  on public.customization_groups
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

create policy "customization_groups_insert_own_business"
  on public.customization_groups
  for insert
  to authenticated
  with check (
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

create policy "customization_groups_update_own_business"
  on public.customization_groups
  for update
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
  )
  with check (
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

create policy "customization_groups_delete_own_business"
  on public.customization_groups
  for delete
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

-- customization_options
drop policy if exists "customization_options_select_own_business" on public.customization_options;
drop policy if exists "customization_options_insert_own_business" on public.customization_options;
drop policy if exists "customization_options_update_own_business" on public.customization_options;
drop policy if exists "customization_options_delete_own_business" on public.customization_options;

create policy "customization_options_select_own_business"
  on public.customization_options
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

create policy "customization_options_insert_own_business"
  on public.customization_options
  for insert
  to authenticated
  with check (
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

create policy "customization_options_update_own_business"
  on public.customization_options
  for update
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
  )
  with check (
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

create policy "customization_options_delete_own_business"
  on public.customization_options
  for delete
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

-- customization_group_assignments
drop policy if exists "customization_group_assignments_select_own_business" on public.customization_group_assignments;
drop policy if exists "customization_group_assignments_insert_own_business" on public.customization_group_assignments;
drop policy if exists "customization_group_assignments_update_own_business" on public.customization_group_assignments;
drop policy if exists "customization_group_assignments_delete_own_business" on public.customization_group_assignments;

create policy "customization_group_assignments_select_own_business"
  on public.customization_group_assignments
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

create policy "customization_group_assignments_insert_own_business"
  on public.customization_group_assignments
  for insert
  to authenticated
  with check (
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

create policy "customization_group_assignments_update_own_business"
  on public.customization_group_assignments
  for update
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
  )
  with check (
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

create policy "customization_group_assignments_delete_own_business"
  on public.customization_group_assignments
  for delete
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

-- product_customization_overrides
drop policy if exists "product_customization_overrides_select_own_business" on public.product_customization_overrides;
drop policy if exists "product_customization_overrides_insert_own_business" on public.product_customization_overrides;
drop policy if exists "product_customization_overrides_update_own_business" on public.product_customization_overrides;
drop policy if exists "product_customization_overrides_delete_own_business" on public.product_customization_overrides;

create policy "product_customization_overrides_select_own_business"
  on public.product_customization_overrides
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

create policy "product_customization_overrides_insert_own_business"
  on public.product_customization_overrides
  for insert
  to authenticated
  with check (
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

create policy "product_customization_overrides_update_own_business"
  on public.product_customization_overrides
  for update
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
  )
  with check (
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

create policy "product_customization_overrides_delete_own_business"
  on public.product_customization_overrides
  for delete
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

-- upsell_groups
drop policy if exists "upsell_groups_select_own_business" on public.upsell_groups;
drop policy if exists "upsell_groups_insert_own_business" on public.upsell_groups;
drop policy if exists "upsell_groups_update_own_business" on public.upsell_groups;
drop policy if exists "upsell_groups_delete_own_business" on public.upsell_groups;

create policy "upsell_groups_select_own_business"
  on public.upsell_groups
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

create policy "upsell_groups_insert_own_business"
  on public.upsell_groups
  for insert
  to authenticated
  with check (
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

create policy "upsell_groups_update_own_business"
  on public.upsell_groups
  for update
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
  )
  with check (
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

create policy "upsell_groups_delete_own_business"
  on public.upsell_groups
  for delete
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

-- upsell_group_items
drop policy if exists "upsell_group_items_select_own_business" on public.upsell_group_items;
drop policy if exists "upsell_group_items_insert_own_business" on public.upsell_group_items;
drop policy if exists "upsell_group_items_update_own_business" on public.upsell_group_items;
drop policy if exists "upsell_group_items_delete_own_business" on public.upsell_group_items;

create policy "upsell_group_items_select_own_business"
  on public.upsell_group_items
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

create policy "upsell_group_items_insert_own_business"
  on public.upsell_group_items
  for insert
  to authenticated
  with check (
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

create policy "upsell_group_items_update_own_business"
  on public.upsell_group_items
  for update
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
  )
  with check (
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

create policy "upsell_group_items_delete_own_business"
  on public.upsell_group_items
  for delete
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

-- ---------------------------------------------------------------------------
-- 11) RLS — Public/anon SELECT (solo flag on + business active + available)
-- ---------------------------------------------------------------------------

drop policy if exists "customization_groups_select_available_public" on public.customization_groups;
create policy "customization_groups_select_available_public"
  on public.customization_groups
  for select
  to anon
  using (
    is_available = true
    and exists (
      select 1
      from public.businesses b
      where b.id = customization_groups.business_id
        and b.is_active = true
    )
    and exists (
      select 1
      from public.business_settings bs
      where bs.business_id = customization_groups.business_id
        and bs.product_customization_enabled = true
    )
  );

drop policy if exists "customization_options_select_available_public" on public.customization_options;
create policy "customization_options_select_available_public"
  on public.customization_options
  for select
  to anon
  using (
    is_available = true
    and exists (
      select 1
      from public.customization_groups g
      where g.id = customization_options.group_id
        and g.business_id = customization_options.business_id
        and g.is_available = true
    )
    and exists (
      select 1
      from public.businesses b
      where b.id = customization_options.business_id
        and b.is_active = true
    )
    and exists (
      select 1
      from public.business_settings bs
      where bs.business_id = customization_options.business_id
        and bs.product_customization_enabled = true
    )
  );

drop policy if exists "customization_group_assignments_select_enabled_public" on public.customization_group_assignments;
create policy "customization_group_assignments_select_enabled_public"
  on public.customization_group_assignments
  for select
  to anon
  using (
    is_enabled = true
    and exists (
      select 1
      from public.businesses b
      where b.id = customization_group_assignments.business_id
        and b.is_active = true
    )
    and exists (
      select 1
      from public.business_settings bs
      where bs.business_id = customization_group_assignments.business_id
        and bs.product_customization_enabled = true
    )
  );

drop policy if exists "product_customization_overrides_select_public" on public.product_customization_overrides;
create policy "product_customization_overrides_select_public"
  on public.product_customization_overrides
  for select
  to anon
  using (
    exists (
      select 1
      from public.businesses b
      where b.id = product_customization_overrides.business_id
        and b.is_active = true
    )
    and exists (
      select 1
      from public.business_settings bs
      where bs.business_id = product_customization_overrides.business_id
        and bs.product_customization_enabled = true
    )
  );

drop policy if exists "upsell_groups_select_available_public" on public.upsell_groups;
create policy "upsell_groups_select_available_public"
  on public.upsell_groups
  for select
  to anon
  using (
    is_available = true
    and exists (
      select 1
      from public.businesses b
      where b.id = upsell_groups.business_id
        and b.is_active = true
    )
    and exists (
      select 1
      from public.business_settings bs
      where bs.business_id = upsell_groups.business_id
        and bs.product_customization_enabled = true
    )
  );

drop policy if exists "upsell_group_items_select_available_public" on public.upsell_group_items;
create policy "upsell_group_items_select_available_public"
  on public.upsell_group_items
  for select
  to anon
  using (
    is_available = true
    and exists (
      select 1
      from public.upsell_groups ug
      where ug.id = upsell_group_items.upsell_group_id
        and ug.business_id = upsell_group_items.business_id
        and ug.is_available = true
    )
    and exists (
      select 1
      from public.products p
      where p.id = upsell_group_items.product_id
        and p.business_id = upsell_group_items.business_id
        and p.is_available = true
    )
    and exists (
      select 1
      from public.businesses b
      where b.id = upsell_group_items.business_id
        and b.is_active = true
    )
    and exists (
      select 1
      from public.business_settings bs
      where bs.business_id = upsell_group_items.business_id
        and bs.product_customization_enabled = true
    )
  );
