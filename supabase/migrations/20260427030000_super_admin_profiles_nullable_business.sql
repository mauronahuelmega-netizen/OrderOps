-- Allow super_admin profiles without business_id while keeping admins attached to a business.

alter table public.profiles
  alter column business_id drop not null;

update public.profiles
set business_id = null
where role = 'super_admin';

alter table public.profiles
  drop constraint if exists profiles_role_business_requirement;

alter table public.profiles
  add constraint profiles_role_business_requirement
  check (
    (role = 'admin' and business_id is not null)
    or (role = 'super_admin')
  );
