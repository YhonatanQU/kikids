import { useCartStore } from '@/store/cartStore';
import { formatPEN } from '@/lib/formatCurrency';
import { Card } from '@/components/ui/Card';

export function OrderSummary({ shippingCost }: { shippingCost: number }) {
  const { items, subtotal } = useCartStore();

  return (
    <Card className="p-6 sm:p-7">
      <h2 className="text-base font-bold text-ink-900">Resumen del pedido</h2>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.variantId} className="flex items-center justify-between gap-3 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium text-ink-800">{item.productName}</p>
              <p className="text-xs text-ink-400">Talla {item.size} · {item.color} · x{item.quantity}</p>
            </div>
            <span className="shrink-0 font-semibold text-ink-700">{formatPEN(item.unitPrice * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-2 border-t border-dashed border-ink-200 pt-4 text-sm">
        <div className="flex justify-between text-ink-500">
          <span>Subtotal</span>
          <span>{formatPEN(subtotal())}</span>
        </div>
        <div className="flex justify-between text-ink-500">
          <span>Envío</span>
          <span>{formatPEN(shippingCost)}</span>
        </div>
        <div className="flex justify-between border-t border-ink-100 pt-2 text-base font-extrabold text-ink-900">
          <span>Total</span>
          <span className="text-brand-600">{formatPEN(subtotal() + shippingCost)}</span>
        </div>
      </div>
    </Card>
  );
}
