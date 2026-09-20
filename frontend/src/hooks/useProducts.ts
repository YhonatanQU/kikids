import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { CatalogFilters, Product } from '@/types/catalog';

/**
 * Trae productos activos aplicando el filtro cruzado
 * Temporada -> Género -> Categoría (ver idx_products_filter en el esquema).
 */
export function useProducts(filters: CatalogFilters) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchProducts() {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('products')
        .select(
          `id, name, slug, description, category_id, season_id, gender, base_price, is_featured,
           product_variants(id, size, color, color_hex, sku, price_override, available_quantity, is_active),
           product_images(id, url, variant_id, is_primary)`
        )
        .eq('is_active', true);

      if (filters.seasonSlug) {
        query = query.eq('seasons.slug', filters.seasonSlug);
      }
      if (filters.gender) {
        query = query.eq('gender', filters.gender);
      }
      if (filters.categorySlug) {
        query = query.eq('categories.slug', filters.categorySlug);
      }

      const { data, error: queryError } = await query;

      if (cancelled) return;

      if (queryError) {
        setError(queryError.message);
        setProducts([]);
      } else {
        setProducts((data ?? []) as unknown as Product[]);
      }
      setLoading(false);
    }

    fetchProducts();
    return () => {
      cancelled = true;
    };
  }, [filters.seasonSlug, filters.gender, filters.categorySlug, filters.size, filters.color]);

  return { products, loading, error };
}
