import type { NextFunction, Request, Response } from 'express';
import { logger } from '@/utils/logger.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  logger.error(err);
  const message = err instanceof Error ? err.message : 'Error interno del servidor';
  res.status(500).json({ error: message });
}
