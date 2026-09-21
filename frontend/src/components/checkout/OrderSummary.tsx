import { useCartStore } from '@/store/cartStore';
import { formatPEN } from '@/lib/formatCurrency';
import { Card } from '@/components/ui/Card';

export function OrderSummary() {
  const { items, subtotal } = useCartStore();
  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <Card className="p-6 sm:p-7">
      <div className="flex items-baseline justify-between">
        <h2 className="text-base font-bold text-ink-900">Resumen del pedido</h2>
        <span className="text-xs text-ink-400">{totalQuantity} {totalQuantity === 1 ? 'prenda' : 'prendas'}</span>
      </div>

      <div className="mt-4 divide-y divide-ink-100">
        {items.map((item) => (
          <div key={item.variantId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-ink-100">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-ink-300">
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M3 16l5-5 4 4 5-6 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink-800">{item.productName}</p>
              <p className="text-xs text-ink-400">Talla {item.size}{item.color && ` · ${item.color}`}</p>
              <p className="mt-0.5 text-xs text-ink-500">{formatPEN(item.unitPrice)} × {item.quantity}</p>
            </div>
            <span className="shrink-0 text-sm font-bold text-ink-800">{formatPEN(item.unitPrice * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex justify-between border-t border-dashed border-ink-200 pt-4 text-base font-extrabold text-ink-900">
        <span>Total</span>
        <span className="text-brand-600">{formatPEN(subtotal())}</span>
      </div>
    </Card>
  );
}
