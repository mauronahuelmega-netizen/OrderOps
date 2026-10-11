-- P04-T03. The live category insert trigger authorizes the caller before assigning position.
-- Owner, manager, admin and super_admin checks stay as they are.
-- A promoter with an active, unexpired onboarding grant for that business may insert a category.

create or replace function public.categories_assign_append_position()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_role text;
  v_profile_business_id uuid;
  v_grant boolean := false;
begin
  if v_uid is null then
    raise exception 'CATEGORY_ORDER_APPEND_UNAUTHORIZED'
      using errcode = '42501';
  end if;

  select p.role, p.business_id
    into v_role, v_profile_business_id
  from public.profiles p
  where p.id = v_uid;

  if exists (
    select 1
    from commercial.onboarding_grants g
    where g.promoter_id = commercial.current_promoter_id()
      and g.business_id = new.business_id
      and g.status = 'active'
      and g.ends_at > pg_catalog.now()
  ) then
    v_grant := true;
  end if;

  if not v_grant then
    if v_role is null then
      raise exception 'CATEGORY_ORDER_APPEND_UNAUTHORIZED'
        using errcode = '42501';
    end if;

    if v_role in ('owner', 'admin', 'manager') then
      if v_profile_business_id is null
         or v_profile_business_id is distinct from new.business_id then
        raise exception 'CATEGORY_ORDER_APPEND_FORBIDDEN'
          using errcode = '42501';
      end if;
    elsif v_role = 'super_admin' then
      null;
    else
      raise exception 'CATEGORY_ORDER_APPEND_FORBIDDEN'
        using errcode = '42501';
    end if;
  end if;

  perform 1
  from public.businesses b
  where b.id = new.business_id
  for update;

  if not found then
    raise exception 'CATEGORY_ORDER_APPEND_BUSINESS_NOT_FOUND'
      using errcode = 'P0001';
  end if;

  select coalesce(max(c.position), -1) + 1
    into new.position
  from public.categories c
  where c.business_id = new.business_id;

  return new;
end;
$$;
