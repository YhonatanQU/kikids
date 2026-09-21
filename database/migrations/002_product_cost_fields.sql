-- =====================================================================
-- Migración: campos de costeo en products
-- =====================================================================
-- Ejecutar una sola vez en el SQL Editor de Supabase (proyecto que ya
-- tiene schema.sql aplicado y productos existentes). schema.sql ya
-- incluye estas columnas para instalaciones nuevas.
-- =====================================================================

alter table products
  add column if not exists cost_price numeric(10,2) not null default 0 check (cost_price >= 0),
  add column if not exists freight_cost numeric(10,2) not null default 0 check (freight_cost >= 0),
  add column if not exists admin_cost numeric(10,2) not null default 0 check (admin_cost >= 0),
  add column if not exists markup_percentage numeric(5,2) not null default 0 check (markup_percentage >= 0);

comment on column products.cost_price is 'Precio de compra (costo) por prenda.';
comment on column products.freight_cost is 'Flete/envío por prenda hasta la tienda.';
comment on column products.admin_cost is 'Gastos administrativos asignados por prenda.';
comment on column products.markup_percentage is 'Margen % aplicado sobre (cost_price + freight_cost + admin_cost) para obtener base_price.';
