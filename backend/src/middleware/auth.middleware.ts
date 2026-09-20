import type { NextFunction, Request, Response } from 'express';
import { supabaseAdmin } from '@/config/supabaseClient.js';

export interface AuthenticatedRequest extends Request {
  adminUserId?: string;
}

/**
 * Valida el JWT de Supabase Auth enviado por el panel admin
 * (header Authorization: Bearer <token>) antes de permitir operaciones
 * sensibles como generar una factura.
 */
export async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Token no proporcionado' });

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ error: 'Token inválido' });

  req.adminUserId = data.user.id;
  next();
}
