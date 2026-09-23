import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { mapProductRow } from '@/lib/mappers';
import { useRealtimeStock } from '@/hooks/useRealtimeStock';
import { useCartStore } from '@/store/cartStore';
import { VariantSelector } from '@/components/catalog/VariantSelector';
import { ProductCard } from '@/components/catalog/ProductCard';
import { formatPEN } from '@/lib/formatCurrency';
import { Button } from '@/components/ui/Button';
import type { Product } from '@/types/catalog';

const SUGGESTED_SELECT = `id, name, slug, description, category_id, season_id, gender, base_price, is_featured, video_url,
     variants:product_variants(id, size, color, color_hex, sku, price_override, stock_quantity, available_quantity, is_active),
     images:product_images(id, url, variant_id, is_primary)`;

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [activeMedia, setActiveMedia] = useState(0);
  const [suggested, setSuggested] = useState<Product[]>([]);
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

  // Productos sugeridos: misma categoría, activos y con stock, sin el actual.
  useEffect(() => {
    if (!product) return;
    let cancelled = false;
    supabase
      .from('products')
      .select(SUGGESTED_SELECT)
      .eq('is_active', true)
      .eq('category_id', product.categoryId)
      .neq('id', product.id)
      .limit(8)
      .then(({ data }) => {
        if (cancelled) return;
        setSuggested((data ?? []).map(mapProductRow).filter((p) => p.variants.some((v) => v.availableQuantity > 0)));
      });
    return () => {
      cancelled = true;
    };
  }, [product?.categoryId, product?.id]);

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

  function handleBack() {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/catalogo');
    }
  }

  return (
    <div className="pb-36 md:pb-28">
      <div className="mx-auto max-w-5xl px-4 pt-6 md:px-8">
        <button
          type="button"
          onClick={handleBack}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-100 bg-white text-ink-600 shadow-soft transition-colors hover:bg-ink-50 hover:text-ink-900"
          aria-label="Volver"
        >
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
            <path d="M12 15l-5-5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-4 py-6 md:grid-cols-2 md:px-8">
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
      </div>
      </div>

      {suggested.length > 0 && (
        <div className="mx-auto max-w-5xl px-4 pb-4 pt-2 md:px-8">
          <h2 className="mb-3 text-base font-extrabold text-ink-900 md:text-lg">También te puede interesar</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
            {suggested.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 border-t border-ink-100 bg-white/95 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur md:bottom-0">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3 md:px-8">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink-800">{product.name}</p>
            <p className="text-lg font-extrabold text-brand-600">{formatPEN(selectedVariant?.priceOverride ?? product.basePrice)}</p>
          </div>
          <Button
            onClick={handleAddToCart}
            disabled={!selectedVariant || selectedVariant.availableQuantity === 0}
            size="lg"
            className="shrink-0 px-8"
          >
            {added ? '✓ Añadido' : 'Añadir al carrito'}
          </Button>
        </div>
      </div>
    </div>
  );
}
