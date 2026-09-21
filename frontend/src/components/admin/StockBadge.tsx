export function StockBadge({ quantity }: { quantity: number }) {
  const color =
    quantity === 0
      ? 'bg-red-50 text-red-600'
      : quantity <= 3
        ? 'bg-amber-50 text-amber-700'
        : 'bg-emerald-50 text-emerald-700';

  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>{quantity} disp.</span>;
}
