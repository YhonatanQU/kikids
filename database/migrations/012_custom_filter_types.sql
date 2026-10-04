-- =====================================================================
-- 012: sistema de filtros personalizados (ej. Talla, Edad) — permite
-- crear ejes de filtro nuevos desde el admin, además de los tres fijos
-- (temporada/categoría/género), sin tener que tocar el esquema cada vez.
--
-- filter_types  = el eje ("Talla", "Edad")
-- filter_values = las opciones de ese eje ("2 años", "0-6 meses")
-- product_filter_values = qué opciones tiene marcadas cada producto
-- (muchos a muchos: un producto puede tener varias opciones de un mismo eje).
-- =====================================================================

create table filter_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  is_active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

comment on table filter_types is 'Ejes de filtro adicionales definidos por el admin (ej. Talla, Edad), más allá de temporada/categoría/género.';

create table filter_values (
  id uuid primary key default gen_random_uuid(),
  filter_type_id uuid not null references filter_types(id) on delete cascade,
  name text not null,
  slug text not null,
  is_active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (filter_type_id, slug)
);

create table product_filter_values (
  product_id uuid not null references products(id) on delete cascade,
  filter_value_id uuid not null references filter_values(id) on delete cascade,
  primary key (product_id, filter_value_id)
);

create index idx_product_filter_values_value on product_filter_values (filter_value_id);

alter table filter_types enable row level security;
alter table filter_values enable row level security;
alter table product_filter_values enable row level security;

create policy "public_read_filter_types" on filter_types for select using (is_active);
create policy "public_read_filter_values" on filter_values for select using (is_active);
create policy "public_read_product_filter_values" on product_filter_values for select using (true);

create policy "admin_all_filter_types" on filter_types for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_all_filter_values" on filter_values for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_all_product_filter_values" on product_filter_values for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
