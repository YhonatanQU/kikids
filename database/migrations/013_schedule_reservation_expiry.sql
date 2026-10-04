-- =====================================================================
-- 013: activa el cron que realmente libera las reservas vencidas.
--
-- release_expired_reservations() ya existía desde el esquema original
-- (marca el pedido 'expired' y repone reserved_quantity), pero nunca se
-- estaba invocando: el proyecto se despliega como sitio estático en
-- Vercel (ver vercel.json), así que el backend Express con node-cron
-- (backend/src/jobs/releaseExpiredReservations.job.ts) no corre en
-- producción — por eso los pedidos vencidos se quedaban en "Pendiente
-- de Pago" para siempre. pg_cron corre DENTRO de Supabase, sin depender
-- de que haya algún servidor nuestro encendido.
-- =====================================================================

create extension if not exists pg_cron;

-- Por si esta migración se vuelve a correr: evita el error de "ya existe".
select cron.unschedule('release-expired-reservations')
where exists (select 1 from cron.job where jobname = 'release-expired-reservations');

select cron.schedule(
  'release-expired-reservations',
  '*/5 * * * *',
  $$select release_expired_reservations();$$
);
