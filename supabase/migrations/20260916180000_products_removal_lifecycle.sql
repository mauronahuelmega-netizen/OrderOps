-- ADMIN-PRODUCTS-PRODUCT-REMOVAL-LIFECYCLE-DB-AUTHOR-1
-- Final Product Removal lifecycle foundation (corrected V1 contract).
--
-- Authoritative product decision (CONTRACT-CORRECTION-1):
--   ARCHIVE + RESTORE + PERMANENT DELETE
--   availability != archive
--   raw authenticated table DELETE = DENIED
--   permanent delete = transactional domain RPC only
--
-- Supersedes unapplied archive-only migration:
--   20260916180000_products_archive_lifecycle.sql
--   SHA256 55f187f5b4362723ba1e4e3659a90769cc75d57ea61b615f79d2505e89db88bb
--   Proven remote-unapplied before replacement (archived_at absent; history 0).
--
-- This migration:
--   * adds archived_at timestamptz NULL (no backfill)
--   * CHECK: archived rows cannot be is_available = true
--   * partial index for future non-archived default admin list
--   * hardens anon public SELECT with archived_at IS NULL
--   * drops authenticated products DELETE policy (no replacement table DELETE path)
--   * authors public.delete_product_permanently(uuid) SECURITY DEFINER
--
-- Deliberately unchanged:
--   * products_select_own_business (admin must still read archived rows)
--   * products_insert_own_business / products_update_own_business
--   * products_business_sku_uidx (SKU reserved while row exists — including archived)
--   * stock/availability trigger
--   * FK definitions (rely on existing CASCADE / SET NULL / RESTRICT semantics)
--   * Storage policies / objects
--   * save_product_edit_draft body
--   * transition_order_status / restock (INNER JOIN products already skips deleted)
--
-- NOT APPLIED in DB-AUTHOR. Remote apply = next phase.

-- ---------------------------------------------------------------------------
-- 1. Lifecycle column
-- ---------------------------------------------------------------------------

alter table public.products
  add column if not exists archived_at timestamptz null;

comment on column public.products.archived_at is
  'Lifecycle archive timestamp. NULL = active catalog row. Non-null = archived (not publicly sellable; SKU remains reserved until permanent delete).';

-- ---------------------------------------------------------------------------
-- 2. Lifecycle invariant: archived ⇒ unavailable
-- ---------------------------------------------------------------------------
-- Existing rows have archived_at NULL, so the CHECK is immediately satisfied
-- with no product data mutation.

alter table public.products
  drop constraint if exists products_archived_requires_unavailable;

alter table public.products
  add constraint products_archived_requires_unavailable
  check (archived_at is null or is_available = false);

-- ---------------------------------------------------------------------------
-- 3. Active-list partial index (admin default collection foresight)
-- ---------------------------------------------------------------------------
-- Current admin list: filter business_id, order created_at desc
-- (lib/products/admin.ts). Future default adds archived_at IS NULL.

create index if not exists products_business_created_at_active_idx
  on public.products (business_id, created_at desc)
  where archived_at is null;

-- ---------------------------------------------------------------------------
-- 4. Public SELECT — exclude archived (defense in depth)
-- ---------------------------------------------------------------------------
-- Preserve prior live predicates:
--   is_available = true
--   AND active business
-- Add:
--   archived_at IS NULL

drop policy if exists "products_select_available_public" on public.products;

create policy "products_select_available_public"
  on public.products
  for select
  to anon
  using (
    is_available = true
    and archived_at is null
    and exists (
      select 1
      from public.businesses b
      where b.id = products.business_id
        and b.is_active = true
    )
  );

-- ---------------------------------------------------------------------------
-- 5. Remove authenticated raw table DELETE path
-- ---------------------------------------------------------------------------
-- Permanent Delete is a product feature, but the API is the domain RPC below.
-- Table GRANT DELETE may remain on authenticated/anon (Supabase default);
-- with RLS enabled and no DELETE policy, ordinary sessions cannot delete rows.
-- service_role bypasses RLS and retains privileged maintenance DELETE capability.
-- No replacement authenticated DELETE policy.

drop policy if exists "products_delete_own_business" on public.products;

-- ---------------------------------------------------------------------------
-- 6. Permanent delete RPC
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER rationale (forensic):
--   * After section 5, products has no authenticated DELETE policy → INVOKER
--     cannot delete the product row without reopening unsafe raw DELETE.
--   * stock_movements has SELECT-only RLS (no DELETE policy) while FK is
--     ON DELETE RESTRICT → INVOKER cannot clear the ledger blocker.
--   * Therefore DEFINER is required for atomic, audited domain cleanup while
--     keeping raw table DELETE denied.
--
-- Hardening:
--   * auth.uid() required
--   * manageProducts-equivalent roles: owner/admin/manager (+ super_admin)
--   * tenant ownership from locked product row vs caller profile
--   * no client business_id / image_url / force / cascade inputs
--   * search_path = ''
--   * fully qualified relations
--   * PUBLIC/anon EXECUTE revoked; authenticated EXECUTE only

