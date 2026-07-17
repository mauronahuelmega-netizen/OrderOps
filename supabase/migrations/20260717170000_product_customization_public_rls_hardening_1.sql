-- PRODUCT-CUSTOMIZATION-PUBLIC-RLS-HARDENING-1
-- Public customization/upsell SELECT policies must not depend on anon reading
-- business_settings (member-only). Use a boolean SECURITY DEFINER helper instead.
-- Does not open business_settings to anon. Does not touch order/stock RPCs.

create or replace function public.is_public_product_customization_enabled(
  p_business_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_settings bs
    where bs.business_id = p_business_id
      and bs.product_customization_enabled = true
  );
$$;

comment on function public.is_public_product_customization_enabled(uuid) is
  'Boolean-only flag gate for public Product Customization RLS. Does not expose business_settings rows.';

revoke all on function public.is_public_product_customization_enabled(uuid) from public;
grant execute on function public.is_public_product_customization_enabled(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Public SELECT policies: keep availability / active-business guards;
-- replace business_settings EXISTS with the helper.
-- ---------------------------------------------------------------------------

drop policy if exists "customization_groups_select_available_public" on public.customization_groups;
create policy "customization_groups_select_available_public"
  on public.customization_groups
  for select
  to anon, authenticated
  using (
    is_available = true
    and exists (
      select 1
      from public.businesses b
      where b.id = customization_groups.business_id
        and b.is_active = true
    )
    and public.is_public_product_customization_enabled(business_id)
  );

drop policy if exists "customization_options_select_available_public" on public.customization_options;
create policy "customization_options_select_available_public"
  on public.customization_options
  for select
  to anon, authenticated
  using (
    is_available = true
    and exists (
      select 1
      from public.customization_groups g
      where g.id = customization_options.group_id
        and g.business_id = customization_options.business_id
        and g.is_available = true
    )
    and exists (
      select 1
      from public.businesses b
      where b.id = customization_options.business_id
        and b.is_active = true
    )
    and public.is_public_product_customization_enabled(business_id)
  );

drop policy if exists "customization_group_assignments_select_enabled_public"
  on public.customization_group_assignments;
create policy "customization_group_assignments_select_enabled_public"
  on public.customization_group_assignments
  for select
  to anon, authenticated
  using (
    is_enabled = true
    and exists (
      select 1
      from public.businesses b
      where b.id = customization_group_assignments.business_id
        and b.is_active = true
    )
    and public.is_public_product_customization_enabled(business_id)
  );

drop policy if exists "product_customization_overrides_select_public"
  on public.product_customization_overrides;
create policy "product_customization_overrides_select_public"
  on public.product_customization_overrides
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.businesses b
      where b.id = product_customization_overrides.business_id
        and b.is_active = true
    )
    and public.is_public_product_customization_enabled(business_id)
  );

drop policy if exists "upsell_groups_select_available_public" on public.upsell_groups;
create policy "upsell_groups_select_available_public"
  on public.upsell_groups
  for select
  to anon, authenticated
  using (
    is_available = true
    and exists (
      select 1
      from public.businesses b
      where b.id = upsell_groups.business_id
        and b.is_active = true
    )
    and public.is_public_product_customization_enabled(business_id)
  );

drop policy if exists "upsell_group_items_select_available_public" on public.upsell_group_items;
create policy "upsell_group_items_select_available_public"
  on public.upsell_group_items
  for select
  to anon, authenticated
  using (
    is_available = true
    and exists (
      select 1
      from public.upsell_groups ug
      where ug.id = upsell_group_items.upsell_group_id
        and ug.business_id = upsell_group_items.business_id
        and ug.is_available = true
    )
    and exists (
      select 1
      from public.products p
      where p.id = upsell_group_items.product_id
        and p.business_id = upsell_group_items.business_id
        and p.is_available = true
    )
    and exists (
      select 1
      from public.businesses b
      where b.id = upsell_group_items.business_id
        and b.is_active = true
    )
    and public.is_public_product_customization_enabled(business_id)
  );
