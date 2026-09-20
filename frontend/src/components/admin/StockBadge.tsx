export function StockBadge({ quantity }: { quantity: number }) {
  const color =
    quantity === 0 ? 'bg-red-100 text-red-700' : quantity <= 3 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700';

  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>{quantity} disp.</span>;
}
