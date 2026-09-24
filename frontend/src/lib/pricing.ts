import type { Product, ProductVariant } from '@/types/catalog';

/** Precio de lista, antes de descuento: el override de la variante o el del producto. */
export function listPriceFor(product: Product, variant?: ProductVariant | null): number {
  return variant?.priceOverride ?? product.basePrice;
}

/** Precio final que paga el cliente, aplicando el descuento del producto si está activo. */
export function effectivePriceFor(product: Product, variant?: ProductVariant | null): number {
  const list = listPriceFor(product, variant);
  if (product.discountActive && product.discountPercentage > 0) {
    return Math.round(list * (1 - product.discountPercentage / 100) * 100) / 100;
  }
  return list;
}
