import type { Product } from '@/types/catalog';
import { StockBadge } from './StockBadge';
import { formatPEN } from '@/lib/formatCurrency';

interface Props {
  products: Product[];
  onEdit: (product: Product) => void;
}

/** Tabla completa de inventario para escritorio (brief 3.B). */
export function ProductTable({ products, onEdit }: Props) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-100 bg-white">
      <table className="min-w-full divide-y divide-gray-100 text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3">Producto</th>
            <th className="px-4 py-3">Precio base</th>
            <th className="px-4 py-3">Variantes / Stock</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {products.map((product) => (
            <tr key={product.id}>
              <td className="px-4 py-3 font-medium">{product.name}</td>
              <td className="px-4 py-3">{formatPEN(product.basePrice)}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {product.variants.map((v) => (
                    <div key={v.id} className="flex items-center gap-1 rounded border border-gray-100 px-1.5 py-0.5">
                      <span className="text-xs text-gray-600">{v.size}/{v.color}</span>
                      <StockBadge quantity={v.availableQuantity} />
                    </div>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3">
                <span className={product.isFeatured ? 'text-brand-600' : 'text-gray-400'}>
                  {product.isFeatured ? 'Destacado' : 'Normal'}
                </span>
              </td>
              <td className="px-4 py-3">
                <button onClick={() => onEdit(product)} className="text-brand-600 hover:underline">
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
