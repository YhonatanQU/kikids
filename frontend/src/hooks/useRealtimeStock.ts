import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

type StockChangeHandler = (variantId: string, availableQuantity: number) => void;

/**
 * Se suscribe a cambios en product_variants vía Supabase Realtime.
 * Úsalo en la página de catálogo/detalle para reflejar al instante
 * cuando el stock baja por una reserva de otro comprador o sube
 * porque el admin repuso inventario.
 */
export function useRealtimeStock(onChange: StockChangeHandler) {
  useEffect(() => {
    const channel = supabase
      .channel('product-variants-stock')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'product_variants' },
        (payload) => {
          const row = payload.new as { id: string; available_quantity: number };
          onChange(row.id, row.available_quantity);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onChange]);
}
