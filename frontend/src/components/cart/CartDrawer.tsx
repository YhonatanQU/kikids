import { Link } from 'react-router-dom';
import { useCartStore } from '@/store/cartStore';
import { CartItem } from './CartItem';
import { formatPEN } from '@/lib/formatCurrency';

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, subtotal } = useCartStore();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-sm flex-col bg-white p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Tu carrito</h2>
          <button onClick={onClose} className="text-gray-400">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 && <p className="text-gray-500">Tu carrito está vacío.</p>}
          {items.map((item) => (
            <CartItem key={item.variantId} item={item} />
          ))}
        </div>

        {items.length > 0 && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <div className="mb-3 flex justify-between font-semibold">
              <span>Subtotal</span>
              <span>{formatPEN(subtotal())}</span>
            </div>
            <Link
              to="/checkout"
              onClick={onClose}
              className="block w-full rounded-md bg-brand-600 py-3 text-center font-medium text-white"
            >
              Ir a checkout
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
