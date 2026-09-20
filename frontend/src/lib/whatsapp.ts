import type { CartItem } from '@/store/cartStore';
import type { ShippingInfo } from '@/types/order';

interface BuildWhatsAppMessageArgs {
  orderNumber: string;
  shipping: ShippingInfo;
  items: CartItem[];
  total: number;
}

/**
 * Arma el mensaje estructurado que se envía al WhatsApp de la tienda
 * al confirmar un pedido. El formato es fijo a propósito: el vendedor
 * necesita leer ID, datos de envío, prendas y total de un vistazo.
 */
export function buildWhatsAppMessage({ orderNumber, shipping, items, total }: BuildWhatsAppMessageArgs): string {
  const itemsList = items
    .map((i) => `  • ${i.productName} — Talla ${i.size}, Color ${i.color} x${i.quantity} — S/ ${(i.unitPrice * i.quantity).toFixed(2)}`)
    .join('\n');

  return [
    `*Pedido KIKIDS #${orderNumber}*`,
    '',
    '*Datos de envío:*',
    `Nombre: ${shipping.fullName}`,
    `Teléfono: ${shipping.phone}`,
    `Dirección: ${shipping.address}, ${shipping.district}, ${shipping.city}`,
    shipping.reference ? `Referencia: ${shipping.reference}` : null,
    '',
    '*Prendas:*',
    itemsList,
    '',
    `*Total a pagar: S/ ${total.toFixed(2)}*`,
    '',
    'Quedo atento(a) para coordinar el pago por Yape, Plin o transferencia.',
  ]
    .filter((line) => line !== null)
    .join('\n');
}

export function buildWhatsAppLink(storeNumber: string, message: string): string {
  return `https://wa.me/${storeNumber}?text=${encodeURIComponent(message)}`;
}
