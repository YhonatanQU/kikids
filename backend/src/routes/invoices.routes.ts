import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.middleware.js';
import { createInvoice } from '../controllers/invoices.controller.js';

export const invoicesRouter = Router();

invoicesRouter.post('/:orderId', requireAdmin, createInvoice);
