-- Feature flags operativos por tenant (1:1 con businesses via business_id PK/FK)

create table if not exists public.business_settings (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  on_demand_mode_active boolean not null default true,
  scheduled_mode_active boolean not null default false,
  kitchen_mode_active boolean not null default false,
  delivery_mode_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.business_settings enable row level security;

drop policy if exists "business_settings_select_own_business" on public.business_settings;
drop policy if exists "business_settings_update_owner_manager" on public.business_settings;

create policy "business_settings_select_own_business"
  on public.business_settings
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

create policy "business_settings_update_owner_manager"
  on public.business_settings
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.business_id = business_settings.business_id
        and p.role in ('owner', 'manager')
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.business_id = business_settings.business_id
        and p.role in ('owner', 'manager')
    )
  );

create extension if not exists moddatetime schema extensions;

create trigger handle_business_settings_updated_at
  before update on public.business_settings
  for each row
  execute function extensions.moddatetime('updated_at');

create or replace function public.create_default_business_settings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.business_settings (business_id)
  values (new.id);
  return new;
end;
$$;

drop trigger if exists on_business_created_create_settings on public.businesses;

create trigger on_business_created_create_settings
  after insert on public.businesses
  for each row
  execute function public.create_default_business_settings();

-- Backfill para negocios existentes (el trigger solo aplica en INSERT futuros)
insert into public.business_settings (business_id)
select b.id
from public.businesses b
where not exists (
  select 1
  from public.business_settings bs
  where bs.business_id = b.id
);
