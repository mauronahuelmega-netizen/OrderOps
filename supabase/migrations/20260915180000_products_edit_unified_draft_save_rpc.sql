-- ADMIN-PRODUCTS-EDIT-UNIFIED-DRAFT-SAVE-CONTRACT-DB-AUTHOR-1
-- Atomic Save RPC for future unified Edit Product draft.
--
-- Security mode: SECURITY INVOKER (not DEFINER).
-- Reason: products mutative RLS already role-gates owner/admin/manager
-- (20260909040000_products_manage_role_rls.sql). Override mutations are
-- tenant-scoped under RLS. A single PL/pgSQL function provides the
-- transaction boundary under the caller's privileges — DEFINER is not
-- required for atomicity and is not used here.
--
-- Category: persisted products.category_id is read-only context.
-- This function NEVER accepts or writes a category reassignment.
--
-- Storage: not touched. Only products.image_url reference semantics.
-- Stock/availability: normal UPDATE so tr_auto_suspend_out_of_stock fires.
-- SKU: products_business_sku_uidx remains authority.
-- RLS: unchanged. No backfill. No data mutations at migration time.

create function public.save_product_edit_draft(
  p_product_id uuid,
  p_name text,
  p_description text,
  p_price numeric,
  p_sku text,
  p_stock integer,
  p_is_available boolean,
  p_track_stock boolean,
  p_image_intent text,
  p_image_url text,
  p_hidden_group_ids uuid[],
  p_hidden_option_ids uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
volatile
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_profile_business_id uuid;
  v_business_id uuid;
  v_category_id uuid;
  v_name text;
  v_description text;
  v_sku text;
  v_effective_available boolean;
  v_image_intent text;
  v_image_url text;
  v_hidden_group_ids uuid[];
  v_hidden_option_ids uuid[];
  v_bad_group uuid;
  v_bad_option uuid;
  v_legacy_count integer;
begin
  if v_uid is null then
    raise exception 'SAVE_PRODUCT_EDIT_DRAFT_UNAUTHORIZED'
      using errcode = '42501';
  end if;

  select p.role, p.business_id
    into v_role, v_profile_business_id
  from public.profiles p
  where p.id = v_uid;

  if v_role is null then
    raise exception 'SAVE_PRODUCT_EDIT_DRAFT_UNAUTHORIZED'
      using errcode = '42501';
  end if;

  -- Defense in depth (mirrors canManageProducts / products mutative RLS allow-list).
  -- RLS remains authoritative for table writes under INVOKER.
  if v_role not in ('owner', 'admin', 'manager', 'super_admin') then
    raise exception 'SAVE_PRODUCT_EDIT_DRAFT_FORBIDDEN'
      using errcode = '42501';
  end if;

  if p_product_id is null then
    raise exception 'SAVE_PRODUCT_EDIT_DRAFT_INVALID_INPUT: product_id required'
      using errcode = '22023';
  end if;

  if p_is_available is null or p_track_stock is null then
    raise exception 'SAVE_PRODUCT_EDIT_DRAFT_INVALID_INPUT: availability flags required'
      using errcode = '22023';
  end if;

  if p_hidden_group_ids is null or p_hidden_option_ids is null then
    raise exception 'SAVE_PRODUCT_EDIT_DRAFT_INVALID_INPUT: hidden id arrays required (use empty arrays)'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from unnest(p_hidden_group_ids) as g(id)
    where g.id is null
  ) or exists (
    select 1
    from unnest(p_hidden_option_ids) as o(id)
    where o.id is null
  ) then
    raise exception 'SAVE_PRODUCT_EDIT_DRAFT_INVALID_INPUT: hidden id arrays must not contain null'
      using errcode = '22023';
  end if;

  select array_agg(distinct g.id)
    into v_hidden_group_ids
  from unnest(p_hidden_group_ids) as g(id);

  select array_agg(distinct o.id)
    into v_hidden_option_ids
  from unnest(p_hidden_option_ids) as o(id);

  v_hidden_group_ids := coalesce(v_hidden_group_ids, '{}'::uuid[]);
  v_hidden_option_ids := coalesce(v_hidden_option_ids, '{}'::uuid[]);

  v_name := nullif(btrim(coalesce(p_name, '')), '');
  if v_name is null then
    raise exception 'SAVE_PRODUCT_EDIT_DRAFT_INVALID_INPUT: name required'
      using errcode = '22023';
  end if;

  if p_price is null or p_price < 0 or p_price <> p_price then
    raise exception 'SAVE_PRODUCT_EDIT_DRAFT_INVALID_INPUT: price invalid'
      using errcode = '22023';
  end if;

  if p_stock is null or p_stock < 0 then
    raise exception 'SAVE_PRODUCT_EDIT_DRAFT_INVALID_INPUT: stock invalid'
      using errcode = '22023';
  end if;

  v_sku := nullif(btrim(coalesce(p_sku, '')), '');
  v_description := nullif(btrim(coalesce(p_description, '')), '');

  v_image_intent := lower(btrim(coalesce(p_image_intent, '')));
  if v_image_intent not in ('keep', 'replace', 'remove') then
    raise exception 'SAVE_PRODUCT_EDIT_DRAFT_INVALID_INPUT: image_intent must be keep|replace|remove'
      using errcode = '22023';
  end if;

  v_image_url := nullif(btrim(coalesce(p_image_url, '')), '');
  if v_image_intent = 'replace' and v_image_url is null then
    raise exception 'SAVE_PRODUCT_EDIT_DRAFT_INVALID_INPUT: replace requires image_url'
      using errcode = '22023';
  end if;

  -- Lock product row; establish persisted business + category context.
  select pr.business_id, pr.category_id
    into v_business_id, v_category_id
  from public.products pr
  where pr.id = p_product_id
  for update;

  if v_business_id is null then
    raise exception 'SAVE_PRODUCT_EDIT_DRAFT_PRODUCT_NOT_FOUND'
      using errcode = 'P0002';
  end if;

  if v_role <> 'super_admin'
     and (v_profile_business_id is null or v_profile_business_id <> v_business_id) then
    raise exception 'SAVE_PRODUCT_EDIT_DRAFT_PRODUCT_NOT_FOUND'
      using errcode = 'P0002';
  end if;

  -- Soft REPLACE URL tenancy check (Server Action still owns Storage path authority).
  if v_image_intent = 'replace'
     and position(v_business_id::text in v_image_url) = 0 then
    raise exception 'SAVE_PRODUCT_EDIT_DRAFT_INVALID_INPUT: image_url business mismatch'
      using errcode = '22023';
  end if;

  if v_image_intent = 'replace'
     and position(p_product_id::text in v_image_url) = 0 then
    raise exception 'SAVE_PRODUCT_EDIT_DRAFT_INVALID_INPUT: image_url product folder mismatch'
      using errcode = '22023';
  end if;

  -- Refuse to mutate over unexpected is_enabled=true override rows for desired ids.
  select count(*)::integer
    into v_legacy_count
  from public.product_customization_overrides o
  where o.business_id = v_business_id
    and o.product_id = p_product_id
    and o.is_enabled = true
    and (
      (o.override_type = 'group' and o.group_id = any (v_hidden_group_ids))
      or (o.override_type = 'option' and o.option_id = any (v_hidden_option_ids))
    );

  if v_legacy_count > 0 then
    raise exception 'SAVE_PRODUCT_EDIT_DRAFT_LEGACY_OVERRIDE_SHAPE'
      using errcode = 'P0001';
  end if;

  -- Validate every desired hidden group against product/category assignments
  -- (matches getProductCustomizationInheritanceForAdmin applicability).
  select g.id
    into v_bad_group
  from unnest(v_hidden_group_ids) as g(id)
  where not exists (
    select 1
    from public.customization_group_assignments a
    where a.business_id = v_business_id
      and a.group_id = g.id
      and (
        (a.target_type = 'product' and a.target_id = p_product_id)
        or (
          a.target_type = 'category'
          and v_category_id is not null
          and a.target_id = v_category_id
        )
      )
  )
  limit 1;

  if v_bad_group is not null then
    raise exception 'SAVE_PRODUCT_EDIT_DRAFT_INVALID_GROUP'
      using errcode = 'P0001';
  end if;

  -- Option must belong to a group applicable to this product (persisted category context).
  select o.id
    into v_bad_option
  from unnest(v_hidden_option_ids) as o(id)
  where not exists (
    select 1
    from public.customization_options co
    where co.id = o.id
      and co.business_id = v_business_id
      and exists (
        select 1
        from public.customization_group_assignments a
        where a.business_id = v_business_id
          and a.group_id = co.group_id
          and (
            (a.target_type = 'product' and a.target_id = p_product_id)
            or (
              a.target_type = 'category'
              and v_category_id is not null
              and a.target_id = v_category_id
            )
          )
      )
  )
  limit 1;

  if v_bad_option is not null then
    raise exception 'SAVE_PRODUCT_EDIT_DRAFT_INVALID_OPTION'
      using errcode = 'P0001';
  end if;

  -- Mirror resolveEffectiveProductAvailability; trigger remains defense in depth.
  if p_track_stock and p_stock <= 0 then
    v_effective_available := false;
  else
    v_effective_available := p_is_available;
  end if;

  -- Narrow reconciliation: only is_enabled=false group/option disable rows.
  delete from public.product_customization_overrides o
  where o.business_id = v_business_id
    and o.product_id = p_product_id
    and o.override_type = 'group'
    and o.is_enabled = false
    and o.group_id is not null
    and not (o.group_id = any (v_hidden_group_ids));

  delete from public.product_customization_overrides o
  where o.business_id = v_business_id
    and o.product_id = p_product_id
    and o.override_type = 'option'
    and o.is_enabled = false
    and o.option_id is not null
    and not (o.option_id = any (v_hidden_option_ids));

  insert into public.product_customization_overrides (
    business_id,
    product_id,
    override_type,
    group_id,
    option_id,
    is_enabled
  )
  select
    v_business_id,
    p_product_id,
    'group',
    g.id,
    null,
    false
  from unnest(v_hidden_group_ids) as g(id)
  on conflict (business_id, product_id, group_id) where (override_type = 'group')
  do update
    set is_enabled = false,
        updated_at = now();

  insert into public.product_customization_overrides (
    business_id,
    product_id,
    override_type,
    group_id,
    option_id,
    is_enabled
  )
  select
    v_business_id,
    p_product_id,
    'option',
    null,
    o.id,
    false
  from unnest(v_hidden_option_ids) as o(id)
  on conflict (business_id, product_id, option_id) where (override_type = 'option')
  do update
    set is_enabled = false,
        group_id = null,
        updated_at = now();

  -- Category intentionally omitted from SET list (application-level Edit immutability).
  if v_image_intent = 'keep' then
    update public.products pr
    set
      name = v_name,
      description = v_description,
      price = p_price,
      sku = v_sku,
      stock = p_stock,
      track_stock = p_track_stock,
      is_available = v_effective_available
    where pr.id = p_product_id
      and pr.business_id = v_business_id;
  elsif v_image_intent = 'remove' then
    update public.products pr
    set
      name = v_name,
      description = v_description,
      price = p_price,
      sku = v_sku,
      stock = p_stock,
      track_stock = p_track_stock,
      is_available = v_effective_available,
      image_url = null
    where pr.id = p_product_id
      and pr.business_id = v_business_id;
  else
    -- replace
    update public.products pr
    set
      name = v_name,
      description = v_description,
      price = p_price,
      sku = v_sku,
      stock = p_stock,
      track_stock = p_track_stock,
      is_available = v_effective_available,
      image_url = v_image_url
    where pr.id = p_product_id
      and pr.business_id = v_business_id;
  end if;

  if not found then
    raise exception 'SAVE_PRODUCT_EDIT_DRAFT_PRODUCT_UPDATE_FAILED'
      using errcode = 'P0001';
  end if;

  return p_product_id;
end;
$$;

comment on function public.save_product_edit_draft(
  uuid, text, text, numeric, text, integer, boolean, boolean, text, text, uuid[], uuid[]
) is
  'Unified Edit Product Save: atomic product fields + image_url intent + canonical hidden group/option overrides. SECURITY INVOKER. Category not mutable.';

revoke all on function public.save_product_edit_draft(
  uuid, text, text, numeric, text, integer, boolean, boolean, text, text, uuid[], uuid[]
) from public;

revoke all on function public.save_product_edit_draft(
  uuid, text, text, numeric, text, integer, boolean, boolean, text, text, uuid[], uuid[]
) from anon;

grant execute on function public.save_product_edit_draft(
  uuid, text, text, numeric, text, integer, boolean, boolean, text, text, uuid[], uuid[]
) to authenticated;
