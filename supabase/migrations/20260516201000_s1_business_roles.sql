-- Expand business admin roles beyond legacy admin while preserving super_admin.

alter table public.profiles
  drop constraint if exists profiles_role_valid;

alter table public.profiles
  add constraint profiles_role_valid
  check (role in ('admin', 'owner', 'manager', 'operator', 'viewer', 'super_admin'));

alter table public.profiles
  drop constraint if exists profiles_role_business_requirement;

alter table public.profiles
  add constraint profiles_role_business_requirement
  check (
    (role in ('admin', 'owner', 'manager', 'operator', 'viewer') and business_id is not null)
    or (role = 'super_admin')
  );
