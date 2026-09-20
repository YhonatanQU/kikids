import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { OrderStatus } from '@/types/order';

interface OrderRow {
  id: string;
  order_number: string;
  status: OrderStatus;
  shipping_full_name: string;
  total: number;
  reserved_until: string | null;
  created_at: string;
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: 'Pendiente de Pago',
  payment_confirmed: 'Pago Confirmado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  expired: 'Expirado',
};

/** Bandeja de pedidos con Realtime: nuevos pedidos aparecen sin recargar. */
export function OrdersInbox() {
  const [orders, setOrders] = useState<OrderRow[]>([]);

  useEffect(() => {
    supabase
      .from('orders')
      .select('id, order_number, status, shipping_full_name, total, reserved_until, created_at')
      .order('created_at', { ascending: false })
      .then(({ data }) => setOrders((data as OrderRow[]) ?? []));

    const channel = supabase
      .channel('orders-inbox')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        setOrders((prev) => {
          const row = payload.new as OrderRow;
          const exists = prev.some((o) => o.id === row.id);
          return exists ? prev.map((o) => (o.id === row.id ? row : o)) : [row, ...prev];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function confirmPayment(orderId: string) {
    const { error } = await supabase.rpc('confirm_order_payment', { p_order_id: orderId });
    if (error) alert(error.message);
    // TODO: disparar generación de factura PDF vía backend Express tras confirmar.
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-100 bg-white">
      <table className="min-w-full divide-y divide-gray-100 text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3">Pedido</th>
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Reserva vence</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {orders.map((order) => (
            <tr key={order.id}>
              <td className="px-4 py-3 font-mono text-xs">{order.order_number}</td>
              <td className="px-4 py-3">{order.shipping_full_name}</td>
              <td className="px-4 py-3">S/ {order.total.toFixed(2)}</td>
              <td className="px-4 py-3">{STATUS_LABEL[order.status]}</td>
              <td className="px-4 py-3 text-xs text-gray-500">
                {order.reserved_until ? new Date(order.reserved_until).toLocaleString('es-PE') : '—'}
              </td>
              <td className="px-4 py-3">
                {order.status === 'pending_payment' && (
                  <button onClick={() => confirmPayment(order.id)} className="text-green-600 hover:underline">
                    Confirmar pago
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
