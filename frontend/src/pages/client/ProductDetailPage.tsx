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
  const [activeMedia, setActiveMedia] = useState(0);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    supabase
      .from('products')
      .select(
        `id, name, slug, description, category_id, season_id, gender, base_price, is_featured, video_url,
         variants:product_variants(id, size, color, color_hex, sku, price_override, stock_quantity, available_quantity, is_active),
         images:product_images(id, url, variant_id, is_primary)`
      )
      .eq('slug', slug)
      .single()
      .then(({ data }) => {
        const mapped = data ? mapProductRow(data) : null;
        setProduct(mapped);
        // Preselecciona la primera talla con stock: no debería hacer
        // falta un clic extra para comprar cuando solo hay una opción
        // (o para elegir un punto de partida razonable si hay varias).
        const firstAvailable = mapped?.variants.find((v) => v.availableQuantity > 0);
        setSelectedVariantId(firstAvailable?.id ?? null);
      });
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
  const media = [
    ...product.images.map((img) => ({ type: 'image' as const, url: img.url })),
    ...(product.videoUrl ? [{ type: 'video' as const, url: product.videoUrl }] : []),
  ];
  const current = media[activeMedia] ?? media[0];

  function handleAddToCart() {
    if (!selectedVariant || !product) return;
    const primaryImage = product.images.find((img) => img.isPrimary) ?? product.images[0];
    addItem({
      variantId: selectedVariant.id,
      productName: product.name,
      size: selectedVariant.size,
      color: selectedVariant.color,
      sku: selectedVariant.sku,
      unitPrice: selectedVariant.priceOverride ?? product.basePrice,
      quantity: 1,
      availableQuantity: selectedVariant.availableQuantity,
      imageUrl: primaryImage?.url,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-4 py-8 md:grid-cols-2 md:px-8">
      <div>
        <div className="aspect-square overflow-hidden rounded-2xl bg-ink-100 shadow-card">
          {current?.type === 'video' ? (
            <video src={current.url} controls className="h-full w-full object-cover" />
          ) : current ? (
            <img src={current.url} alt={product.name} className="h-full w-full object-cover" />
          ) : null}
        </div>
        {media.length > 1 && (
          <div className="mt-3 flex gap-2">
            {media.map((m, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveMedia(i)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                  i === activeMedia ? 'border-brand-500' : 'border-transparent hover:border-ink-200'
                }`}
              >
                {m.type === 'video' ? (
                  <>
                    <video src={m.url} className="h-full w-full object-cover" />
                    <span className="absolute inset-0 flex items-center justify-center bg-ink-900/30">
                      <svg viewBox="0 0 24 24" fill="white" className="h-5 w-5">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </>
                ) : (
                  <img src={m.url} alt="" className="h-full w-full object-cover" />
                )}
              </button>
            ))}
          </div>
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
