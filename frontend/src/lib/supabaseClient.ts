import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en el .env');
}

// Cliente único compartido por toda la app (catálogo público + panel admin).
// La separación de permisos la maneja Row Level Security en Postgres,
// no este cliente: el mismo objeto sirve para el rol "anon" y, tras el
// login de Supabase Auth, para el rol "authenticated".
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
