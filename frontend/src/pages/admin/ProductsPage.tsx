import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { mapProductRow } from '@/lib/mappers';
import { ProductTable } from '@/components/admin/ProductTable';
import { ProductCardAdmin } from '@/components/admin/ProductCardAdmin';
import { ProductForm } from '@/components/admin/ProductForm';
import { BulkDiscountBar } from '@/components/admin/BulkDiscountBar';
import { BulkImportCsv } from '@/components/admin/BulkImportCsv';
import type { Product } from '@/types/catalog';

const SELECT_QUERY = `id, name, slug, description, category_id, season_id, gender,
  cost_price, freight_cost, admin_cost, markup_percentage, base_price, discount_percentage, discount_active, is_featured, video_url,
  variants:product_variants(id, size, color, color_hex, sku, price_override, stock_quantity, available_quantity, is_active),
  images:product_images(id, url, variant_id, is_primary)`;

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [view, setView] = useState<'cards' | 'table'>('cards');
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
    setFormOpen(true);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleNewProduct() {
    setEditingProduct(null);
    setImportOpen(false);
    setFormOpen(true);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleOpenImport() {
    setEditingProduct(null);
    setFormOpen(false);
    setImportOpen(true);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleCloseForm() {
    setEditingProduct(null);
    setFormOpen(false);
  }

  function handleSaved() {
    setEditingProduct(null);
    setFormOpen(false);
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
      // 23503 = foreign_key_violation — algo más todavía referencia este
      // producto (normalmente ya cubierto por la migración 010, pero por
      // si acaso queda alguna referencia inesperada, el mensaje genérico
      // de Postgres no es claro para un admin, así que se traduce aquí.
      alert(
        error.code === '23503'
          ? 'No se pudo eliminar: este producto todavía está referenciado en otro lugar (por ejemplo, un pedido). Intenta desactivarlo en vez de eliminarlo.'
          : error.message
      );
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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">Productos</h1>
        {!formOpen && !importOpen && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-ink-200 bg-white p-0.5">
              <button
                type="button"
                onClick={() => setView('cards')}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                  view === 'cards' ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-50'
                }`}
              >
                Tarjetas
              </button>
              <button
                type="button"
                onClick={() => setView('table')}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                  view === 'table' ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-50'
                }`}
              >
                Tabla
              </button>
            </div>
            <button
              type="button"
              onClick={handleOpenImport}
              className="flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50"
            >
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                <path d="M10 3v10m0 0l-3.5-3.5M10 13l3.5-3.5M4 16h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Importar CSV
            </button>
            <button
              type="button"
              onClick={handleNewProduct}
              className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-brand-600"
            >
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Nuevo producto
            </button>
          </div>
        )}
      </div>

      {/* Pantalla grande: formulario/importador a la izquierda, listado a la
          derecha — solo aparecen al crear/editar/importar; el resto del
          tiempo se ve solo la tabla a todo el ancho. */}
      <div className={formOpen || importOpen ? 'grid grid-cols-1 gap-6 xl:grid-cols-[440px_1fr] xl:items-start' : ''}>
        {formOpen && (
          <div ref={formRef} className="xl:sticky xl:top-6">
            <ProductForm
              editingProduct={editingProduct}
              onSaved={handleSaved}
              onCancelEdit={handleCloseForm}
            />
          </div>
        )}
        {importOpen && (
          <div ref={formRef} className="xl:sticky xl:top-6">
            <BulkImportCsv onImported={loadProducts} onClose={() => setImportOpen(false)} />
          </div>
        )}
        <div>
          <BulkDiscountBar
            count={selectedIds.size}
            applying={applyingDiscount}
            onApply={applyBulkDiscount}
            onRemove={removeBulkDiscount}
            onClearSelection={() => setSelectedIds(new Set())}
          />
          {view === 'table' ? (
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
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-ink-100 bg-white py-16 text-center shadow-card">
              <p className="text-sm text-ink-400">Todavía no hay productos registrados.</p>
            </div>
          ) : (
            <>
              <label className="mb-3 flex w-fit cursor-pointer items-center gap-2 text-sm font-medium text-ink-600">
                <input
                  type="checkbox"
                  checked={products.length > 0 && products.every((p) => selectedIds.has(p.id))}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-400/40"
                />
                Seleccionar todos ({products.length})
              </label>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCardAdmin
                    key={product.id}
                    product={product}
                    selected={selectedIds.has(product.id)}
                    editing={editingProduct?.id === product.id}
                    deleting={deletingId === product.id}
                    onToggleSelect={() => toggleSelect(product.id)}
                    onEdit={() => handleEdit(product)}
                    onDelete={() => handleDelete(product)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
