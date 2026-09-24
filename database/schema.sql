-- =====================================================================
-- KIKIDS - Esquema de Base de Datos (PostgreSQL / Supabase)
-- =====================================================================
-- Orden de ejecución: este archivo es idempotente-friendly para un
-- entorno nuevo. Ejecutar completo en el SQL Editor de Supabase o vía
-- `supabase db push` / migraciones.
-- =====================================================================

create extension if not exists "pgcrypto";

-- =====================================================================
-- 1. TIPOS ENUMERADOS
-- =====================================================================

create type order_status as enum (
  'pending_payment',   -- Pendiente de Pago (stock reservado)
  'payment_confirmed', -- Pago Confirmado (stock descontado en firme)
  'shipped',           -- Enviado
  'delivered',         -- Entregado
  'cancelled',         -- Cancelado manualmente por admin
  'expired'            -- Reserva vencida sin pago (stock liberado)
);

create type gender_type as enum ('nino', 'nina', 'bebe', 'unisex');

-- =====================================================================
-- 2. TEMPORADAS / COLECCIONES  (eje de filtro #1)
-- =====================================================================

create table seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,          -- 'Verano', 'Invierno', 'Primavera-Otoño'
  slug text not null unique,
  is_active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

comment on table seasons is 'Colección madre: Verano, Invierno, Primavera-Otoño. Eje de filtro cruzado con género y categoría.';

-- =====================================================================
-- 3. CATEGORÍAS (tipo de prenda, con subcategorías opcionales)
-- =====================================================================

create table categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references categories(id) on delete cascade,
  name text not null,                 -- 'Camisetas', 'Pantalones', 'Conjuntos', 'Vestidos'
  slug text not null unique,
  is_active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

comment on table categories is 'Tipo de prenda. Soporta subcategorías vía parent_id (ej. Conjuntos > Conjuntos de baño).';

-- =====================================================================
-- 4. PRODUCTOS
-- =====================================================================

create table products (
  id uuid primary key default gen_random_uuid(),
  sku_base text unique,
  name text not null,
  slug text not null unique,
  description text,
  category_id uuid not null references categories(id),
  season_id uuid not null references seasons(id),
  gender gender_type not null,

  -- Costeo: base_price (precio de venta) se calcula en el admin como
  -- (cost_price + freight_cost + admin_cost) * (1 + markup_percentage/100)
  -- y se guarda ya resuelto para que el catálogo público solo lea un número.
  cost_price numeric(10,2) not null default 0 check (cost_price >= 0),
  freight_cost numeric(10,2) not null default 0 check (freight_cost >= 0),
  admin_cost numeric(10,2) not null default 0 check (admin_cost >= 0),
  markup_percentage numeric(5,2) not null default 0 check (markup_percentage >= 0),
  base_price numeric(10,2) not null check (base_price >= 0),

  -- Descuento opcional sobre base_price/price_override: se guarda el %
  -- aparte de un interruptor de activación para poder prender/apagar sin
  -- perder el valor configurado.
  discount_percentage numeric(5,2) not null default 0
    check (discount_percentage >= 0 and discount_percentage <= 100),
  discount_active boolean not null default false,

  is_active boolean not null default true,
  is_featured boolean not null default false,
  video_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índice clave para el filtro cruzado:
-- "Colección Verano -> Niños -> Categoría X"
create index idx_products_filter on products (season_id, gender, category_id)
  where is_active;

create index idx_products_slug on products (slug);

comment on table products is 'Producto "padre". El stock real vive en product_variants (talla/color).';

-- =====================================================================
-- 5. VARIANTES DE PRODUCTO (talla + color = unidad real de stock)
-- =====================================================================

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  size text not null,                 -- '0-3M','2','4','6','8','10','12','14'
  color text not null,                -- 'Rojo', 'Azul marino'
  color_hex text,                     -- '#FF0000' para swatches en UI
  sku text unique not null,
  price_override numeric(10,2) check (price_override >= 0),
  stock_quantity int not null default 0 check (stock_quantity >= 0),
  reserved_quantity int not null default 0 check (reserved_quantity >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, size, color),
  check (reserved_quantity <= stock_quantity)
);

-- Columna calculada: stock realmente disponible al público
alter table product_variants
  add column available_quantity int generated always as (stock_quantity - reserved_quantity) stored;

create index idx_variants_product on product_variants(product_id);
create index idx_variants_available on product_variants(available_quantity) where is_active;

comment on column product_variants.reserved_quantity is 'Unidades retenidas temporalmente por pedidos en estado pending_payment.';
comment on column product_variants.available_quantity is 'stock_quantity - reserved_quantity. Es lo que ve el catálogo público.';

-- =====================================================================
-- 6. IMÁGENES DE PRODUCTO
-- =====================================================================

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  variant_id uuid references product_variants(id) on delete cascade,
  url text not null,                  -- URL pública de Supabase Storage
  display_order int not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_images_product on product_images(product_id);

-- =====================================================================
-- 7. CLIENTES (checkout express, sin cuenta obligatoria)
-- =====================================================================

create table customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text,
  document_number text,               -- DNI opcional, útil para factura
  created_at timestamptz not null default now()
);

