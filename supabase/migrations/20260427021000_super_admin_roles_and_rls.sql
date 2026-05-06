-- Add simple roles to profiles and extend RLS for super_admin.

alter table public.profiles
  add column if not exists role text not null default 'admin';

alter table public.profiles
  drop constraint if exists profiles_role_valid;

alter table public.profiles
  add constraint profiles_role_valid
  check (role in ('admin', 'super_admin'));

drop policy if exists "businesses_select_own_business" on public.businesses;
drop policy if exists "categories_select_own_business" on public.categories;
drop policy if exists "categories_insert_own_business" on public.categories;
drop policy if exists "categories_update_own_business" on public.categories;
drop policy if exists "categories_delete_own_business" on public.categories;
drop policy if exists "products_select_own_business" on public.products;
drop policy if exists "products_insert_own_business" on public.products;
drop policy if exists "products_update_own_business" on public.products;
drop policy if exists "products_delete_own_business" on public.products;
drop policy if exists "orders_select_own_business" on public.orders;
drop policy if exists "orders_update_own_business" on public.orders;
drop policy if exists "order_items_select_own_business" on public.order_items;

create policy "businesses_select_own_business"
  on public.businesses
  for select
  to authenticated
  using (
    id = (
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

create policy "businesses_insert_super_admin"
  on public.businesses
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'super_admin'
    )
  );

create policy "categories_select_own_business"
  on public.categories
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

create policy "categories_insert_own_business"
  on public.categories
  for insert
  to authenticated
  with check (
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

create policy "categories_update_own_business"
  on public.categories
  for update
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
  )
  with check (
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

create policy "categories_delete_own_business"
  on public.categories
  for delete
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

create policy "products_select_own_business"
  on public.products
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

create policy "products_insert_own_business"
  on public.products
  for insert
  to authenticated
  with check (
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

create policy "products_update_own_business"
  on public.products
  for update
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
  )
  with check (
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

create policy "products_delete_own_business"
  on public.products
  for delete
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

create policy "orders_select_own_business"
  on public.orders
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

create policy "orders_update_own_business"
  on public.orders
  for update
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
  )
  with check (
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

create policy "order_items_select_own_business"
  on public.order_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.orders o
      join public.profiles p
        on p.business_id = o.business_id
      where o.id = order_items.order_id
        and p.id = auth.uid()
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'super_admin'
    )
  );
