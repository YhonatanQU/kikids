import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { mapProductRow } from '@/lib/mappers';
import { ProductTable } from '@/components/admin/ProductTable';
import { ProductForm } from '@/components/admin/ProductForm';
import { BulkDiscountBar } from '@/components/admin/BulkDiscountBar';
import type { Product } from '@/types/catalog';

const SELECT_QUERY = `id, name, slug, description, category_id, season_id, gender,
  cost_price, freight_cost, admin_cost, markup_percentage, base_price, discount_percentage, discount_active, is_featured, video_url,
  variants:product_variants(id, size, color, color_hex, sku, price_override, stock_quantity, available_quantity, is_active),
  images:product_images(id, url, variant_id, is_primary)`;

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  function loadProducts() {
    supabase
      .from('products')
      .select(SELECT_QUERY)
      .order('created_at', { ascending: false })
      .then(({ data }) => setProducts((data ?? []).map(mapProductRow)));
  }

  useEffect(loadProducts, []);

  function handleEdit(product: Product) {
    setEditingProduct(product);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleSaved() {
    setEditingProduct(null);
    loadProducts();
  }

  async function handleDelete(product: Product) {
    if (!confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`)) return;

    setDeletingId(product.id);

    // Best-effort: limpiar las fotos del bucket (no bloquea el borrado si falla).
    const { data: files } = await supabase.storage.from('product-images').list(product.id);
    if (files && files.length > 0) {
      await supabase.storage.from('product-images').remove(files.map((f) => `${product.id}/${f.name}`));
    }

    // product_variants y product_images se borran en cascada (ver schema.sql).
    const { error } = await supabase.from('products').delete().eq('id', product.id);

    setDeletingId(null);

    if (error) {
      alert(error.message);
      return;
    }
    if (editingProduct?.id === product.id) setEditingProduct(null);
    setSelectedIds((prev) => {
      if (!prev.has(product.id)) return prev;
      const next = new Set(prev);
      next.delete(product.id);
      return next;
    });
    loadProducts();
  }

  function toggleSelect(productId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) =>
      products.length > 0 && products.every((p) => prev.has(p.id)) ? new Set() : new Set(products.map((p) => p.id))
    );
  }

  async function applyBulkDiscount(discountPercentage: number) {
    setApplyingDiscount(true);
    const { error } = await supabase
      .from('products')
      .update({ discount_percentage: discountPercentage, discount_active: true })
      .in('id', Array.from(selectedIds));
    setApplyingDiscount(false);
    if (error) {
      alert(error.message);
      return;
    }
    setSelectedIds(new Set());
    loadProducts();
  }

  async function removeBulkDiscount() {
    setApplyingDiscount(true);
    const { error } = await supabase
      .from('products')
      .update({ discount_active: false })
      .in('id', Array.from(selectedIds));
    setApplyingDiscount(false);
    if (error) {
      alert(error.message);
      return;
    }
    setSelectedIds(new Set());
    loadProducts();
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight text-ink-900">Productos</h1>

      {/* Pantalla grande: formulario a la izquierda, listado a la derecha (siempre visibles). */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[440px_1fr] xl:items-start">
        <div ref={formRef} className="xl:sticky xl:top-6">
          <ProductForm
            editingProduct={editingProduct}
            onSaved={handleSaved}
            onCancelEdit={() => setEditingProduct(null)}
          />
        </div>
        <div>
          <BulkDiscountBar
            count={selectedIds.size}
            applying={applyingDiscount}
            onApply={applyBulkDiscount}
            onRemove={removeBulkDiscount}
            onClearSelection={() => setSelectedIds(new Set())}
          />
          <ProductTable
            products={products}
            editingProductId={editingProduct?.id ?? null}
            deletingId={deletingId}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  );
}