create index idx_customers_phone on customers(phone);

-- =====================================================================
-- 8. PEDIDOS
-- =====================================================================

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique,           -- se autogenera vía trigger: KIK-20260919-00001
  customer_id uuid not null references customers(id),
  status order_status not null default 'pending_payment',

  shipping_full_name text not null,
  shipping_phone text not null,
  shipping_address text not null,
  shipping_district text not null,
  shipping_city text not null default 'Lima',
  shipping_reference text,

  payment_method text,                -- 'Yape' | 'Plin' | 'Transferencia'
  subtotal numeric(10,2) not null default 0 check (subtotal >= 0),
  shipping_cost numeric(10,2) not null default 0 check (shipping_cost >= 0),
  total numeric(10,2) not null default 0 check (total >= 0),
  currency text not null default 'PEN',

  reserved_until timestamptz,         -- null si ya no aplica reserva (confirmado/cancelado/expirado)
  whatsapp_sent_at timestamptz,
  confirmed_at timestamptz,
  confirmed_by uuid references auth.users(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_orders_status on orders(status);
create index idx_orders_reserved_until on orders(reserved_until) where status = 'pending_payment';
create index idx_orders_customer on orders(customer_id);

-- =====================================================================
-- 9. ÍTEMS DEL PEDIDO (snapshot de precio/variante al momento de compra)
-- =====================================================================

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_variant_id uuid not null references product_variants(id),
  product_name_snapshot text not null,
  size_snapshot text not null,
  color_snapshot text not null,
  sku_snapshot text,
  quantity int not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  subtotal numeric(10,2) not null check (subtotal >= 0)
);

create index idx_order_items_order on order_items(order_id);

-- =====================================================================
-- 10. FACTURAS / COMPROBANTES
-- =====================================================================

create table invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references orders(id),
  invoice_number text not null unique,
  pdf_url text,                       -- URL en Supabase Storage del PDF generado
  issued_at timestamptz not null default now(),
  total numeric(10,2) not null
);

-- =====================================================================
-- 11. PERFILES DE ADMINISTRADOR (extiende auth.users de Supabase)
-- =====================================================================

create table admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'admin', -- 'admin' | 'super_admin'
  created_at timestamptz not null default now()
);

-- =====================================================================
-- 12. TRIGGERS DE MANTENIMIENTO (updated_at)
-- =====================================================================

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_products_updated before update on products
for each row execute function set_updated_at();

create trigger trg_variants_updated before update on product_variants
for each row execute function set_updated_at();

create trigger trg_orders_updated before update on orders
for each row execute function set_updated_at();

-- =====================================================================
-- 13. GENERADOR DE NÚMERO DE PEDIDO
-- =====================================================================

create sequence if not exists order_number_seq;

create or replace function generate_order_number()
returns text language sql as $$
  select 'KIK-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('order_number_seq')::text, 5, '0');
$$;

create or replace function set_order_number()
returns trigger language plpgsql as $$
begin
  if new.order_number is null then
    new.order_number := generate_order_number();
  end if;
  return new;
end;
$$;

create trigger trg_orders_number before insert on orders
for each row execute function set_order_number();

-- =====================================================================
-- 14. RPC: CREAR PEDIDO + RESERVAR STOCK (ATÓMICO)
-- =====================================================================
-- Llamado desde el frontend al hacer clic en "Confirmar y pagar por
-- WhatsApp". Usa SELECT ... FOR UPDATE para bloquear las filas de
-- variantes involucradas y evitar sobreventa por condiciones de carrera.
-- =====================================================================

