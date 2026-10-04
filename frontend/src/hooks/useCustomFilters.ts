import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { FilterType } from '@/types/catalog';

/** Ejes de filtro personalizados (ej. Talla, Edad) creados por el admin,
 * con sus opciones activas ya ordenadas — para que el catálogo pueda
 * renderar un <select> más por cada uno sin saber de antemano cuáles existen. */
export function useCustomFilterTypes() {
  const [types, setTypes] = useState<FilterType[]>([]);

  useEffect(() => {
    supabase
      .from('filter_types')
      .select('id, name, slug, values:filter_values(id, name, slug, is_active, display_order)')
      .eq('is_active', true)
      .order('display_order')
      .then(({ data }) => {
        const mapped = ((data ?? []) as any[]).map((t): FilterType => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
          values: (t.values ?? [])
            .filter((v: any) => v.is_active)
            .sort((a: any, b: any) => a.display_order - b.display_order)
            .map((v: any) => ({ id: v.id, name: v.name, slug: v.slug })),
        }));
        setTypes(mapped);
      });
  }, []);

  return types;
}
