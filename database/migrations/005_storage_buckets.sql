-- =====================================================================
-- Migración: crear los buckets de Storage que faltaban
-- =====================================================================
-- Causa de "no carga la imagen del producto": el bucket "product-images"
-- nunca se creó, así que cada intento de subir foto fallaba con
-- "Bucket not found" (y el código lo tragaba en silencio — también
-- corregido en el frontend para mostrar el error si vuelve a pasar).
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('invoices', 'invoices', true)
on conflict (id) do nothing;

create policy "public_read_product_images" on storage.objects
  for select using (bucket_id = 'product-images');

create policy "admin_write_product_images" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images');

create policy "admin_update_product_images" on storage.objects
  for update to authenticated using (bucket_id = 'product-images');

create policy "admin_delete_product_images" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images');
