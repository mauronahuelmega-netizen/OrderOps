create or replace function public.set_business_on_demand_status(
  p_business_id uuid,
  p_active boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_business_id is null then
    raise exception 'business_id is required';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.business_id = p_business_id
      and p.role in ('admin', 'owner', 'manager')
  ) then
    raise exception 'Not authorized';
  end if;

  insert into public.business_settings (business_id, on_demand_mode_active)
  values (p_business_id, p_active)
  on conflict (business_id)
  do update set on_demand_mode_active = excluded.on_demand_mode_active;
end;
$$;

grant execute on function public.set_business_on_demand_status(uuid, boolean) to authenticated;