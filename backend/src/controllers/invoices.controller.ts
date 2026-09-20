import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { generateInvoiceForOrder } from '../services/invoice.service.js';

export async function createInvoice(req: AuthenticatedRequest, res: Response) {
  const { orderId } = req.params;

  const pdfUrl = await generateInvoiceForOrder(orderId);

  res.status(201).json({ pdfUrl });
}
