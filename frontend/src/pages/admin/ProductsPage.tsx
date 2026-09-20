import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ProductTable } from '@/components/admin/ProductTable';
import { ProductForm } from '@/components/admin/ProductForm';
import type { Product } from '@/types/catalog';

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);

  function loadProducts() {
    supabase
      .from('products')
      .select(
        `id, name, slug, description, category_id, season_id, gender, base_price, is_featured,
         product_variants(id, size, color, color_hex, sku, price_override, available_quantity, is_active),
         product_images(id, url, variant_id, is_primary)`
      )
      .order('created_at', { ascending: false })
      .then(({ data }) => setProducts((data as unknown as Product[]) ?? []));
  }

  useEffect(loadProducts, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Productos</h1>
        <button onClick={() => setShowForm((v) => !v)} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white">
          {showForm ? 'Cerrar' : '+ Nuevo producto'}
        </button>
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
