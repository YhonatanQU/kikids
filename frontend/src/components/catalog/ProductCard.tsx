import { Link } from 'react-router-dom';
import type { Product } from '@/types/catalog';
import { formatPEN } from '@/lib/formatCurrency';

export function ProductCard({ product }: { product: Product }) {
  const primaryImage = product.images.find((img) => img.isPrimary) ?? product.images[0];
  const totalStock = product.variants.reduce((sum, v) => sum + v.availableQuantity, 0);

  return (
    <Link
      to={`/producto/${product.slug}`}
      className="group block overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="aspect-square w-full overflow-hidden bg-gray-100">
        {primaryImage ? (
          <img
            src={primaryImage.url}
            alt={product.name}
            className="h-full w-full object-cover transition group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-300">Sin imagen</div>
        )}
      </div>
      <div className="p-3">
        <h3 className="truncate text-sm font-medium text-gray-800 md:text-base">{product.name}</h3>
        <p className="mt-1 font-semibold text-brand-600">{formatPEN(product.basePrice)}</p>
        {totalStock === 0 && <p className="mt-1 text-xs text-red-500">Agotado</p>}
      </div>
    </Link>
  );
}
