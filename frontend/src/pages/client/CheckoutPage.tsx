import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { OrderSummary } from '@/components/checkout/OrderSummary';

const SHIPPING_COST = 12;

export function CheckoutPage() {
  return (
    // Desktop: dos columnas (datos a la izquierda, resumen a la derecha).
    // Móvil: apilado, resumen primero para dar contexto antes del formulario.
    <div className="grid grid-cols-1 gap-6 px-4 py-6 md:grid-cols-2 md:px-8">
      <div className="order-2 md:order-1">
        <h1 className="mb-4 text-xl font-bold">Datos de envío</h1>
        <CheckoutForm />
      </div>
      <div className="order-1 md:order-2">
        <OrderSummary shippingCost={SHIPPING_COST} />
      </div>
    </div>
  );
}
