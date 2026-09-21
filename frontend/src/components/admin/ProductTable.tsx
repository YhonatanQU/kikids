import type { Product } from '@/types/catalog';
import { StockBadge } from './StockBadge';
import { formatPEN } from '@/lib/formatCurrency';
import { Card } from '@/components/ui/Card';

interface Props {
  products: Product[];
  editingProductId: string | null;
  deletingId: string | null;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

/** Tabla completa de inventario para escritorio (brief 3.B). */
export function ProductTable({ products, editingProductId, deletingId, onEdit, onDelete }: Props) {
  if (products.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-ink-400">Todavía no hay productos registrados.</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-x-auto">
      <table className="min-w-full divide-y divide-ink-100 text-sm">
        <thead className="bg-ink-50/70 text-left text-xs font-semibold uppercase tracking-wide text-ink-400">
          <tr>
            <th className="px-4 py-3">Producto</th>
            <th className="px-4 py-3">Precio de venta</th>
            <th className="px-4 py-3">Variantes / Stock</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {products.map((product) => (
            <tr
              key={product.id}
              className={`transition-colors hover:bg-ink-50/50 ${editingProductId === product.id ? 'bg-brand-50/60' : ''}`}
            >
              <td className="px-4 py-3 font-semibold text-ink-800">{product.name}</td>
              <td className="px-4 py-3 text-ink-600">{formatPEN(product.basePrice)}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1.5">
                  {product.variants.map((v) => (
                    <div key={v.id} className="flex items-center gap-1.5 rounded-lg border border-ink-100 px-2 py-1">
                      <span className="text-xs font-medium text-ink-600">{v.size}/{v.color}</span>
                      <StockBadge quantity={v.availableQuantity} />
                    </div>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3">
                {product.isFeatured ? (
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-600">Destacado</span>
                ) : (
                  <span className="text-xs text-ink-400">Normal</span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-3">
                  <button onClick={() => onEdit(product)} className="text-sm font-semibold text-brand-600 hover:text-brand-700">
                    Editar
                  </button>
                  <button
                    onClick={() => onDelete(product)}
                    disabled={deletingId === product.id}
                    className="text-sm font-semibold text-red-500 hover:text-red-600 disabled:opacity-40"
                  >
                    {deletingId === product.id ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
