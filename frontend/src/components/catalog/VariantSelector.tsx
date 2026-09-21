import type { ProductVariant } from '@/types/catalog';

interface Props {
  variants: ProductVariant[];
  selectedVariantId: string | null;
  onSelect: (variantId: string) => void;
}

/**
 * Selector estricto de Talla + Color: cada combinación es una variante
 * independiente con su propio stock (available_quantity).
 */
export function VariantSelector({ variants, selectedVariantId, onSelect }: Props) {
  const sizes = [...new Set(variants.map((v) => v.size))];

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-ink-700">Talla</p>
      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => {
          const variantsForSize = variants.filter((v) => v.size === size);
          const hasStock = variantsForSize.some((v) => v.availableQuantity > 0);
          const isSelected = selectedVariantId === variantsForSize[0]?.id;
          return (
            <button
              key={size}
              type="button"
              disabled={!hasStock}
              onClick={() => onSelect(variantsForSize[0].id)}
              className={`min-w-[3rem] rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all ${
                !hasStock
                  ? 'cursor-not-allowed border-ink-100 text-ink-300 line-through'
                  : isSelected
                    ? 'border-brand-500 bg-brand-500 text-white shadow-soft'
                    : 'border-ink-200 text-ink-700 hover:border-brand-400'
              }`}
            >
              {size}
            </button>
          );
        })}
      </div>
    </div>
  );
}
