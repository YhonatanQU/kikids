import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { mapAdminOrderRow } from '@/lib/mappers';
import { ORDER_STATUS_STYLE } from '@/lib/orderStatus';
import { formatPEN } from '@/lib/formatCurrency';
import { Card } from '@/components/ui/Card';
import { OrderDetailDrawer } from './OrderDetailDrawer';
import type { AdminOrder } from '@/types/order';

const SELECT_QUERY = `id, order_number, status, shipping_full_name, shipping_phone,
  shipping_address, shipping_district, shipping_city, shipping_reference,
  payment_method, payment_operation_number, subtotal, shipping_cost, total, currency, reserved_until,
  confirmed_at, created_at, customers(email)`;

/** Bandeja de pedidos con Realtime: nuevos pedidos y cambios de estado aparecen sin recargar. */
export function OrdersInbox() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  function loadOrders() {
    supabase
      .from('orders')
      .select(SELECT_QUERY)
      .order('created_at', { ascending: false })
      .then(({ data }) => setOrders((data ?? []).map(mapAdminOrderRow)));
  }

  useEffect(() => {
    loadOrders();

    // El payload de Realtime solo trae columnas de "orders" (sin el join a
    // customers), así que al fusionar conservamos el email que ya teníamos.
    const channel = supabase
      .channel('orders-inbox')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        const incoming = mapAdminOrderRow(payload.new);
        setOrders((prev) => {
          const idx = prev.findIndex((o) => o.id === incoming.id);
          if (idx === -1) return [incoming, ...prev];
          const merged = { ...incoming, customerEmail: prev[idx].customerEmail };
          return prev.map((o, i) => (i === idx ? merged : o));
        });
        setSelectedOrder((prev) => (prev && prev.id === incoming.id ? { ...incoming, customerEmail: prev.customerEmail } : prev));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (orders.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-ink-400">Todavía no hay pedidos.</p>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-x-auto">
        <table className="min-w-full divide-y divide-ink-100 text-sm">
          <thead className="bg-ink-50/70 text-left text-xs font-semibold uppercase tracking-wide text-ink-400">
            <tr>
              <th className="px-4 py-3">Pedido</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Reserva vence</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {orders.map((order) => {
              const status = ORDER_STATUS_STYLE[order.status];
              return (
                <tr key={order.id} className="cursor-pointer transition-colors hover:bg-ink-50/50" onClick={() => setSelectedOrder(order)}>
                  <td className="px-4 py-3 font-mono text-xs text-ink-500">{order.orderNumber}</td>
                  <td className="px-4 py-3 font-medium text-ink-800">{order.shippingFullName}</td>
                  <td className="px-4 py-3 font-semibold text-ink-800">{formatPEN(order.total)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-400">
                    {order.reservedUntil ? new Date(order.reservedUntil).toLocaleString('es-PE') : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setSelectedOrder(order)} className="text-sm font-semibold text-brand-600 hover:text-brand-700">
                      Ver detalle
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <OrderDetailDrawer
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onChanged={loadOrders}
      />
    </>
  );
}
