import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useCartStore } from '@/store/cartStore';
import { buildWhatsAppLink, buildWhatsAppMessage } from '@/lib/whatsapp';
import { getCurrentPosition, reverseGeocode, googleMapsLink } from '@/lib/geolocation';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import type { PaymentMethod, ShippingInfo } from '@/types/order';

export function CheckoutForm() {
  const navigate = useNavigate();
  const { items, clear } = useCartStore();
  const [shipping, setShipping] = useState<ShippingInfo>({
    fullName: '', phone: '', email: '', address: '', district: '', city: 'Lima', reference: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Yape');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [mapLink, setMapLink] = useState<string | null>(null);

  async function handleUseMyLocation() {
    setLocating(true);
    setLocationError(null);
    try {
      const coords = await getCurrentPosition();
      const result = await reverseGeocode(coords);
      setShipping((prev) => ({
        ...prev,
        address: result.address || prev.address,
        district: result.district || prev.district,
        city: result.city || prev.city,
      }));
      setMapLink(googleMapsLink(coords));
    } catch (err) {
      setLocationError(err instanceof Error ? err.message : 'No se pudo obtener tu ubicación.');
    } finally {
      setLocating(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Abrir la pestaña ANTES del await: si se abre después de esperar la
    // respuesta del servidor, el navegador ya no lo asocia al clic del
    // usuario y el bloqueador de pop-ups lo descarta en silencio (sin
    // error visible) — así se manda el pedido pero nunca abre WhatsApp.
    const whatsappWindow = window.open('', '_blank');

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
      p_shipping_cost: 0,
      p_items: items.map((i) => ({ variant_id: i.variantId, quantity: i.quantity })),
      p_reservation_minutes: 120,
    });

    setSubmitting(false);

    if (rpcError) {
      whatsappWindow?.close(); // cerrar la pestaña en blanco: el pedido no se creó
      setError(rpcError.message);
      return;
    }

    const order = Array.isArray(data) ? data[0] : data;
    const total = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

    // Paso 2: llevar la pestaña ya abierta hasta WhatsApp con el mensaje
    // estructurado. Si el navegador bloqueó incluso la pestaña en blanco,
    // se intenta un window.open normal como último recurso.
    const message = buildWhatsAppMessage({ orderNumber: order.order_number, shipping, items, total });
    const storeNumber = import.meta.env.VITE_WHATSAPP_STORE_NUMBER;
    const whatsappLink = buildWhatsAppLink(storeNumber, message);
    if (whatsappWindow) {
      whatsappWindow.location.href = whatsappLink;
    } else {
      window.open(whatsappLink, '_blank');
    }

    clear();
    navigate(`/pedido-confirmado/${order.order_number}`);
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
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-ink-900">Dirección de envío</h2>
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={locating}
              className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50"
            >
              {locating ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                  <path d="M12 21s-7-6.1-7-11a7 7 0 0114 0c0 4.9-7 11-7 11z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
                  <circle cx="12" cy="10" r="2.3" stroke="currentColor" strokeWidth="1.75" />
                </svg>
              )}
              {locating ? 'Ubicando...' : 'Usar mi ubicación'}
            </button>
          </div>

          {locationError && <p className="mt-2 text-xs text-red-500">{locationError}</p>}
          {mapLink && !locationError && (
            <a
              href={mapLink}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
            >
              Ver ubicación en Google Maps
              <svg viewBox="0 0 20 20" fill="none" className="h-3 w-3">
                <path d="M7 13L13 7M8 7h5v5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          )}

          <div className="mt-3 space-y-4">
            <Input
              label="Dirección"
              required
              placeholder="Av. Los Álamos 123"
              value={shipping.address}
              onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Distrito"
                required
                placeholder="Miraflores"
                value={shipping.district}
                onChange={(e) => setShipping({ ...shipping, district: e.target.value })}
              />
              <Input
                label="Ciudad"
                required
                value={shipping.city}
                onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
              />
            </div>
            <Input
              label="Referencia (opcional)"
              placeholder="Frente al parque..."
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
