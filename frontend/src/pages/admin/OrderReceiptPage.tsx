import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { mapAdminOrderRow, mapAdminOrderItemRow } from '@/lib/mappers';
import { ORDER_STATUS_STYLE } from '@/lib/orderStatus';
import { formatPEN } from '@/lib/formatCurrency';
import { sizeLabel } from '@/lib/sizes';
import type { AdminOrder, AdminOrderItem } from '@/types/order';

const SELECT_QUERY = `id, order_number, status, shipping_full_name, shipping_phone,
  shipping_address, shipping_district, shipping_city, shipping_reference,
  payment_method, payment_operation_number, subtotal, shipping_cost, total, currency, reserved_until,
  confirmed_at, created_at, customers(email)`;

/** Comprobante imprimible de un pedido — página aparte (sin sidebar/menú
 * admin) para que "Imprimir" del navegador solo capture este contenido. */
export function OrderReceiptPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [items, setItems] = useState<AdminOrderItem[]>([]);

  useEffect(() => {
    if (!orderId) return;
    Promise.all([
      supabase.from('orders').select(SELECT_QUERY).eq('id', orderId).single(),
      supabase
        .from('order_items')
        .select('id, product_name_snapshot, size_snapshot, color_snapshot, sku_snapshot, quantity, unit_price, subtotal')
        .eq('order_id', orderId),
    ]).then(([orderRes, itemsRes]) => {
      if (orderRes.data) setOrder(mapAdminOrderRow(orderRes.data));
      setItems((itemsRes.data ?? []).map(mapAdminOrderItemRow));
    });
  }, [orderId]);

  useEffect(() => {
    if (!order) return;
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, [order]);

  if (!order) {
    return <div className="p-8 text-sm text-ink-400">Cargando comprobante...</div>;
  }

  const status = ORDER_STATUS_STYLE[order.status];

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link to="/admin/pedidos" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
          ← Volver a pedidos
        </Link>
        <button
          onClick={() => window.print()}
          className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Imprimir
        </button>
      </div>

      <div className="flex items-start justify-between border-b border-ink-200 pb-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink-900">KIKIDS</h1>
          <p className="text-xs text-ink-400">Moda infantil · Perú</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-sm font-bold text-ink-800">#{order.orderNumber}</p>
          <p className="text-xs text-ink-400">{new Date(order.createdAt).toLocaleString('es-PE')}</p>
          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.className}`}>
            {status.label}
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-6 text-sm">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wide text-ink-400">Cliente</h2>
          <p className="mt-1 text-ink-800">{order.shippingFullName}</p>
          <p className="text-ink-600">{order.shippingPhone}</p>
          {order.customerEmail && <p className="text-ink-600">{order.customerEmail}</p>}
        </div>
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wide text-ink-400">Envío</h2>
          <p className="mt-1 text-ink-800">{order.shippingAddress}</p>
          <p className="text-ink-600">{order.shippingDistrict}, {order.shippingCity}</p>
          {order.shippingReference && <p className="text-ink-400">Ref: {order.shippingReference}</p>}
        </div>
      </div>

      {order.paymentMethod && (
        <div className="mt-5 rounded-xl border border-ink-100 px-4 py-3 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-500">Método de pago</span>
            <span className="font-semibold text-ink-800">{order.paymentMethod}</span>
          </div>
          {order.paymentOperationNumber && (
            <div className="mt-1 flex justify-between">
              <span className="text-ink-500">N° de operación</span>
              <span className="font-mono font-semibold text-ink-800">{order.paymentOperationNumber}</span>
            </div>
          )}
        </div>
      )}

      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-400">
            <th className="pb-2">Prenda</th>
            <th className="pb-2 text-center">Cant.</th>
            <th className="pb-2 text-right">Precio</th>
            <th className="pb-2 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="py-2">
                <p className="font-medium text-ink-800">{item.productName}</p>
                <p className="text-xs text-ink-400">
                  Talla {sizeLabel(item.size)}
                  {item.color && ` · ${item.color}`}
                  {item.sku && ` · SKU ${item.sku}`}
                </p>
              </td>
              <td className="py-2 text-center text-ink-700">{item.quantity}</td>
              <td className="py-2 text-right text-ink-700">{formatPEN(item.unitPrice)}</td>
              <td className="py-2 text-right font-semibold text-ink-800">{formatPEN(item.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 space-y-1 border-t border-dashed border-ink-200 pt-4 text-sm">
        <div className="flex justify-between text-ink-500">
          <span>Subtotal</span>
          <span>{formatPEN(order.subtotal)}</span>
        </div>
        {order.shippingCost > 0 && (
          <div className="flex justify-between text-ink-500">
            <span>Envío</span>
            <span>{formatPEN(order.shippingCost)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-extrabold text-ink-900">
          <span>Total</span>
          <span>{formatPEN(order.total)}</span>
        </div>
      </div>
    </div>
  );
}
