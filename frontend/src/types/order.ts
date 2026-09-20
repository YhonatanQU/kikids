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
