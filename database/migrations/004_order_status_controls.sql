-- =====================================================================
-- Migración: controles de estado del pedido en el admin
-- =====================================================================
-- 1) cancel_order ahora valida que el pedido esté "Pendiente de Pago"
--    antes de cancelar (antes cancelaba cualquier estado sin avisar,
--    incluyendo pedidos ya enviados/entregados).
-- 2) revert_order_to_pending: deshace un "Confirmar pago" hecho por
--    error, restaurando el stock que ya se había descontado en firme
--    y volviendo a reservarlo (con una ventana nueva de 2 horas).
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
