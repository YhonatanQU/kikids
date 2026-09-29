import type { CartItem } from '@/store/cartStore';
import type { PaymentMethod, ShippingInfo } from '@/types/order';
import { sizeLabel } from '@/lib/sizes';

interface BuildWhatsAppMessageArgs {
  orderNumber: string;
  shipping: ShippingInfo;
  paymentMethod: PaymentMethod;
  items: CartItem[];
  total: number;
}

/**
 * Arma el mensaje estructurado que se envía al WhatsApp de la tienda
 * al confirmar un pedido. El formato es fijo a propósito: el vendedor
 * necesita leer ID, datos de envío, método de pago, prendas y total de
 * un vistazo.
 */
export function buildWhatsAppMessage({ orderNumber, shipping, paymentMethod, items, total }: BuildWhatsAppMessageArgs): string {
  const itemsList = items
    .map((i) => {
      // El SKU y el color son opcionales en el producto — si no se
      // cargaron, se omiten en vez de mostrar "(SKU )" o "Color " vacíos.
      const skuPart = i.sku ? ` (SKU ${i.sku})` : '';
      const colorPart = i.color ? `, Color ${i.color}` : '';
      return `  • ${i.productName}${skuPart} — Talla ${sizeLabel(i.size)}${colorPart} x${i.quantity} — S/ ${(i.unitPrice * i.quantity).toFixed(2)}`;
    })
    .join('\n');

  return [
    `*Pedido KIKIDS #${orderNumber}*`,
    '',
    '*Datos de envío (agencia Shalom):*',
    `Nombre: ${shipping.fullName}`,
    `Teléfono: ${shipping.phone}`,
    `Ciudad: ${shipping.city}`,
    `Agencia Shalom: ${shipping.address}`,
    shipping.reference ? `Referencia: ${shipping.reference}` : null,
    '',
    `*Método de pago:* ${paymentMethod}`,
    '',
    '*Prendas:*',
    itemsList,
    '',
    `*Total a pagar: S/ ${total.toFixed(2)}*`,
    '',
    `Quedo atento(a) para coordinar el pago por ${paymentMethod}.`,
  ]
    .filter((line) => line !== null)
    .join('\n');
}

export function buildWhatsAppLink(storeNumber: string, message: string): string {
  return `https://wa.me/${storeNumber}?text=${encodeURIComponent(message)}`;
}
