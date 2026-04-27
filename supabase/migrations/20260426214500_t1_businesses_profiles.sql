-- T1: Esquema base de negocio y usuarios
-- Alcance:
-- - Tabla businesses
-- - Tabla profiles
-- - UUIDs
-- - profiles.id -> auth.users(id)
-- - profiles.business_id -> businesses(id)
-- - businesses.slug único
-- - created_at en ambas tablas

create extension if not exists pgcrypto;

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  whatsapp_number text not null,
  logo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),

  constraint businesses_slug_unique unique (slug),
  constraint businesses_name_not_empty
    check (char_length(trim(name)) > 0),
  constraint businesses_slug_not_empty
    check (char_length(trim(slug)) > 0),
  constraint businesses_slug_format
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint businesses_whatsapp_number_not_empty
    check (char_length(trim(whatsapp_number)) > 0)
);

create table public.profiles (
  id uuid primary key
    references auth.users (id)
    on delete cascade,
  business_id uuid not null
    references public.businesses (id)
    on delete restrict,
  created_at timestamptz not null default timezone('utc', now())
);

create index profiles_business_id_idx
  on public.profiles (business_id);
