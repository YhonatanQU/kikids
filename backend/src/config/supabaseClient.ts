import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

/**
 * Cliente de servicio con la Service Role Key: ignora RLS por completo.
 * Solo debe usarse en este backend, nunca en el frontend. Se usa para
 * jobs de sistema (liberar reservas) y operaciones administrativas
 * que requieren generar PDFs, subir a Storage, etc.
 */
export const supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: { persistSession: false },
});
