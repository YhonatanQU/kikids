import { useEffect } from 'react';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { syncCartPrices } from '@/lib/syncCartPrices';

export function CheckoutPage() {
  // Refresca precio/stock del carrito contra la base real antes de pagar
  // (el carrito persiste en localStorage y puede traer valores viejos).
  useEffect(() => {
    syncCartPrices();
  }, []);

  return (
    <div className="bg-ink-50 px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-2xl font-extrabold tracking-tight text-ink-900">Finalizar compra</h1>
        {/* Desktop: dos columnas (datos a la izquierda, resumen a la derecha). */}
        {/* Móvil: apilado, resumen primero para dar contexto antes del formulario. */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[1.3fr_1fr] md:items-start">
          <div className="order-2 md:order-1">
            <CheckoutForm />
          </div>
          <div className="order-1 md:order-2 md:sticky md:top-20">
            <OrderSummary />
          </div>
        </div>
      </div>
    </div>
  );
}
