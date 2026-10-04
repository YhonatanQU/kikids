/**
 * Tallas para ropa de niños de 2 a 7 años. Lista cerrada (select) para
 * evitar variantes duplicadas por texto libre inconsistente (ej. "2" vs "2 años").
 */
export const KIDS_SIZES = [
  { value: '2', label: '2 años' },
  { value: '3', label: '3 años' },
  { value: '4', label: '4 años' },
  { value: '5', label: '5 años' },
  { value: '6', label: '6 años' },
  { value: '7', label: '7 años' },
] as const;

/** "8" -> "8 años". Si el valor no calza con ninguna talla cerrada
 * (ej. texto libre heredado de antes del select), lo devuelve tal cual. */
export function sizeLabel(value: string): string {
  return KIDS_SIZES.find((s) => s.value === value)?.label ?? value;
}
