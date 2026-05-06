-- T2: Esquema de catálogo
-- Alcance:
-- - Tabla categories
-- - Tabla products
-- - business_id en ambas
-- - products.category_id -> categories(id)
-- - products.is_available default true
-- - products.image_url nullable
-- - categories.position opcional
-- - created_at en ambas

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null
    references public.businesses (id)
    on delete restrict,
  name text not null,
  position integer,
  created_at timestamptz not null default timezone('utc', now()),

  constraint categories_name_not_empty
    check (char_length(trim(name)) > 0),
  constraint categories_position_non_negative
    check (position is null or position >= 0),
  constraint categories_id_business_id_unique
    unique (id, business_id)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null
    references public.businesses (id)
    on delete restrict,
  category_id uuid not null,
  name text not null,
  description text,
  price numeric(12, 2) not null,
  image_url text,
  is_available boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),

  constraint products_name_not_empty
    check (char_length(trim(name)) > 0),
  constraint products_price_non_negative
    check (price >= 0),
  constraint products_category_same_business_fk
    foreign key (category_id, business_id)
    references public.categories (id, business_id)
    on delete restrict
);

create index categories_business_id_idx
  on public.categories (business_id);

create index products_business_id_idx
  on public.products (business_id);

create index products_category_id_idx
  on public.products (category_id);
