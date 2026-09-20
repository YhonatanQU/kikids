import cron from 'node-cron';
import { env } from '@/config/env.js';
import { releaseExpiredReservations } from '@/services/stockReservation.service.js';
import { logger } from '@/utils/logger.js';

/**
 * Alternativa a pg_cron: corre en el proceso Node del backend.
 * Solo se necesita UNA instancia de este job corriendo (no escalar
 * horizontalmente el backend sin mover esto a un worker dedicado).
 */
export function startReservationExpiryJob() {
  cron.schedule(env.reservationCronSchedule, async () => {
    try {
      await releaseExpiredReservations();
    } catch (err) {
      logger.error('Fallo el job de liberación de reservas:', err);
    }
  });

  logger.info(`Job de liberación de reservas programado: "${env.reservationCronSchedule}"`);
}
