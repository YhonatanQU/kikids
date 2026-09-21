export type Gender = 'nino' | 'nina' | 'bebe' | 'unisex';

export interface Season {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  size: string;
  color: string;
  colorHex: string | null;
  sku: string;
  priceOverride: number | null;
  availableQuantity: number;
  isActive: boolean;
}

export interface ProductImage {
  id: string;
  productId: string;
  variantId: string | null;
  url: string;
  isPrimary: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  categoryId: string;
  seasonId: string;
  gender: Gender;
  costPrice: number;
  freightCost: number;
  adminCost: number;
  markupPercentage: number;
  basePrice: number;
  isFeatured: boolean;
  variants: ProductVariant[];
  images: ProductImage[];
}

export interface CatalogFilters {
  seasonSlug?: string;
  gender?: Gender;
  categorySlug?: string;
  size?: string;
  color?: string;
}