create or replace function public.delete_product_permanently(
  p_product_id uuid
)
returns table (
  deleted_product_id uuid,
  image_url text,
  deleted boolean
)
language plpgsql
security definer
set search_path = ''
volatile
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_profile_business_id uuid;
  v_product_id uuid;
  v_product_business_id uuid;
  v_image_url text;
begin
  if v_uid is null then
    raise exception 'DELETE_PRODUCT_PERMANENTLY_UNAUTHORIZED'
      using errcode = '42501';
  end if;

  select p.role, p.business_id
    into v_role, v_profile_business_id
  from public.profiles p
  where p.id = v_uid;

  if v_role is null then
    raise exception 'DELETE_PRODUCT_PERMANENTLY_UNAUTHORIZED'
      using errcode = '42501';
  end if;

  -- Mirrors canManageProducts / products mutative RLS allow-list
  -- (20260909040000_products_manage_role_rls.sql).
  if v_role not in ('owner', 'admin', 'manager', 'super_admin') then
    raise exception 'DELETE_PRODUCT_PERMANENTLY_FORBIDDEN'
      using errcode = '42501';
  end if;

  if p_product_id is null then
    raise exception 'DELETE_PRODUCT_PERMANENTLY_INVALID_INPUT: product_id required'
      using errcode = '22023';
  end if;

  -- Lock target row. Tenant filter prevents cross-tenant delete.
  -- Absent / foreign / already-deleted → same non-leaking outcome (deleted=false).
  if v_role = 'super_admin' then
    select pr.id, pr.business_id, pr.image_url
      into v_product_id, v_product_business_id, v_image_url
    from public.products pr
    where pr.id = p_product_id
    for update;
  else
    if v_profile_business_id is null then
      raise exception 'DELETE_PRODUCT_PERMANENTLY_FORBIDDEN'
        using errcode = '42501';
    end if;

    select pr.id, pr.business_id, pr.image_url
      into v_product_id, v_product_business_id, v_image_url
    from public.products pr
    where pr.id = p_product_id
      and pr.business_id = v_profile_business_id
    for update;
  end if;

  if v_product_id is null then
    deleted_product_id := null;
    image_url := null;
    deleted := false;
    return next;
    return;
  end if;

  -- Product-target customization assignments (polymorphic; no physical FK).
  -- BOTH target_type and target_id required to avoid category UUID collisions.
  delete from public.customization_group_assignments a
  where a.target_type = 'product'
    and a.target_id = v_product_id;

  -- Upsell item rows that reference this product (ON DELETE RESTRICT blocker).
  -- Scoped to this product_id only — group definitions and other items preserved.
  delete from public.upsell_group_items ugi
  where ugi.product_id = v_product_id;

  -- Product-targeted upsell groups (polymorphic ownership 1:1 per target).
  -- Category-targeted groups and shared customization definitions are untouched.
  -- ON DELETE CASCADE from upsell_groups → remaining items of those groups only.
  delete from public.upsell_groups ug
  where ug.target_type = 'product'
    and ug.target_id = v_product_id;

  -- Product-specific stock ledger (ON DELETE RESTRICT blocker).
  delete from public.stock_movements sm
  where sm.product_id = v_product_id;

  -- Final product row delete.
  -- Expected FK side effects:
  --   * product_customization_overrides → CASCADE
  --   * order_items.product_id → SET NULL (snapshots preserved)
  delete from public.products pr
  where pr.id = v_product_id
    and pr.business_id = v_product_business_id;

  if not found then
    raise exception 'DELETE_PRODUCT_PERMANENTLY_INTEGRITY_FAILURE'
      using errcode = 'P0001';
  end if;

  deleted_product_id := v_product_id;
  image_url := v_image_url;
  deleted := true;
  return next;
  return;
end;
$$;

comment on function public.delete_product_permanently(uuid) is
  'Permanent Product Delete: transactional cleanup of product-owned operational relations + products row. SECURITY DEFINER. Returns pre-delete image_url for post-commit Storage cleanup. No Storage mutation. No client business_id.';

revoke all on function public.delete_product_permanently(uuid) from public;
revoke all on function public.delete_product_permanently(uuid) from anon;
grant execute on function public.delete_product_permanently(uuid) to authenticated;
