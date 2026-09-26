-- Phase 1A: additive shared-core contract. This migration is safe before the
-- nullable-aware application deploy: orders.total_price remains NOT NULL.

create schema if not exists private;

create type public.order_composition_status as enum (
  'itemized',
  'legacy_unknown'
);

create or replace function private.is_valid_iana_timezone(p_timezone text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select p_timezone is null
    or exists (
      select 1
      from pg_catalog.pg_timezone_names
      where name = p_timezone
    );
$$;

revoke all on function private.is_valid_iana_timezone(text) from public;
grant execute on function private.is_valid_iana_timezone(text) to authenticated, service_role;

alter table public.business_settings
  add column timezone text,
  add column finance_enabled boolean not null default false;

alter table public.business_settings
  add constraint business_settings_timezone_iana_chk
    check (private.is_valid_iana_timezone(timezone)),
  add constraint business_settings_finance_requires_timezone_chk
    check (finance_enabled = false or timezone is not null);

alter table public.orders
  add column composition_status public.order_composition_status
    not null default 'itemized';

do $$
begin
  if exists (
    select 1 from public.business_settings where finance_enabled = true
  ) then
    raise exception 'Phase 1A requires finance_enabled=false for every business';
  end if;

  if exists (
    select 1
    from public.business_settings
    where timezone is not null
      and not private.is_valid_iana_timezone(timezone)
  ) then
    raise exception 'Phase 1A found an invalid configured IANA timezone';
  end if;

  if exists (
    select 1
    from public.orders
    where composition_status <> 'itemized'
       or total_price is null
  ) then
    raise exception 'Existing orders must be itemized with a non-null total_price';
  end if;
end;
$$;