create or replace function create_order_with_reservation(
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_shipping_address text,
  p_shipping_district text,
  p_shipping_city text,
  p_shipping_reference text,
  p_payment_method text,
  p_shipping_cost numeric,
  p_items jsonb,                      -- [{"variant_id": "uuid", "quantity": 2}, ...]
  p_reservation_minutes int default 120
)
returns table (order_id uuid, order_number text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_order_id uuid;
  v_order_number text;
  v_item jsonb;
  v_variant record;
  v_subtotal numeric := 0;
  v_line_subtotal numeric;
  v_qty int;
begin
  if jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido no tiene ítems';
  end if;

  insert into customers (full_name, phone, email)
  values (p_customer_name, p_customer_phone, p_customer_email)
  returning id into v_customer_id;

  insert into orders (
    customer_id, status, shipping_full_name, shipping_phone,
    shipping_address, shipping_district, shipping_city, shipping_reference,
    payment_method, subtotal, shipping_cost, total, reserved_until
  ) values (
    v_customer_id, 'pending_payment', p_customer_name, p_customer_phone,
    p_shipping_address, p_shipping_district, p_shipping_city, p_shipping_reference,
    p_payment_method, 0, p_shipping_cost, p_shipping_cost,
    now() + (p_reservation_minutes || ' minutes')::interval
  -- Calificado con "orders." porque el OUT param de la función (order_number,
  -- de RETURNS TABLE) tiene el mismo nombre que la columna real de la tabla:
  -- sin calificar, Postgres tira "column reference order_number is ambiguous".
  ) returning orders.id, orders.order_number into v_order_id, v_order_number;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::int;

    if v_qty <= 0 then
      raise exception 'Cantidad inválida para variante %', v_item->>'variant_id';
    end if;

    select pv.id, pv.stock_quantity, pv.reserved_quantity, pv.size, pv.color, pv.sku,
           pv.product_id,
           round(
             coalesce(pv.price_override, p.base_price)
             * case when p.discount_active then (1 - p.discount_percentage / 100) else 1 end,
             2
           ) as price,
           p.name as product_name
    into v_variant
    from product_variants pv
    join products p on p.id = pv.product_id
    where pv.id = (v_item->>'variant_id')::uuid
    for update of pv;

    if not found then
      raise exception 'Variante % no encontrada', v_item->>'variant_id';
    end if;

    if (v_variant.stock_quantity - v_variant.reserved_quantity) < v_qty then
      raise exception 'Stock insuficiente para % (talla %, color %)',
        v_variant.product_name, v_variant.size, v_variant.color;
    end if;

    update product_variants
      set reserved_quantity = reserved_quantity + v_qty
      where id = v_variant.id;

    v_line_subtotal := v_variant.price * v_qty;
    v_subtotal := v_subtotal + v_line_subtotal;

    insert into order_items (
      order_id, product_variant_id, product_name_snapshot,
      size_snapshot, color_snapshot, sku_snapshot, quantity, unit_price, subtotal
    ) values (
      v_order_id, v_variant.id, v_variant.product_name,
      v_variant.size, v_variant.color, v_variant.sku, v_qty, v_variant.price, v_line_subtotal
    );
  end loop;

  update orders
    set subtotal = v_subtotal, total = v_subtotal + p_shipping_cost
    where id = v_order_id;

  return query select v_order_id, v_order_number;
end;
$$;

-- =====================================================================
-- 15. RPC: CONFIRMAR PAGO (admin) -> descuenta stock en firme
-- =====================================================================

create or replace function confirm_order_payment(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from orders where id = p_order_id and status = 'pending_payment') then
    raise exception 'El pedido no está en estado pendiente de pago';
  end if;

  update product_variants pv
  set stock_quantity = stock_quantity - oi.quantity,
      reserved_quantity = reserved_quantity - oi.quantity
  from order_items oi
  where oi.order_id = p_order_id and pv.id = oi.product_variant_id;

  update orders
    set status = 'payment_confirmed', reserved_until = null, confirmed_at = now()
    where id = p_order_id;
end;
$$;

-- =====================================================================
-- 16. RPC: CANCELAR PEDIDO (admin) -> libera reserva sin descontar stock
-- =====================================================================

create or replace function cancel_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from orders where id = p_order_id and status = 'pending_payment') then
    raise exception 'Solo se puede cancelar un pedido que esté Pendiente de Pago';
  end if;

  update product_variants pv
  set reserved_quantity = reserved_quantity - oi.quantity
  from order_items oi
  where oi.order_id = p_order_id and pv.id = oi.product_variant_id;

  update orders
    set status = 'cancelled', reserved_until = null
    where id = p_order_id;
end;
$$;

-- =====================================================================
-- 16.1 RPC: DESHACER CONFIRMACIÓN DE PAGO (admin se equivocó de botón)
-- =====================================================================
-- Inverso de confirm_order_payment: repone el stock permanente que se
-- había descontado y vuelve a poner la reserva (con una nueva ventana
-- de 2 horas, porque la original ya pudo haber vencido).

