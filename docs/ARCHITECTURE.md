# KIKIDS — Arquitectura

## Componentes

- **frontend/** — React + Vite + TypeScript + Tailwind CSS. Sirve tanto el catálogo público como el panel admin, compartiendo el mismo cliente de Supabase (`src/lib/supabaseClient.ts`) y diferenciando permisos vía Row Level Security en Postgres.
- **backend/** — Node.js + Express + TypeScript. Solo maneja lo que no debe/puede vivir en el navegador: generación de PDF de facturas, y el cron de liberación de reservas de stock (alternativa a `pg_cron`).
- **database/** — Esquema completo de PostgreSQL/Supabase (`schema.sql`) con tablas, funciones RPC, triggers, RLS y Realtime.

## Flujo de venta (end-to-end)

1. Cliente navega el catálogo (`frontend` lee directo de Supabase vía PostgREST, filtrando por `season_id` + `gender` + `category_id`).
2. Cliente agrega ítems al carrito (`useCartStore`, persistido en `localStorage`).
3. Cliente completa el checkout → `frontend` llama al RPC `create_order_with_reservation`.
4. Postgres, en una sola transacción: bloquea las filas de `product_variants` involucradas (`FOR UPDATE`), valida stock, crea el `order` en estado `pending_payment` con `reserved_until = now() + 2h`, crea los `order_items`, e incrementa `reserved_quantity`.
5. `frontend` recibe `order_number` y abre WhatsApp (`wa.me`) con el mensaje estructurado (`buildWhatsAppMessage`).
6. Vendedor valida el pago por Yape/Plin/transferencia fuera del sistema.
7. Admin entra al panel (`OrdersInbox`) y confirma el pago → RPC `confirm_order_payment` descuenta `stock_quantity` en firme y limpia `reserved_quantity`.
8. El backend Express genera el PDF de la factura (`invoice.service.ts`) y lo sube a Supabase Storage, registrando la fila en `invoices`.
9. Si el cliente nunca paga: el job (`pg_cron` o `releaseExpiredReservations.job.ts` en el backend) detecta `reserved_until < now()`, marca el pedido `expired` y libera `reserved_quantity`, devolviendo el stock al catálogo público en tiempo real (Supabase Realtime empuja el cambio a todos los navegadores abiertos).

## Por qué no hay condiciones de carrera en el stock

Toda la lógica de "¿hay stock disponible?" vive en una única función PL/pgSQL (`create_order_with_reservation`) que usa `SELECT ... FOR UPDATE`. Ningún cliente puede insertar un pedido directamente (RLS no lo permite); la única puerta de entrada es ese RPC, que corre con `security definer` y es atómico por transacción.

## Próximos pasos sugeridos

1. `cd database` y aplicar `schema.sql` en un proyecto Supabase nuevo.
2. `cd frontend && npm install && cp .env.example .env` (completar con las credenciales del proyecto Supabase) `&& npm run dev`.
3. `cd backend && npm install && cp .env.example .env` (completar con la Service Role Key) `&& npm run dev`.
4. Crear los buckets de Storage `product-images` e `invoices` en Supabase (públicos para lectura).
5. Crear el primer usuario admin y su fila en `admin_profiles` (ver `database/README.md`).
