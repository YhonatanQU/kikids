import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { mapProductRow } from '@/lib/mappers';
import { ProductTable } from '@/components/admin/ProductTable';
import { ProductForm } from '@/components/admin/ProductForm';
import type { Product } from '@/types/catalog';

const SELECT_QUERY = `id, name, slug, description, category_id, season_id, gender,
  cost_price, freight_cost, admin_cost, markup_percentage, base_price, is_featured,
  variants:product_variants(id, size, color, color_hex, sku, price_override, available_quantity, is_active),
  images:product_images(id, url, variant_id, is_primary)`;

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);

  function loadProducts() {
    supabase
      .from('products')
      .select(SELECT_QUERY)
      .order('created_at', { ascending: false })
      .then(({ data }) => setProducts((data ?? []).map(mapProductRow)));
  }

  useEffect(loadProducts, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight text-ink-900">Productos</h1>

      {/* Pantalla grande: formulario a la izquierda, listado a la derecha (siempre visibles). */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[440px_1fr] xl:items-start">
        <div className="xl:sticky xl:top-6">
          <ProductForm onSaved={loadProducts} />
        </div>
        <ProductTable products={products} onEdit={() => { /* TODO: reabrir ProductForm en modo edición */ }} />
      </div>
    </div>
  );
}
