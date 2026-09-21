import type { Product, ProductImage, ProductVariant } from '@/types/catalog';
import type { AdminOrder, AdminOrderItem } from '@/types/order';

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
    videoUrl: row.video_url ?? null,
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

export function mapAdminOrderRow(row: any): AdminOrder {
  return {
    id: row.id,
    orderNumber: row.order_number,
    status: row.status,
    shippingFullName: row.shipping_full_name,
    shippingPhone: row.shipping_phone,
    shippingAddress: row.shipping_address,
    shippingDistrict: row.shipping_district,
    shippingCity: row.shipping_city,
    shippingReference: row.shipping_reference ?? null,
    paymentMethod: row.payment_method ?? null,
    subtotal: Number(row.subtotal),
    shippingCost: Number(row.shipping_cost),
    total: Number(row.total),
    currency: row.currency,
    customerEmail: row.customers?.email ?? null,
    reservedUntil: row.reserved_until ?? null,
    confirmedAt: row.confirmed_at ?? null,
    createdAt: row.created_at,
  };
}

export function mapAdminOrderItemRow(row: any): AdminOrderItem {
  return {
    id: row.id,
    productName: row.product_name_snapshot,
    size: row.size_snapshot,
    color: row.color_snapshot,
    quantity: row.quantity,
    unitPrice: Number(row.unit_price),
    subtotal: Number(row.subtotal),
  };
}
