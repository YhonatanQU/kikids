import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface Props {
  count: number;
  applying: boolean;
  onApply: (discountPercentage: number) => void;
  onRemove: () => void;
  onClearSelection: () => void;
}

/** Barra de acciones para aplicar (o quitar) un descuento a varios productos
 * seleccionados a la vez, sin tener que editarlos uno por uno. */
export function BulkDiscountBar({ count, applying, onApply, onRemove, onClearSelection }: Props) {
  const [discountPercentage, setDiscountPercentage] = useState(10);

  if (count === 0) return null;

  return (
    <div className="sticky top-4 z-10 mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 shadow-soft">
      <span className="text-sm font-semibold text-brand-700">
        {count} producto{count === 1 ? '' : 's'} seleccionado{count === 1 ? '' : 's'}
      </span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          max={100}
          step="1"
          value={discountPercentage}
          onChange={(e) => setDiscountPercentage(Number(e.target.value))}
          className="w-20 rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40"
        />
        <span className="text-sm text-ink-500">% de descuento</span>
      </div>
      <Button
        type="button"
        size="sm"
        loading={applying}
        disabled={discountPercentage <= 0 || discountPercentage > 100}
        onClick={() => onApply(discountPercentage)}
      >
        Aplicar a {count}
      </Button>
      <button
        type="button"
        onClick={onRemove}
        disabled={applying}
        className="text-sm font-semibold text-red-500 hover:text-red-600 disabled:opacity-40"
      >
        Quitar descuento
      </button>
      <button
        type="button"
        onClick={onClearSelection}
        className="ml-auto text-sm font-medium text-ink-400 hover:text-ink-700"
      >
        Cancelar selección
      </button>
    </div>
  );
}
