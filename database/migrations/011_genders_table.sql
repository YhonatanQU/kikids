-- =====================================================================
-- 011: convierte "género" de enum fijo (gender_type) a tabla editable
-- (misma forma que seasons/categories) para poder administrarlo desde
-- el panel admin igual que temporadas y categorías.
-- =====================================================================

create table genders (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  is_active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

comment on table genders is 'Género objetivo de la prenda. Eje de filtro cruzado con temporada y categoría.';

alter table genders enable row level security;

create policy "public_read_genders" on genders for select using (is_active);

create policy "admin_all_genders" on genders for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

insert into genders (name, slug, display_order) values
  ('Niño', 'nino', 1),
  ('Niña', 'nina', 2),
  ('Bebé', 'bebe', 3),
  ('Unisex', 'unisex', 4);

-- Migra products.gender (enum) -> products.gender_id (fk) conservando los datos.
alter table products add column gender_id uuid references genders(id);

update products p
set gender_id = g.id
from genders g
where g.slug = p.gender::text;

alter table products alter column gender_id set not null;

-- El índice de filtro cruzado usaba la columna enum; se recrea con gender_id.
drop index if exists idx_products_filter;

alter table products drop column gender;

create index idx_products_filter on products (season_id, gender_id, category_id)
  where is_active;
