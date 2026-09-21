import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { mapProductRow } from '@/lib/mappers';
import { useRealtimeStock } from '@/hooks/useRealtimeStock';
import { useCartStore } from '@/store/cartStore';
import { VariantSelector } from '@/components/catalog/VariantSelector';
import { formatPEN } from '@/lib/formatCurrency';
import { Button } from '@/components/ui/Button';
import type { Product } from '@/types/catalog';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    supabase
      .from('products')
      .select(
        `id, name, slug, description, category_id, season_id, gender, base_price, is_featured,
         variants:product_variants(id, size, color, color_hex, sku, price_override, available_quantity, is_active),
         images:product_images(id, url, variant_id, is_primary)`
      )
      .eq('slug', slug)
      .single()
      .then(({ data }) => setProduct(data ? mapProductRow(data) : null));
  }, [slug]);

  // Mantiene el stock disponible actualizado en vivo mientras el cliente
  // está viendo el producto (otro comprador podría reservar la última unidad).
  const handleStockChange = useCallback((variantId: string, availableQuantity: number) => {
    setProduct((prev) =>
      prev
        ? {
            ...prev,
            variants: prev.variants.map((v) =>
              v.id === variantId ? { ...v, availableQuantity } : v
            ),
          }
        : prev
    );
  }, []);
  useRealtimeStock(handleStockChange);

  if (!product) {
    return (
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-4 py-8 md:grid-cols-2 md:px-8">
        <div className="aspect-square animate-pulse rounded-2xl bg-ink-100" />
        <div className="space-y-3">
          <div className="h-7 w-2/3 animate-pulse rounded bg-ink-100" />
          <div className="h-5 w-1/4 animate-pulse rounded bg-ink-100" />
          <div className="h-20 w-full animate-pulse rounded bg-ink-100" />
        </div>
      </div>
    );
  }

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId);

  function handleAddToCart() {
    if (!selectedVariant || !product) return;
    addItem({
      variantId: selectedVariant.id,
      productName: product.name,
      size: selectedVariant.size,
      color: selectedVariant.color,
      unitPrice: selectedVariant.priceOverride ?? product.basePrice,
      quantity: 1,
      availableQuantity: selectedVariant.availableQuantity,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-4 py-8 md:grid-cols-2 md:px-8">
      <div className="aspect-square overflow-hidden rounded-2xl bg-ink-100 shadow-card">
        {product.images[0] && (
          <img src={product.images[0].url} alt={product.name} className="h-full w-full object-cover" />
        )}
      </div>
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">{product.name}</h1>
        <p className="mt-1.5 text-2xl font-extrabold text-brand-600">{formatPEN(product.basePrice)}</p>
        {product.description && <p className="mt-4 text-ink-500">{product.description}</p>}

        <div className="mt-6">
          <VariantSelector
            variants={product.variants}
            selectedVariantId={selectedVariantId}
            onSelect={setSelectedVariantId}
          />
        </div>

        <Button
          onClick={handleAddToCart}
          disabled={!selectedVariant || selectedVariant.availableQuantity === 0}
          size="lg"
          fullWidth
          className="mt-7 md:w-auto md:px-10"
        >
          {added ? '✓ Añadido al carrito' : 'Añadir al carrito'}
        </Button>
      </div>
    </div>
  );
}
