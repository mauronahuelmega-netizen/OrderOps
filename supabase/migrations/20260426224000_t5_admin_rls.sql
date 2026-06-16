-- T5: RLS para contexto admin
-- Alcance:
-- - Habilitar RLS en businesses, profiles, categories, products, orders, order_items
-- - Un admin solo puede ver/modificar datos de su negocio
-- - profiles solo expone el perfil propio
-- - Sin acceso publico todavia

alter table public.businesses enable row level security;
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

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
  );

create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

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
  )
  with check (
    business_id = (
      select p.business_id
      from public.profiles p
      where p.id = auth.uid()
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
  )
  with check (
    business_id = (
      select p.business_id
      from public.profiles p
      where p.id = auth.uid()
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
  )
  with check (
    business_id = (
      select p.business_id
      from public.profiles p
      where p.id = auth.uid()
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
  );
