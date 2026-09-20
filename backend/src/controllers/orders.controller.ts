import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { supabaseAdmin } from '../config/supabaseClient.js';
import { generateInvoiceForOrder } from '../services/invoice.service.js';

/**
 * Confirma el pago de un pedido (admin) y encadena la generación de
 * la factura en el mismo request. La reserva/descuento de stock ya
 * la resuelve el RPC confirm_order_payment en Postgres; este endpoint
 * solo orquesta el paso siguiente (PDF) que no puede vivir en la DB.
 */
export async function confirmOrderPayment(req: AuthenticatedRequest, res: Response) {
  const { orderId } = req.params;

  const { error } = await supabaseAdmin.rpc('confirm_order_payment', { p_order_id: orderId });
  if (error) return res.status(400).json({ error: error.message });

  const pdfUrl = await generateInvoiceForOrder(orderId);

  res.json({ status: 'payment_confirmed', pdfUrl });
}
