import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useCartStore } from '@/store/cartStore';
import { buildWhatsAppLink, buildWhatsAppMessage } from '@/lib/whatsapp';
import type { PaymentMethod, ShippingInfo } from '@/types/order';

const SHIPPING_COST = 12; // TODO: reglas reales de envío por distrito

export function CheckoutForm() {
  const navigate = useNavigate();
  const { items, clear } = useCartStore();
  const [shipping, setShipping] = useState<ShippingInfo>({
    fullName: '', phone: '', email: '', address: '', district: '', city: 'Lima', reference: '',
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
      p_shipping_district: shipping.district,
      p_shipping_city: shipping.city,
      p_shipping_reference: shipping.reference || null,
      p_payment_method: paymentMethod,
      p_shipping_cost: SHIPPING_COST,
      p_items: items.map((i) => ({ variant_id: i.variantId, quantity: i.quantity })),
      p_reservation_minutes: 120,
    });

    setSubmitting(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    const order = Array.isArray(data) ? data[0] : data;
    const total = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0) + SHIPPING_COST;

    // Paso 2: abrir WhatsApp con el mensaje estructurado.
    const message = buildWhatsAppMessage({ orderNumber: order.order_number, shipping, items, total });
    const storeNumber = import.meta.env.VITE_WHATSAPP_STORE_NUMBER;
    window.open(buildWhatsAppLink(storeNumber, message), '_blank');

    clear();
    navigate(`/pedido-confirmado/${order.order_number}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input required placeholder="Nombre completo" className="w-full rounded-md border border-gray-300 px-3 py-2"
        value={shipping.fullName} onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })} />
      <input required placeholder="Teléfono (WhatsApp)" className="w-full rounded-md border border-gray-300 px-3 py-2"
        value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} />
      <input placeholder="Email (opcional)" className="w-full rounded-md border border-gray-300 px-3 py-2"
        value={shipping.email} onChange={(e) => setShipping({ ...shipping, email: e.target.value })} />
      <input required placeholder="Dirección" className="w-full rounded-md border border-gray-300 px-3 py-2"
        value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} />
      <div className="grid grid-cols-2 gap-3">
        <input required placeholder="Distrito" className="rounded-md border border-gray-300 px-3 py-2"
          value={shipping.district} onChange={(e) => setShipping({ ...shipping, district: e.target.value })} />
        <input required placeholder="Ciudad" className="rounded-md border border-gray-300 px-3 py-2"
          value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} />
      </div>
      <input placeholder="Referencia (opcional)" className="w-full rounded-md border border-gray-300 px-3 py-2"
        value={shipping.reference} onChange={(e) => setShipping({ ...shipping, reference: e.target.value })} />

      <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
        className="w-full rounded-md border border-gray-300 px-3 py-2">
        <option value="Yape">Yape</option>
        <option value="Plin">Plin</option>
        <option value="Transferencia">Transferencia bancaria</option>
      </select>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={submitting || items.length === 0}
        className="w-full rounded-md bg-green-600 py-3 font-medium text-white disabled:opacity-40">
        {submitting ? 'Procesando...' : 'Confirmar y pagar por WhatsApp'}
      </button>
    </form>
  );
}