create or replace function revert_order_to_pending(p_order_id uuid, p_reservation_minutes int default 120)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from orders where id = p_order_id and status = 'payment_confirmed') then
    raise exception 'Solo se puede deshacer un pedido que esté en Pago Confirmado';
  end if;

  update product_variants pv
  set stock_quantity = stock_quantity + oi.quantity,
      reserved_quantity = reserved_quantity + oi.quantity
  from order_items oi
  where oi.order_id = p_order_id and pv.id = oi.product_variant_id;

  update orders
    set status = 'pending_payment',
        confirmed_at = null,
        reserved_until = now() + (p_reservation_minutes || ' minutes')::interval
    where id = p_order_id;
end;
$$;

-- =====================================================================
-- 17. FUNCIÓN DE CRON: LIBERAR RESERVAS VENCIDAS (2 horas por defecto)
-- =====================================================================
-- Se invoca periódicamente (cada 5 min) desde:
--   (a) pg_cron dentro de Supabase, o
--   (b) el job Node del backend (backend/src/jobs/releaseExpiredReservations.job.ts)
-- =====================================================================

create or replace function release_expired_reservations()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int := 0;
begin
  with expired as (
    update orders
    set status = 'expired', reserved_until = null
    where status = 'pending_payment' and reserved_until < now()
    returning id
  ),
  released_items as (
    select oi.product_variant_id, oi.quantity
    from order_items oi
    join expired e on e.id = oi.order_id
  )
  update product_variants pv
  set reserved_quantity = greatest(reserved_quantity - ri.quantity, 0)
  from released_items ri
  where pv.id = ri.product_variant_id;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Opcional si el plan de Supabase incluye pg_cron:
-- create extension if not exists pg_cron;
-- select cron.schedule('release-expired-reservations', '*/5 * * * *',
--   $$select release_expired_reservations();$$);

-- =====================================================================
-- 18. ROW LEVEL SECURITY (RLS)
-- =====================================================================

alter table seasons enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table product_images enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table invoices enable row level security;
alter table admin_profiles enable row level security;

-- --- Lectura pública del catálogo (rol anon) ---
create policy "public_read_seasons" on seasons for select using (is_active);
create policy "public_read_categories" on categories for select using (is_active);
create policy "public_read_products" on products for select using (is_active);
create policy "public_read_variants" on product_variants for select using (is_active);
create policy "public_read_images" on product_images for select using (true);

-- --- Gestión completa para administradores autenticados ---
create policy "admin_all_seasons" on seasons for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_all_categories" on categories for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_all_products" on products for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_all_variants" on product_variants for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_all_images" on product_images for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- --- Clientes y pedidos: sin lectura pública directa (privacidad) ---
-- La creación de pedidos ocurre exclusivamente vía la función RPC
-- (security definer), nunca por INSERT directo desde el cliente anónimo.
create policy "admin_all_customers" on customers for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_all_orders" on orders for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_all_order_items" on order_items for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_all_invoices" on invoices for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "self_read_admin_profile" on admin_profiles for select
  using (auth.uid() = id);

-- =====================================================================
-- 19. REALTIME: exponer tablas relevantes al canal de Supabase Realtime
-- =====================================================================

alter publication supabase_realtime add table product_variants;
alter publication supabase_realtime add table orders;

-- =====================================================================
-- 20. DATOS SEMILLA MÍNIMOS (opcional, útil para desarrollo local)
-- =====================================================================

insert into seasons (name, slug, display_order) values
  ('Verano', 'verano', 1),
  ('Invierno', 'invierno', 2),
  ('Primavera-Otoño', 'primavera-otono', 3)
on conflict (slug) do nothing;

insert into categories (name, slug, display_order) values
  ('Camisetas', 'camisetas', 1),
  ('Pantalones', 'pantalones', 2),
  ('Conjuntos', 'conjuntos', 3),
  ('Vestidos', 'vestidos', 4),
  ('Abrigos', 'abrigos', 5),
  ('Ropa de baño', 'ropa-de-bano', 6)
on conflict (slug) do nothing;

-- =====================================================================
-- 21. STORAGE: buckets para fotos de producto y comprobantes
-- =====================================================================
-- ProductForm sube a "product-images" con el cliente anon/authenticated
-- (necesita policies propias en storage.objects). El backend sube a
-- "invoices" con la Service Role Key, que ignora RLS por completo.

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
