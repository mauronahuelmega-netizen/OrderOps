-- Fix: permitir UPDATE de business_settings a perfiles admin legacy (owner/manager ya cubiertos)

drop policy if exists "business_settings_update_owner_manager" on public.business_settings;

create policy "business_settings_update_owner_manager"
  on public.business_settings
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.business_id = business_settings.business_id
        and p.role in ('admin', 'owner', 'manager')
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.business_id = business_settings.business_id
        and p.role in ('admin', 'owner', 'manager')
    )
  );
