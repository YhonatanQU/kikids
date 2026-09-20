// PLACEHOLDER — reemplazar generando los tipos reales desde el esquema:
//
//   supabase gen types typescript --project-id <tu-project-id> > src/types/database.types.ts
//
// Se deja una forma mínima para que el resto del código compile mientras
// tanto. No editar a mano una vez generado el archivo real.

export type Database = {
  public: {
    Tables: Record<string, { Row: Record<string, unknown> }>;
    Functions: Record<string, unknown>;
    Enums: {
      order_status:
        | 'pending_payment'
        | 'payment_confirmed'
        | 'shipped'
        | 'delivered'
        | 'cancelled'
        | 'expired';
      gender_type: 'nino' | 'nina' | 'bebe' | 'unisex';
    };
  };
};
