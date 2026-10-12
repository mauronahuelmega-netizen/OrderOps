-- PROD-P1-2: role-gate the mutative RLS for Products (defense in depth).
--
-- Before this migration the mutative policies on public.products and on the
-- product-images bucket only checked tenancy (business_id / folder), never the caller's
-- role. The application enforces `manageProducts` (lib/admin/permissions.ts), but a
-- direct PostgREST or storage call from an authenticated operator/viewer session
-- bypassed that check and could insert/update/delete products inside its own tenant.
-- No cross-tenant exposure existed, and none is introduced here.
--
-- Authorized-role predicate mirrors `canManageProducts` exactly:
--   normalizeBusinessAdminRole(): 'super_admin' | 'admin' | 'owner' -> owner
--                                 'manager' -> manager
--   canManageProducts() = isOwner || isManager
-- Persisted values come from profiles_role_valid
-- (20260516201000_s1_business_roles.sql):
--   'admin', 'owner', 'manager', 'operator', 'viewer', 'super_admin'
-- so the tenant-scoped allow-list is ('owner', 'admin', 'manager') and 'super_admin'
-- keeps its existing separate cross-tenant branch.
--
-- Deliberately unchanged:
--   * products_select_own_business      (authenticated read)
--   * products_select_available_public  (anon catalog read)
--   * product_images_public_read        (public object read)
--   * absence of a storage DELETE policy (image lifecycle -> PROD-P3-15)
--   * every other table. Orders/Categories share this pattern but are out of scope:
--     SYSTEM-WIDE RLS HARDENING = FOLLOW-UP.
--
-- Reads are NOT hardened: the finding is that operator/viewer can MUTATE, not that they
-- can read. Other subsystems depend on product reads.

-- ---------------------------------------------------------------------------
-- public.products — mutative policies
-- ---------------------------------------------------------------------------

drop policy if exists "products_insert_own_business" on public.products;
drop policy if exists "products_update_own_business" on public.products;
drop policy if exists "products_delete_own_business" on public.products;

create policy "products_insert_own_business"
  on public.products
  for insert
  to authenticated
  with check (
    (
      business_id = (
        select p.business_id
        from public.profiles p
        where p.id = auth.uid()
      )
      and exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.role in ('owner', 'admin', 'manager')
      )
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'super_admin'
    )
  );

-- USING gates which existing rows may be targeted; WITH CHECK gates the resulting row,
-- so an authorized caller cannot move a product into another tenant.
create policy "products_update_own_business"
  on public.products
  for update
  to authenticated
  using (
    (
      business_id = (
        select p.business_id
        from public.profiles p
        where p.id = auth.uid()
      )
      and exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.role in ('owner', 'admin', 'manager')
      )
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'super_admin'
    )
  )
  with check (
    (
      business_id = (
        select p.business_id
        from public.profiles p
        where p.id = auth.uid()
      )
      and exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.role in ('owner', 'admin', 'manager')
      )
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'super_admin'
    )
  );

-- The app exposes no delete affordance; this only ensures that the delete capability the
-- database already grants is restricted to authorized roles inside their own tenant.
create policy "products_delete_own_business"
  on public.products
  for delete
  to authenticated
  using (
    (
      business_id = (
        select p.business_id
        from public.profiles p
        where p.id = auth.uid()
      )
      and exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.role in ('owner', 'admin', 'manager')
      )
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'super_admin'
    )
  );

-- ---------------------------------------------------------------------------
-- storage.objects — product-images mutative policies
-- ---------------------------------------------------------------------------
-- Object path convention: business_id/product_id/file.ext -> foldername length 2.
-- The tenant-folder predicate is preserved verbatim from
-- 20260427103000_normalize_product_images_storage_policies.sql; only the role gate is
-- added. No super_admin branch is added here: super_admin carries business_id NULL, so
-- it already fails the folder comparison today and that behaviour is left as-is.

drop policy if exists "product_images_insert_own_business" on storage.objects;
drop policy if exists "product_images_update_own_business" on storage.objects;

create policy "product_images_insert_own_business"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'product-images'
    and array_length(storage.foldername(name), 1) = 2
    and (storage.foldername(name))[1] = (
      select p.business_id::text
      from public.profiles p
      where p.id = auth.uid()
    )
    and nullif((storage.foldername(name))[2], '') is not null
    and nullif(storage.filename(name), '') is not null
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('owner', 'admin', 'manager')
    )
  );

create policy "product_images_update_own_business"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'product-images'
    and array_length(storage.foldername(name), 1) = 2
    and (storage.foldername(name))[1] = (
      select p.business_id::text
      from public.profiles p
      where p.id = auth.uid()
    )
    and nullif((storage.foldername(name))[2], '') is not null
    and nullif(storage.filename(name), '') is not null
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('owner', 'admin', 'manager')
    )
  )
  with check (
    bucket_id = 'product-images'
    and array_length(storage.foldername(name), 1) = 2
    and (storage.foldername(name))[1] = (
      select p.business_id::text
      from public.profiles p
      where p.id = auth.uid()
    )
    and nullif((storage.foldername(name))[2], '') is not null
    and nullif(storage.filename(name), '') is not null
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('owner', 'admin', 'manager')
    )
  );
