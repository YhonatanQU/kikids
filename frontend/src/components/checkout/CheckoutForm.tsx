import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useCartStore } from '@/store/cartStore';
import { buildWhatsAppLink, buildWhatsAppMessage } from '@/lib/whatsapp';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import type { PaymentMethod, ShippingInfo } from '@/types/order';

export function CheckoutForm() {
  const navigate = useNavigate();
  const { items, clear } = useCartStore();
  const [shipping, setShipping] = useState<ShippingInfo>({
    fullName: '', phone: '', email: '', address: '', city: 'Lima', reference: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Yape');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Paso 1: reserva atómica de stock + creación de pedido en Postgres.
    // Ver database/schema.sql -> create_order_with_reservation (usa
    // SELECT ... FOR UPDATE para evitar sobreventa).
    const { data, error: rpcError } = await supabase.rpc('create_order_with_reservation', {
      p_customer_name: shipping.fullName,
      p_customer_phone: shipping.phone,
      p_customer_email: shipping.email || null,
      p_shipping_address: shipping.address,
      p_shipping_district: shipping.city, // trabajamos por agencia Shalom, no por distrito puntual
      p_shipping_city: shipping.city,
      p_shipping_reference: shipping.reference || null,
      p_payment_method: paymentMethod,
      p_shipping_cost: 0,
      p_items: items.map((i) => ({ variant_id: i.variantId, quantity: i.quantity })),
      p_reservation_minutes: 120,
    });

    setSubmitting(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    const order = Array.isArray(data) ? data[0] : data;
    const total = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

    // Paso 2: no abrimos WhatsApp acá — hacerlo después de un await ya no
    // cuenta como gesto directo del usuario y el navegador lo bloquea (o,
    // si se abre una pestaña en blanco de antemano para evitarlo, el
    // cliente ve esa pestaña vacía por un instante). En vez de eso, se
    // arma el enlace y se pasa a la página de confirmación, donde un botón
    // lo abre al toque — ahí sí es un clic directo, sin pestaña en blanco.
    const message = buildWhatsAppMessage({ orderNumber: order.order_number, shipping, paymentMethod, items, total });
    const storeNumber = import.meta.env.VITE_WHATSAPP_STORE_NUMBER;
    const whatsappLink = buildWhatsAppLink(storeNumber, message);

    clear();
    navigate(`/pedido-confirmado/${order.order_number}`, { state: { whatsappLink } });
  }

  return (
    <Card className="p-6 sm:p-7">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <h2 className="text-base font-bold text-ink-900">Datos de contacto</h2>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Nombre completo"
              required
              placeholder="María Torres"
              value={shipping.fullName}
              onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })}
            />
            <Input
              label="Teléfono (WhatsApp)"
              required
              placeholder="987 654 321"
              value={shipping.phone}
              onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
            />
          </div>
          <div className="mt-4">
            <Input
              label="Email (opcional)"
              type="email"
              placeholder="tu@correo.com"
              value={shipping.email}
              onChange={(e) => setShipping({ ...shipping, email: e.target.value })}
            />
          </div>
        </div>

        <div className="border-t border-ink-100 pt-5">
          <h2 className="text-base font-bold text-ink-900">Envío por agencia Shalom</h2>
          <p className="mt-1 text-sm text-ink-500">
            Trabajamos solo con la agencia Shalom. Cuéntanos la dirección de la agencia Shalom más cercana a ti para
            coordinar el envío — no necesitas buscar tu dirección exacta.
          </p>

          <div className="mt-3 space-y-4">
            <Input
              label="Ciudad"
              required
              placeholder="Lima"
              value={shipping.city}
              onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
            />
            <Input
              label="Dirección de la agencia Shalom más cercana"
              required
              placeholder="Ej. Agencia Shalom Av. Abancay 123, Cercado de Lima"
              value={shipping.address}
              onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
            />
            <Input
              label="Referencia (opcional)"
              placeholder="Alguna seña para ubicar la agencia..."
              value={shipping.reference}
              onChange={(e) => setShipping({ ...shipping, reference: e.target.value })}
            />
          </div>
        </div>

        <div className="border-t border-ink-100 pt-5">
          <h2 className="text-base font-bold text-ink-900">Método de pago</h2>
          <div className="mt-3">
            <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />
          </div>
        </div>

        {error && <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{error}</div>}

        <Button type="submit" variant="whatsapp" fullWidth size="lg" loading={submitting} disabled={items.length === 0}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12.001 2C6.478 2 2 6.477 2 12c0 1.86.505 3.686 1.463 5.278L2 22l4.828-1.44A9.96 9.96 0 0012.001 22C17.523 22 22 17.523 22 12S17.523 2 12.001 2zm0 18.222c-1.635 0-3.234-.44-4.63-1.272l-.331-.196-2.865.854.86-2.797-.216-.343A8.19 8.19 0 013.778 12c0-4.535 3.688-8.222 8.223-8.222 4.535 0 8.222 3.687 8.222 8.222 0 4.535-3.687 8.222-8.222 8.222z" />
          </svg>
          Confirmar y pagar por WhatsApp
        </Button>
      </form>
    </Card>
  );
}
