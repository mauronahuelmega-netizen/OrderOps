do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'businesses'
      and policyname = 'businesses_update_own_business'
  ) then
    execute $policy$
      create policy "businesses_update_own_business"
        on public.businesses
        for update
        to authenticated
        using (
          exists (
            select 1
            from public.profiles p
            where p.id = auth.uid()
              and p.role = 'admin'
              and p.business_id = businesses.id
          )
        )
        with check (
          exists (
            select 1
            from public.profiles p
            where p.id = auth.uid()
              and p.role = 'admin'
              and p.business_id = businesses.id
          )
        );
    $policy$;
  end if;
end
$$;
