-- Fix storage policy for product-images paths.
-- The intended object path is: /business_id/product_id/file
-- storage.foldername(name) returns only the folder segments, not the filename,
-- so the expected folder depth is 2, not 3.

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
  );
