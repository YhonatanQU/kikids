import type { CartItem as CartItemType } from '@/store/cartStore';
import { useCartStore } from '@/store/cartStore';
import { formatPEN } from '@/lib/formatCurrency';

export function CartItem({ item }: { item: CartItemType }) {
  const { updateQuantity, removeItem } = useCartStore();

  return (
    <div className="flex items-center gap-3 border-b border-gray-100 py-3">
      {item.imageUrl && (
        <img src={item.imageUrl} alt={item.productName} className="h-16 w-16 rounded object-cover" />
      )}
      <div className="flex-1">
        <p className="text-sm font-medium">{item.productName}</p>
        <p className="text-xs text-gray-500">Talla {item.size} · {item.color}</p>
        <div className="mt-1 flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={item.availableQuantity}
            value={item.quantity}
            onChange={(e) => updateQuantity(item.variantId, Number(e.target.value))}
            className="w-14 rounded border border-gray-200 px-2 py-1 text-sm"
          />
          <button onClick={() => removeItem(item.variantId)} className="text-xs text-red-500">
            Quitar
          </button>
        </div>
      </div>
      <p className="text-sm font-semibold">{formatPEN(item.unitPrice * item.quantity)}</p>
    </div>
  );
}
