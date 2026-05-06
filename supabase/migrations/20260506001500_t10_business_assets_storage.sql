insert into storage.buckets (id, name, public)
values ('business-assets', 'business-assets', true)
on conflict (id) do nothing;

create policy "business_assets_public_read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'business-assets');

create policy "business_assets_insert_own_business"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'business-assets'
    and array_length(storage.foldername(name), 1) = 2
    and (storage.foldername(name))[1] = (
      select p.business_id::text
      from public.profiles p
      where p.id = auth.uid()
    )
    and (storage.foldername(name))[2] in ('logo', 'cover')
    and nullif(storage.filename(name), '') is not null
  );

create policy "business_assets_update_own_business"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'business-assets'
    and array_length(storage.foldername(name), 1) = 2
    and (storage.foldername(name))[1] = (
      select p.business_id::text
      from public.profiles p
      where p.id = auth.uid()
    )
    and (storage.foldername(name))[2] in ('logo', 'cover')
    and nullif(storage.filename(name), '') is not null
  )
  with check (
    bucket_id = 'business-assets'
    and array_length(storage.foldername(name), 1) = 2
    and (storage.foldername(name))[1] = (
      select p.business_id::text
      from public.profiles p
      where p.id = auth.uid()
    )
    and (storage.foldername(name))[2] in ('logo', 'cover')
    and nullif(storage.filename(name), '') is not null
  );

create policy "business_assets_delete_own_business"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'business-assets'
    and array_length(storage.foldername(name), 1) = 2
    and (storage.foldername(name))[1] = (
      select p.business_id::text
      from public.profiles p
      where p.id = auth.uid()
    )
    and (storage.foldername(name))[2] in ('logo', 'cover')
    and nullif(storage.filename(name), '') is not null
  );
