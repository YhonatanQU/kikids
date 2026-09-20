import { Router } from 'express';
import { requireAdmin } from '@/middleware/auth.middleware.js';
import { confirmOrderPayment } from '@/controllers/orders.controller.js';

export const ordersRouter = Router();

ordersRouter.post('/:orderId/confirm-payment', requireAdmin, confirmOrderPayment);
