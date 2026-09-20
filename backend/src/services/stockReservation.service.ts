import { supabaseAdmin } from '../config/supabaseClient.js';
import { logger } from '../utils/logger.js';

/**
 * Llama al RPC de Postgres que expira reservas vencidas y regresa el
 * stock retenido al catálogo público (ver database/schema.sql,
 * función release_expired_reservations). Alternativa a pg_cron cuando
 * el plan de Supabase no lo incluye.
 */
export async function releaseExpiredReservations(): Promise<number> {
  const { data, error } = await supabaseAdmin.rpc('release_expired_reservations');

  if (error) {
    logger.error('Error liberando reservas vencidas:', error.message);
    throw error;
  }

  const releasedCount = data as number;
  if (releasedCount > 0) {
    logger.info(`Reservas liberadas: ${releasedCount} variante(s) actualizada(s)`);
  }
  return releasedCount;
}
