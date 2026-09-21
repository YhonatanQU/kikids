import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card } from '@/components/ui/Card';
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

const STATUS_STYLE: Record<OrderStatus, { label: string; className: string }> = {
  pending_payment: { label: 'Pendiente de Pago', className: 'bg-amber-50 text-amber-700' },
  payment_confirmed: { label: 'Pago Confirmado', className: 'bg-emerald-50 text-emerald-700' },
  shipped: { label: 'Enviado', className: 'bg-blue-50 text-blue-700' },
  delivered: { label: 'Entregado', className: 'bg-ink-100 text-ink-600' },
  cancelled: { label: 'Cancelado', className: 'bg-red-50 text-red-600' },
  expired: { label: 'Expirado', className: 'bg-ink-100 text-ink-400' },
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

  if (orders.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-ink-400">Todavía no hay pedidos.</p>
      </Card>
    );
  }

  return (
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
            const status = STATUS_STYLE[order.status];
            return (
              <tr key={order.id} className="transition-colors hover:bg-ink-50/50">
                <td className="px-4 py-3 font-mono text-xs text-ink-500">{order.order_number}</td>
                <td className="px-4 py-3 font-medium text-ink-800">{order.shipping_full_name}</td>
                <td className="px-4 py-3 font-semibold text-ink-800">S/ {order.total.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span>
                </td>
                <td className="px-4 py-3 text-xs text-ink-400">
                  {order.reserved_until ? new Date(order.reserved_until).toLocaleString('es-PE') : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  {order.status === 'pending_payment' && (
                    <button onClick={() => confirmPayment(order.id)} className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">
                      Confirmar pago
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
