import type { OrderStatus } from '@/types/order';

export const ORDER_STATUS_STYLE: Record<OrderStatus, { label: string; className: string }> = {
  pending_payment: { label: 'Pendiente de Pago', className: 'bg-amber-50 text-amber-700' },
  payment_confirmed: { label: 'Pago Confirmado', className: 'bg-emerald-50 text-emerald-700' },
  shipped: { label: 'Enviado', className: 'bg-blue-50 text-blue-700' },
  delivered: { label: 'Entregado', className: 'bg-ink-100 text-ink-600' },
  cancelled: { label: 'Cancelado', className: 'bg-red-50 text-red-600' },
  expired: { label: 'Expirado', className: 'bg-ink-100 text-ink-400' },
};
