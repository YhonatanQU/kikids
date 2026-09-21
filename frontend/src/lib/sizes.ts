/**
 * Tallas para ropa de niños de 0 a 8 años. Lista cerrada (select) para
 * evitar variantes duplicadas por texto libre inconsistente (ej. "2" vs "2 años").
 */
export const KIDS_SIZES = [
  { value: '0-3M', label: '0-3 meses' },
  { value: '3-6M', label: '3-6 meses' },
  { value: '6-9M', label: '6-9 meses' },
  { value: '9-12M', label: '9-12 meses' },
  { value: '12-18M', label: '12-18 meses' },
  { value: '18-24M', label: '18-24 meses' },
  { value: '2', label: '2 años' },
  { value: '3', label: '3 años' },
  { value: '4', label: '4 años' },
  { value: '5', label: '5 años' },
  { value: '6', label: '6 años' },
  { value: '7', label: '7 años' },
  { value: '8', label: '8 años' },
] as const;

/** "8" -> "8 años". Si el valor no calza con ninguna talla cerrada
 * (ej. texto libre heredado de antes del select), lo devuelve tal cual. */
export function sizeLabel(value: string): string {
  return KIDS_SIZES.find((s) => s.value === value)?.label ?? value;
}
