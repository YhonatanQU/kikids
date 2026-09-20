import { useCartStore } from '@/store/cartStore';
import { formatPEN } from '@/lib/formatCurrency';

export function OrderSummary({ shippingCost }: { shippingCost: number }) {
  const { items, subtotal } = useCartStore();

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
      <h2 className="mb-3 font-semibold">Resumen del pedido</h2>
      {items.map((item) => (
        <div key={item.variantId} className="flex justify-between py-1 text-sm">
          <span>{item.productName} ({item.size}/{item.color}) x{item.quantity}</span>
          <span>{formatPEN(item.unitPrice * item.quantity)}</span>
        </div>
      ))}
      <div className="mt-3 space-y-1 border-t border-gray-200 pt-3 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatPEN(subtotal())}</span></div>
        <div className="flex justify-between"><span>Envío</span><span>{formatPEN(shippingCost)}</span></div>
        <div className="flex justify-between text-base font-bold"><span>Total</span><span>{formatPEN(subtotal() + shippingCost)}</span></div>
      </div>
    </div>
  );
}
