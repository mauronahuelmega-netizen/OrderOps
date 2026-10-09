-- ADMIN-PRODUCTS-IMAGE-LIFECYCLE-1
-- Storage DELETE policy for product-images (forward lifecycle).
-- Mirrors live INSERT/UPDATE tenant folder + manageProducts role gate.
-- DDL only: no DML, no historical cleanup, no other policy changes.

drop policy if exists "product_images_delete_own_business" on storage.objects;

create policy "product_images_delete_own_business"
  on storage.objects
  for delete
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
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('owner', 'admin', 'manager')
    )
  );
