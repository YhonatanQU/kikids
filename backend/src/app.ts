import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { ordersRouter } from './routes/orders.routes.js';
import { invoicesRouter } from './routes/invoices.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app = express();

app.use(cors({ origin: env.frontendOrigin }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/orders', ordersRouter);
app.use('/api/invoices', invoicesRouter);

app.use(errorHandler);
