import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en el .env');
}

// Cliente único compartido por toda la app (catálogo público + panel admin).
// La separación de permisos la maneja Row Level Security en Postgres,
// no este cliente: el mismo objeto sirve para el rol "anon" y, tras el
// login de Supabase Auth, para el rol "authenticated".
// Sin el genérico <Database> hasta generar tipos reales del esquema:
//   supabase gen types typescript --project-id <ref> > src/types/database.types.ts
// (ver database/README.md). El placeholder actual colapsaba la inferencia
// de .rpc()/.insert() a `never` y rompía el build.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
