/**
 * El proveedor nombra las fotos con un código que ya trae temporada, talla,
 * precio de compra y SKU — ej. "I329-073.jpg":
 *   I    -> temporada (Invierno)
 *   3    -> talla (3 años)
 *   29   -> precio de compra (S/ 29.00)
 *   -073 -> correlativo del SKU
 *   I329-073 (sin extensión) -> SKU completo del producto
 */
export interface DecodedImageSku {
  sku: string;
  seasonCode: string;
  seasonSlug: 'invierno' | 'verano' | null;
  seasonLabel: string;
  sizeDigit: string;
  costPrice: number;
  correlative: string;
}

const SEASON_CODES: Record<string, { slug: 'invierno' | 'verano'; label: string }> = {
  I: { slug: 'invierno', label: 'Invierno' },
  V: { slug: 'verano', label: 'Verano' },
};

const FILENAME_PATTERN = /^([A-Za-z])(\d)(\d{2})-(.+)$/;

export function decodeImageFilename(filename: string): DecodedImageSku | null {
  const basename = filename.replace(/\.[^./\\]+$/, '');
  const match = basename.match(FILENAME_PATTERN);
  if (!match) return null;

  const [, letter, sizeDigit, costDigits, correlative] = match;
  const season = SEASON_CODES[letter.toUpperCase()];

  return {
    sku: basename,
    seasonCode: letter.toUpperCase(),
    seasonSlug: season?.slug ?? null,
    seasonLabel: season?.label ?? letter.toUpperCase(),
    sizeDigit,
    costPrice: Number(costDigits),
    correlative,
  };
}
