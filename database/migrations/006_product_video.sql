-- =====================================================================
-- Migración: video de producto
-- =====================================================================
-- Un video por producto (además de hasta 3 fotos, límite que se aplica
-- en el formulario, no en la base). Se sube al mismo bucket
-- "product-images" que ya existe con sus policies de lectura/escritura.
-- =====================================================================

alter table products
  add column if not exists video_url text;
