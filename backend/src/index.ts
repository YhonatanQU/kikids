import { app } from './app.js';
import { env } from './config/env.js';
import { startReservationExpiryJob } from './jobs/releaseExpiredReservations.job.js';
import { logger } from './utils/logger.js';

app.listen(env.port, () => {
  logger.info(`KIKIDS backend escuchando en http://localhost:${env.port}`);
  startReservationExpiryJob();
});
