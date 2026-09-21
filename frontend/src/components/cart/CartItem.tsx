import type { CartItem as CartItemType } from '@/store/cartStore';
import { useCartStore } from '@/store/cartStore';
import { formatPEN } from '@/lib/formatCurrency';
import { sizeLabel } from '@/lib/sizes';

export function CartItem({ item }: { item: CartItemType }) {
  const { updateQuantity, removeItem } = useCartStore();

  return (
    <div className="flex items-center gap-3 border-b border-ink-100 py-3.5 last:border-0">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-ink-100">
        {item.imageUrl && <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink-800">{item.productName}</p>
        <p className="text-xs text-ink-400">Talla {sizeLabel(item.size)} · {item.color}</p>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-ink-200">
            <button
              onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
              className="flex h-7 w-7 items-center justify-center text-ink-500 hover:text-ink-800"
            >
              −
            </button>
            <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
            <button
              onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
              className="flex h-7 w-7 items-center justify-center text-ink-500 hover:text-ink-800"
            >
              +
            </button>
          </div>
          <button onClick={() => removeItem(item.variantId)} className="text-xs font-medium text-red-400 hover:text-red-600">
            Quitar
          </button>
        </div>
      </div>
      <p className="shrink-0 text-sm font-bold text-ink-900">{formatPEN(item.unitPrice * item.quantity)}</p>
    </div>
  );
}
