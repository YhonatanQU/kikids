-- Descuentos por producto: porcentaje + interruptor de activación
-- independiente, para poder guardar un % y prenderlo/apagarlo sin
-- perder el valor configurado.
alter table products
  add column discount_percentage numeric(5,2) not null default 0
    check (discount_percentage >= 0 and discount_percentage <= 100),
  add column discount_active boolean not null default false;

-- El precio que se cobra en el checkout (y el mensaje de WhatsApp) debe
-- salir de la base de datos al momento de confirmar, no de lo que el
-- cliente tenía "congelado" en su carrito — así el descuento vigente
-- siempre se respeta y nadie puede manipular el precio desde el cliente.
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
