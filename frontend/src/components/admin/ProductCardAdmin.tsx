import type { Product } from '@/types/catalog';
import { StockBadge } from './StockBadge';
import { formatPEN } from '@/lib/formatCurrency';
import { sizeLabel } from '@/lib/sizes';
import { effectivePriceFor } from '@/lib/pricing';

interface Props {
  product: Product;
  selected: boolean;
  editing: boolean;
  deleting: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/** Tarjeta con foto para el inventario — pensada para reconocer productos
 * de un vistazo (sobre todo tras una importación masiva, donde el nombre
 * por sí solo no dice mucho) y editar directo sin pasar por la tabla. */
export function ProductCardAdmin({ product, selected, editing, deleting, onToggleSelect, onEdit, onDelete }: Props) {
  const primaryImage = product.images.find((img) => img.isPrimary) ?? product.images[0];
  const hasDiscount = product.discountActive && product.discountPercentage > 0;
  const finalPrice = effectivePriceFor(product);

  return (
    <div
      className={`overflow-hidden rounded-2xl border-2 shadow-card transition-colors ${
        editing
          ? 'border-brand-400 bg-brand-50/40 ring-2 ring-brand-100'
          : selected
            ? 'border-blue-400 bg-blue-50/50 ring-2 ring-blue-100'
            : 'border-ink-100 bg-white'
      }`}
    >
      <div className="relative aspect-square w-full bg-ink-100">
        {primaryImage ? (
          <img src={primaryImage.url} alt={product.name} className="h-full w-full object-contain" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-300">
            <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M3 16l5-5 4 4 5-6 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
        <label
          className={`absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-md shadow-soft transition-colors ${
            selected ? 'bg-blue-500' : 'bg-white/90'
          }`}
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            className="h-4 w-4 rounded border-ink-300 text-blue-600 focus:ring-blue-400/40"
            aria-label={`Seleccionar ${product.name}`}
          />
        </label>
        {product.isFeatured && (
          <span className="absolute right-2 top-2 rounded-full bg-brand-500 px-2 py-0.5 text-[11px] font-bold text-white shadow-soft">
            Destacado
          </span>
        )}
        {hasDiscount && (
          <span className="absolute bottom-2 right-2 rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white shadow-soft">
            -{product.discountPercentage}%
          </span>
        )}
      </div>

      <div className="p-3.5">
        <h3 className="line-clamp-2 text-sm font-semibold text-ink-800" title={product.name}>
          {product.name}
        </h3>
        {hasDiscount ? (
          <div className="mt-1 flex items-center gap-1.5">
            <span className="font-bold text-red-600">{formatPEN(finalPrice)}</span>
            <span className="text-xs text-ink-400 line-through">{formatPEN(product.basePrice)}</span>
          </div>
        ) : (
          <p className="mt-1 font-bold text-ink-800">{formatPEN(product.basePrice)}</p>
        )}

        <div className="mt-2 flex flex-wrap gap-1">
          {product.variants.map((v) => (
            <div key={v.id} className="flex items-center gap-1 rounded-lg border border-ink-100 px-1.5 py-0.5">
              <span className="text-[11px] font-medium text-ink-600">{sizeLabel(v.size)}{v.color && `/${v.color}`}</span>
              <StockBadge quantity={v.availableQuantity} />
            </div>
          ))}
          {product.variants.length === 0 && <span className="text-[11px] text-ink-400">Sin variantes</span>}
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="flex-1 rounded-lg border border-ink-200 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="flex-1 rounded-lg border border-red-100 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 disabled:opacity-40"
          >
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}
