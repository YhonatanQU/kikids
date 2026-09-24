import { supabase } from '@/lib/supabaseClient';
import { useCartStore, type VariantFreshData } from '@/store/cartStore';

/**
 * El carrito persiste en localStorage con el precio "congelado" al
 * momento de agregar el producto. Refresca precio/stock reales desde
 * Supabase (se llama al abrir el carrito y al entrar a checkout) para
 * que nunca quede mostrando un precio desactualizado o arrastrado de
 * una sesión con bugs previos. Ítems cuya variante ya no existe/está
 * inactiva se retiran automáticamente.
 */
export async function syncCartPrices() {
  const { items, syncFromCatalog } = useCartStore.getState();
  const variantIds = items.map((i) => i.variantId);
  if (variantIds.length === 0) return;

  const { data } = await supabase
    .from('product_variants')
    .select(
      'id, price_override, available_quantity, is_active, products(base_price, discount_percentage, discount_active, is_active, product_images(url, is_primary))'
    )
    .in('id', variantIds);

  if (!data) return;

  const fresh: VariantFreshData[] = data.map((v: any) => {
    const images = v.products?.product_images ?? [];
    const primaryImage = images.find((img: any) => img.is_primary) ?? images[0];
    const listPrice = v.price_override != null ? Number(v.price_override) : Number(v.products?.base_price ?? 0);
    const discountActive = !!v.products?.discount_active;
    const discountPercentage = Number(v.products?.discount_percentage ?? 0);
    const unitPrice =
      discountActive && discountPercentage > 0
        ? Math.round(listPrice * (1 - discountPercentage / 100) * 100) / 100
        : listPrice;
    return {
      variantId: v.id,
      unitPrice,
      availableQuantity: v.available_quantity,
      stillAvailable: !!v.is_active && !!v.products?.is_active,
      imageUrl: primaryImage?.url,
    };
  });

  syncFromCatalog(fresh);
}
