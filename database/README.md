# Base de Datos KIKIDS (Supabase / PostgreSQL)

## Cómo aplicar el esquema

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Ve a **SQL Editor** y ejecuta el contenido de [`schema.sql`](./schema.sql) completo (de arriba hacia abajo).
3. Verifica en **Database > Replication** que `product_variants` y `orders` queden habilitadas para Realtime (el script ya las agrega vía `alter publication`).
4. Crea tu primer usuario administrador desde **Authentication > Users > Add user**, y luego inserta su perfil:
   ```sql
   insert into admin_profiles (id, full_name, role)
   values ('<uuid-del-usuario>', 'Nombre del Admin', 'super_admin');
   ```

## Decisiones de diseño clave

- **Filtro cruzado Temporada → Género → Categoría**: `products` tiene columnas directas `season_id`, `gender` (enum) y `category_id`, con un índice compuesto `idx_products_filter`. Esto permite queries tipo:
  ```sql
  select * from products
  where season_id = :verano_id and gender = 'nino' and category_id = :camisetas_id and is_active;
  ```
  sin necesidad de joins complejos ni tablas puente.

- **Stock por variante, no por producto**: `product_variants` es la única fuente de verdad del stock. Cada combinación talla+color tiene su propio `stock_quantity`. La columna generada `available_quantity` (`stock_quantity - reserved_quantity`) es lo único que debe mostrarse al público.

- **Reserva de stock sin sobreventa**: la función `create_order_with_reservation` usa `SELECT ... FOR UPDATE` dentro de una transacción PL/pgSQL, bloqueando la fila de la variante mientras valida y descuenta disponibilidad. Dos clientes comprando la última unidad simultáneamente no pueden ambos tener éxito.

- **Nunca se inserta un pedido directo desde el frontend**: la tabla `orders` no tiene policy de `insert` para `anon`. Todo pedido se crea vía RPC (`security definer`), que es la única puerta de entrada. Esto evita manipulación de precios/stock desde el cliente.

- **Expiración de reservas (2 horas)**: `release_expired_reservations()` debe ejecutarse periódicamente. Dos opciones:
  - **Opción A (recomendada si tu plan de Supabase incluye `pg_cron`)**: descomentar las líneas al final de `schema.sql` que registran el cron nativo en PostgreSQL.
  - **Opción B (cualquier plan)**: el backend Node (`backend/src/jobs/releaseExpiredReservations.job.ts`) corre un `node-cron` cada 5 minutos que llama al RPC vía el cliente de servicio de Supabase.

## Generar tipos TypeScript desde el esquema

Con la Supabase CLI instalada:

```bash
supabase gen types typescript --project-id <tu-project-id> > frontend/src/types/database.types.ts
```

Vuelve a ejecutar este comando cada vez que cambies el esquema, para mantener el frontend tipado correctamente contra la base real.
