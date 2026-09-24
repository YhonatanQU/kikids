-- Número de operación bancaria: se pide al confirmar el pago (Yape/Plin/
-- transferencia) para tener trazabilidad de qué operación corresponde a
-- qué pedido, y poder imprimir el comprobante con ese dato.
alter table orders
  add column payment_operation_number text;

-- La firma cambia (se agrega p_operation_number) — hay que borrar la
-- versión anterior explícitamente, porque "create or replace" con una
-- lista de parámetros distinta crea una sobrecarga nueva en vez de
-- reemplazar la función vieja.
drop function if exists confirm_order_payment(uuid);

create or replace function confirm_order_payment(p_order_id uuid, p_operation_number text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from orders where id = p_order_id and status = 'pending_payment') then
    raise exception 'El pedido no está en estado pendiente de pago';
  end if;

  if p_operation_number is null or btrim(p_operation_number) = '' then
    raise exception 'Debes ingresar el número de operación bancaria';
  end if;

  update product_variants pv
  set stock_quantity = stock_quantity - oi.quantity,
      reserved_quantity = reserved_quantity - oi.quantity
  from order_items oi
  where oi.order_id = p_order_id and pv.id = oi.product_variant_id;

  update orders
    set status = 'payment_confirmed', reserved_until = null, confirmed_at = now(),
        payment_operation_number = btrim(p_operation_number)
    where id = p_order_id;
end;
$$;

-- Al deshacer una confirmación (admin se equivocó), se limpia el número
-- de operación: si vuelve a confirmar, debe ingresarlo de nuevo en vez
-- de arrastrar un dato que puede ya no corresponder.
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
        payment_operation_number = null,
        reserved_until = now() + (p_reservation_minutes || ' minutes')::interval
    where id = p_order_id;
end;
$$;
