import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { mapProductRow } from '@/lib/mappers';
import { useRealtimeStock } from './useRealtimeStock';
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

      // seasons!inner / categories!inner: sin el hint !inner, PostgREST no
      // usa estas relaciones embebidas para filtrar las filas padre, solo
      // filtraría dentro del array embebido (ver docs de "embedded filters").
      let query = supabase
        .from('products')
        .select(
          `id, name, slug, description, category_id, season_id, gender, base_price, discount_percentage, discount_active, is_featured, video_url,
           seasons!inner(slug), categories!inner(slug),
           variants:product_variants(id, size, color, color_hex, sku, price_override, stock_quantity, available_quantity, is_active),
           images:product_images(id, url, variant_id, is_primary)`
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
        setProducts((data ?? []).map(mapProductRow));
      }
      setLoading(false);
    }

    fetchProducts();
    return () => {
      cancelled = true;
    };
  }, [filters.seasonSlug, filters.gender, filters.categorySlug, filters.size, filters.color]);

  // Si dos clientes están viendo el catálogo a la vez y uno agota una
  // talla, el otro debe ver "Agotado" sin necesidad de refrescar.
  const handleStockChange = useCallback((variantId: string, availableQuantity: number) => {
    setProducts((prev) =>
      prev.map((p) => ({
        ...p,
        variants: p.variants.map((v) => (v.id === variantId ? { ...v, availableQuantity } : v)),
      }))
    );
  }, []);
  useRealtimeStock(handleStockChange);

  return { products, loading, error };
}
