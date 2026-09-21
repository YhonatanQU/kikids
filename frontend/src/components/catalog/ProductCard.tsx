import { Link } from 'react-router-dom';
import type { Product } from '@/types/catalog';
import { formatPEN } from '@/lib/formatCurrency';

export function ProductCard({ product }: { product: Product }) {
  const primaryImage = product.images.find((img) => img.isPrimary) ?? product.images[0];
  const totalStock = product.variants.reduce((sum, v) => sum + v.availableQuantity, 0);

  return (
    <Link
      to={`/producto/${product.slug}`}
      className="group block overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-ink-100">
        {primaryImage ? (
          <img
            src={primaryImage.url}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-300">
            <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M3 16l5-5 4 4 5-6 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
        {product.isFeatured && (
          <span className="absolute left-2 top-2 rounded-full bg-brand-500 px-2 py-0.5 text-[11px] font-bold text-white shadow-soft">
            Destacado
          </span>
        )}
        {totalStock === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
            <span className="rounded-full bg-ink-900/80 px-3 py-1 text-xs font-semibold text-white">Agotado</span>
          </div>
        )}
      </div>
      <div className="p-3.5">
        <h3 className="truncate text-sm font-semibold text-ink-800 md:text-base">{product.name}</h3>
        <p className="mt-1 font-extrabold text-brand-600">{formatPEN(product.basePrice)}</p>
      </div>
    </Link>
  );
}
