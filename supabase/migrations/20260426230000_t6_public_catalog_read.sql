-- T6: Acceso publico controlado para catalogo
-- Alcance:
-- - Lectura publica de businesses necesaria para resolver slug
-- - Lectura publica de categories
-- - Lectura publica de products
-- - Solo negocios activos
-- - Solo productos disponibles
-- - Sin escritura publica

create policy "businesses_select_active_public"
  on public.businesses
  for select
  to anon
  using (is_active = true);

create policy "categories_select_active_business_public"
  on public.categories
  for select
  to anon
  using (
    exists (
      select 1
      from public.businesses b
      where b.id = categories.business_id
        and b.is_active = true
    )
  );

create policy "products_select_available_public"
  on public.products
  for select
  to anon
  using (
    is_available = true
    and exists (
      select 1
      from public.businesses b
      where b.id = products.business_id
        and b.is_active = true
    )
  );
