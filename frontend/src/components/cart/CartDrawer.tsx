import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCartStore } from '@/store/cartStore';
import { CartItem } from './CartItem';
import { formatPEN } from '@/lib/formatCurrency';
import { Button } from '@/components/ui/Button';
import { syncCartPrices } from '@/lib/syncCartPrices';

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, subtotal } = useCartStore();

  // Refresca precio/stock contra la base real cada vez que se abre el
  // carrito (localStorage puede traer un precio congelado de otra sesión).
  useEffect(() => {
    if (open) syncCartPrices();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink-900/40 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-sm flex-col bg-white p-5 shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-ink-900">Tu carrito</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-50 hover:text-ink-700">
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <svg viewBox="0 0 24 24" fill="none" className="h-12 w-12 text-ink-200">
                <path d="M3 3h2l.4 2M7 13h10l3-7H5.4M7 13L5.4 5M7 13l-2 5h13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="mt-3 text-sm text-ink-400">Tu carrito está vacío</p>
            </div>
          )}
          {items.map((item) => (
            <CartItem key={item.variantId} item={item} />
          ))}
        </div>

        {items.length > 0 && (
          <div className="mt-4 border-t border-ink-100 pt-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-medium text-ink-500">Subtotal</span>
              <span className="text-lg font-extrabold text-ink-900">{formatPEN(subtotal())}</span>
            </div>
            <Link to="/checkout" onClick={onClose}>
              <Button fullWidth size="lg">Ir a checkout</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
