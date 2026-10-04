import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { mapProductRow } from '@/lib/mappers';
import { useRealtimeStock } from './useRealtimeStock';
import type { CatalogFilters, Product } from '@/types/catalog';

/**
 * Resuelve los filtros personalizados activos (ej. talla=2-anos) a la lista
 * de ids de producto que cumplen TODOS los ejes elegidos (AND entre ejes).
 * Se hace con un par de consultas chicas por eje en vez de un solo query con
 * varios joins a la misma tabla puente (product_filter_values) — PostgREST
 * no deja alias-ear la misma relación embebida dos veces en un request, y el
 * volumen de productos de la tienda no justifica una función SQL aparte.
 * Devuelve null si no hay ningún filtro personalizado activo (sin restricción).
 */
async function resolveCustomFilterProductIds(
  customFilters: Record<string, string> | undefined
): Promise<string[] | null> {
  const entries = Object.entries(customFilters ?? {}).filter(([, v]) => v);
  if (entries.length === 0) return null;

  let productIds: string[] | null = null;

  for (const [typeSlug, valueSlug] of entries) {
    const { data: value } = await supabase
      .from('filter_values')
      .select('id, filter_types!inner(slug)')
      .eq('slug', valueSlug)
      .eq('filter_types.slug', typeSlug)
      .maybeSingle();

    if (!value) return []; // la opción no existe (o ya no está activa) -> ningún producto califica

    const { data: links } = await supabase
      .from('product_filter_values')
      .select('product_id')
      .eq('filter_value_id', (value as any).id);

    const idsForAxis: string[] = ((links ?? []) as any[]).map((l) => l.product_id as string);
    productIds = productIds === null ? idsForAxis : productIds.filter((id) => idsForAxis.includes(id));
    if (productIds.length === 0) return [];
  }

  return productIds ?? [];
}

/**
 * Trae productos activos aplicando el filtro cruzado
 * Temporada -> Género -> Categoría (ver idx_products_filter en el esquema),
 * más los filtros personalizados activos (ver resolveCustomFilterProductIds).
 */
export function useProducts(filters: CatalogFilters) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const customFiltersKey = JSON.stringify(filters.customFilters ?? {});

  useEffect(() => {
    let cancelled = false;

    async function fetchProducts() {
      setLoading(true);
      setError(null);

      const customFilterProductIds = await resolveCustomFilterProductIds(filters.customFilters);
      if (cancelled) return;
      if (customFilterProductIds !== null && customFilterProductIds.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      // seasons!inner / categories!inner / genders!inner: sin el hint
      // !inner, PostgREST no usa estas relaciones embebidas para filtrar
      // las filas padre, solo filtraría dentro del array embebido (ver
      // docs de "embedded filters").
      let query = supabase
        .from('products')
        .select(
          `id, name, slug, description, category_id, season_id, gender_id, base_price, discount_percentage, discount_active, is_featured, video_url,
           seasons!inner(name, slug), categories!inner(slug), genders!inner(name, slug),
           variants:product_variants(id, size, color, color_hex, sku, price_override, stock_quantity, available_quantity, is_active),
           images:product_images(id, url, variant_id, is_primary)`
        )
        .eq('is_active', true);

      if (filters.seasonSlug) {
        query = query.eq('seasons.slug', filters.seasonSlug);
      }
      if (filters.genderSlug) {
        query = query.eq('genders.slug', filters.genderSlug);
      }
      if (filters.categorySlug) {
        query = query.eq('categories.slug', filters.categorySlug);
      }
      if (customFilterProductIds !== null) {
        query = query.in('id', customFilterProductIds);
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
  }, [filters.seasonSlug, filters.genderSlug, filters.categorySlug, filters.size, filters.color, customFiltersKey]);

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
