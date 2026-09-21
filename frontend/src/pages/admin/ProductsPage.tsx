import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { mapProductRow } from '@/lib/mappers';
import { ProductTable } from '@/components/admin/ProductTable';
import { ProductForm } from '@/components/admin/ProductForm';
import { Button } from '@/components/ui/Button';
import type { Product } from '@/types/catalog';

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);

  function loadProducts() {
    supabase
      .from('products')
      .select(
        `id, name, slug, description, category_id, season_id, gender, base_price, is_featured,
         variants:product_variants(id, size, color, color_hex, sku, price_override, available_quantity, is_active),
         images:product_images(id, url, variant_id, is_primary)`
      )
      .order('created_at', { ascending: false })
      .then(({ data }) => setProducts((data ?? []).map(mapProductRow)));
  }

  useEffect(loadProducts, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">Productos</h1>
        <Button onClick={() => setShowForm((v) => !v)} variant={showForm ? 'secondary' : 'primary'}>
          {showForm ? 'Cerrar' : '+ Nuevo producto'}
        </Button>
      </div>

      {showForm && (
        <div className="mb-6">
          <ProductForm onSaved={() => { setShowForm(false); loadProducts(); }} />
        </div>
      )}

      <ProductTable products={products} onEdit={() => { /* TODO: reabrir ProductForm en modo edición */ }} />
    </div>
  );
}
