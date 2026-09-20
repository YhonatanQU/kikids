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
    <div className="space-y-3">
      <div>
        <p className="mb-1 text-sm font-medium text-gray-700">Talla</p>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => {
            const variantsForSize = variants.filter((v) => v.size === size);
            const hasStock = variantsForSize.some((v) => v.availableQuantity > 0);
            return (
              <button
                key={size}
                disabled={!hasStock}
                onClick={() => onSelect(variantsForSize[0].id)}
                className={`rounded-md border px-3 py-1.5 text-sm ${
                  hasStock
                    ? 'border-gray-300 hover:border-brand-500'
                    : 'cursor-not-allowed border-gray-100 text-gray-300 line-through'
                } ${selectedVariantId === variantsForSize[0]?.id ? 'border-brand-600 bg-brand-50' : ''}`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
