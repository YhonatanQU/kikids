import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { mapAdminOrderItemRow } from '@/lib/mappers';
import { ORDER_STATUS_STYLE } from '@/lib/orderStatus';
import { formatPEN } from '@/lib/formatCurrency';
import { sizeLabel } from '@/lib/sizes';
import { Button } from '@/components/ui/Button';
import type { AdminOrder, AdminOrderItem } from '@/types/order';

interface Props {
  order: AdminOrder | null;
  onClose: () => void;
  onChanged: () => void;
}

const PAYMENT_BADGE: Record<string, string> = {
  Yape: 'bg-[#742284]',
  Plin: 'bg-gradient-to-br from-[#00C4B3] to-[#5B3DF5]',
  Transferencia: 'bg-ink-700',
};

export function OrderDetailDrawer({ order, onClose, onChanged }: Props) {
  const [items, setItems] = useState<AdminOrderItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!order) return;
    setLoadingItems(true);
    setActionError(null);
    supabase
      .from('order_items')
      .select('id, product_name_snapshot, size_snapshot, color_snapshot, sku_snapshot, quantity, unit_price, subtotal')
      .eq('order_id', order.id)
      .then(({ data }) => {
        setItems((data ?? []).map(mapAdminOrderItemRow));
        setLoadingItems(false);
      });
  }, [order]);

  if (!order) return null;

  async function runAction(fn: () => PromiseLike<{ error: { message: string } | null }>, confirmMsg?: string) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setActionLoading(true);
    setActionError(null);
    const { error } = await fn();
    setActionLoading(false);
    if (error) {
      setActionError(error.message);
      return;
    }
    onChanged();
    onClose();
  }

  const status = ORDER_STATUS_STYLE[order.status];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink-900/40 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white p-6 shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-start justify-between">
          <div>
            <p className="font-mono text-xs text-ink-400">#{order.orderNumber}</p>
            <h2 className="text-lg font-extrabold text-ink-900">{order.shippingFullName}</h2>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-50 hover:text-ink-700">
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <span className={`mb-6 inline-block w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>
          {status.label}
        </span>

        <section className="mb-5">
          <h3 className="text-xs font-bold uppercase tracking-wide text-ink-400">Cliente</h3>
          <div className="mt-2 space-y-0.5 text-sm text-ink-700">
            <p>{order.shippingFullName}</p>
            <p>{order.shippingPhone}</p>
            {order.customerEmail && <p>{order.customerEmail}</p>}
          </div>
        </section>

        <section className="mb-5">
          <h3 className="text-xs font-bold uppercase tracking-wide text-ink-400">Dirección de envío</h3>
          <div className="mt-2 space-y-0.5 text-sm text-ink-700">
            <p>{order.shippingAddress}</p>
            <p>{order.shippingDistrict}, {order.shippingCity}</p>
            {order.shippingReference && <p className="text-ink-400">Ref: {order.shippingReference}</p>}
          </div>
        </section>

        {order.paymentMethod && (
          <section className="mb-5">
            <h3 className="text-xs font-bold uppercase tracking-wide text-ink-400">Método de pago</h3>
            <div className="mt-2 flex items-center gap-2">
              <span className={`h-6 w-6 rounded-lg ${PAYMENT_BADGE[order.paymentMethod] ?? 'bg-ink-400'}`} />
              <span className="text-sm font-medium text-ink-700">{order.paymentMethod}</span>
            </div>
          </section>
        )}

        <section className="mb-5">
          <h3 className="text-xs font-bold uppercase tracking-wide text-ink-400">Prendas</h3>
          {loadingItems ? (
            <p className="mt-2 text-sm text-ink-400">Cargando...</p>
          ) : (
            <div className="mt-2 divide-y divide-ink-100 rounded-xl border border-ink-100">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-3 py-2.5 text-sm">
                  <div>
                    <p className="font-medium text-ink-800">{item.productName}</p>
                    <p className="text-xs text-ink-400">Talla {sizeLabel(item.size)} · {item.color} · x{item.quantity}</p>
                    {item.sku && <p className="font-mono text-[11px] text-ink-300">SKU: {item.sku}</p>}
                  </div>
                  <span className="font-semibold text-ink-700">{formatPEN(item.subtotal)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mb-6 space-y-1.5 border-t border-dashed border-ink-200 pt-4 text-sm">
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
            <span className="text-brand-600">{formatPEN(order.total)}</span>
          </div>
        </section>

        {order.reservedUntil && order.status === 'pending_payment' && (
          <p className="mb-4 text-xs text-ink-400">
            Reserva vence: {new Date(order.reservedUntil).toLocaleString('es-PE')}
          </p>
        )}

        {actionError && <div className="mb-4 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{actionError}</div>}

        <div className="mt-auto flex flex-col gap-2 border-t border-ink-100 pt-4">
          {order.status === 'pending_payment' && (
            <>
              <Button
                loading={actionLoading}
                onClick={() => runAction(() => supabase.rpc('confirm_order_payment', { p_order_id: order.id }))}
              >
                Confirmar pago
              </Button>
              <Button
                variant="danger"
                loading={actionLoading}
                onClick={() =>
                  runAction(
                    () => supabase.rpc('cancel_order', { p_order_id: order.id }),
                    '¿Cancelar este pedido? Se liberará el stock reservado.'
                  )
                }
              >
                Cancelar pedido
              </Button>
            </>
          )}

          {order.status === 'payment_confirmed' && (
            <>
              <Button
                loading={actionLoading}
                onClick={() => runAction(() => supabase.from('orders').update({ status: 'shipped' }).eq('id', order.id))}
              >
                Marcar como enviado
              </Button>
              <Button
                variant="secondary"
                loading={actionLoading}
                onClick={() =>
                  runAction(
                    () => supabase.rpc('revert_order_to_pending', { p_order_id: order.id }),
                    '¿Deshacer la confirmación de pago? Esto repone el stock descontado y vuelve a reservar el pedido por 2 horas.'
                  )
                }
              >
                Deshacer confirmación (me equivoqué)
              </Button>
            </>
          )}

          {order.status === 'shipped' && (
            <Button
              loading={actionLoading}
              onClick={() => runAction(() => supabase.from('orders').update({ status: 'delivered' }).eq('id', order.id))}
            >
              Marcar como entregado
            </Button>
          )}

          {['delivered', 'cancelled', 'expired'].includes(order.status) && (
            <p className="text-center text-xs text-ink-400">Este pedido ya no tiene acciones disponibles.</p>
          )}
        </div>
      </div>
    </div>
  );
}
