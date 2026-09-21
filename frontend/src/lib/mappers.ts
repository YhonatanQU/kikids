import type { Product, ProductImage, ProductVariant } from '@/types/catalog';

/**
 * Supabase/PostgREST devuelve las columnas tal cual están en Postgres
 * (snake_case). El resto de la app usa camelCase, así que todo fetch
 * de productos debe pasar por este mapper — nunca castear la fila cruda.
 */
export function mapProductRow(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? null,
    categoryId: row.category_id,
    seasonId: row.season_id,
    gender: row.gender,
    costPrice: Number(row.cost_price ?? 0),
    freightCost: Number(row.freight_cost ?? 0),
    adminCost: Number(row.admin_cost ?? 0),
    markupPercentage: Number(row.markup_percentage ?? 0),
    basePrice: Number(row.base_price),
    isFeatured: row.is_featured,
    variants: ((row.variants ?? []) as any[]).map((v): ProductVariant => ({
      id: v.id,
      productId: row.id,
      size: v.size,
      color: v.color,
      colorHex: v.color_hex ?? null,
      sku: v.sku,
      priceOverride: v.price_override != null ? Number(v.price_override) : null,
      stockQuantity: v.stock_quantity,
      availableQuantity: v.available_quantity,
      isActive: v.is_active,
    })),
    images: ((row.images ?? []) as any[]).map((img): ProductImage => ({
      id: img.id,
      productId: row.id,
      variantId: img.variant_id ?? null,
      url: img.url,
      isPrimary: img.is_primary,
    })),
  };
}
