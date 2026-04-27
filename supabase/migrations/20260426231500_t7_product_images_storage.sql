-- T7: Bucket y politicas de storage
-- Alcance:
-- - bucket product-images
-- - imagenes publicas legibles
-- - convencion de path: /business_id/product_id/file
-- - admin autenticado solo puede subir imagenes para su propio negocio

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product_images_public_read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'product-images');

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
