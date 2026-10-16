-- Cloud history alignment. Apply once, after the store ledger is registered
-- and before 20260926010000. Does not recreate tables or rewrite orders.

drop policy if exists "Permitir lectura a miembros del negocio" on public.business_settings;
drop policy if exists "Permitir actualización a owners y managers" on public.business_settings;

drop policy if exists "business_settings_select_own_business" on public.business_settings;
create policy "business_settings_select_own_business"
  on public.business_settings
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

drop policy if exists "business_settings_select_active_business_public" on public.business_settings;
create policy "business_settings_select_active_business_public"
  on public.business_settings
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.businesses b
      where b.id = business_settings.business_id
        and b.is_active = true
    )
  );

drop policy if exists "order_events_select_own_business" on public.order_events;
create policy "order_events_select_own_business"
  on public.order_events
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

drop policy if exists "order_events_insert_own_business" on public.order_events;
create policy "order_events_insert_own_business"
  on public.order_events
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

alter function public.create_default_business_settings() set search_path = public;
