export type OrderStatus =
  | 'pending_payment'
  | 'payment_confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'expired';

export interface ShippingInfo {
  fullName: string;
  phone: string;
  email?: string;
  address: string;
  district: string;
  city: string;
  reference?: string;
}

export type PaymentMethod = 'Yape' | 'Plin' | 'Transferencia';

export interface CheckoutPayload {
  shipping: ShippingInfo;
  paymentMethod: PaymentMethod;
  shippingCost: number;
  items: Array<{ variantId: string; quantity: number }>;
}

export interface CreatedOrder {
  orderId: string;
  orderNumber: string;
}

/** Fila completa de `orders`, para el panel admin (bandeja + detalle). */
export interface AdminOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  shippingFullName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingDistrict: string;
  shippingCity: string;
  shippingReference: string | null;
  paymentMethod: PaymentMethod | null;
  subtotal: number;
  shippingCost: number;
  total: number;
  currency: string;
  customerEmail: string | null;
  reservedUntil: string | null;
  confirmedAt: string | null;
  createdAt: string;
}

export interface AdminOrderItem {
  id: string;
  productName: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}
