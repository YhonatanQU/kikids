import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useRealtimeStock } from '@/hooks/useRealtimeStock';
import { useCartStore } from '@/store/cartStore';
import { VariantSelector } from '@/components/catalog/VariantSelector';
import { formatPEN } from '@/lib/formatCurrency';
import type { Product } from '@/types/catalog';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    supabase
      .from('products')
      .select(
        `id, name, slug, description, category_id, season_id, gender, base_price, is_featured,
         product_variants(id, size, color, color_hex, sku, price_override, available_quantity, is_active),
         product_images(id, url, variant_id, is_primary)`
      )
      .eq('slug', slug)
      .single()
      .then(({ data }) => setProduct((data as unknown as Product) ?? null));
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

  if (!product) return <p className="p-8 text-gray-500">Cargando producto...</p>;

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
  }

  return (
    <div className="grid grid-cols-1 gap-6 px-4 py-6 md:grid-cols-2 md:px-8">
      <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
        {product.images[0] && (
          <img src={product.images[0].url} alt={product.name} className="h-full w-full object-cover" />
        )}
      </div>
      <div>
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <p className="mt-1 text-xl font-semibold text-brand-600">{formatPEN(product.basePrice)}</p>
        <p className="mt-3 text-gray-600">{product.description}</p>

        <div className="mt-4">
          <VariantSelector
            variants={product.variants}
            selectedVariantId={selectedVariantId}
            onSelect={setSelectedVariantId}
          />
        </div>

        <button
          onClick={handleAddToCart}
          disabled={!selectedVariant || selectedVariant.availableQuantity === 0}
          className="mt-6 w-full rounded-md bg-brand-600 py-3 font-medium text-white disabled:opacity-40 md:w-auto md:px-8"
        >
          Añadir al carrito
        </button>
      </div>
    </div>
  );
}
