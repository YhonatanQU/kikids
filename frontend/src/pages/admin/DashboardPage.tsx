import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { formatPEN } from '@/lib/formatCurrency';
import { Card } from '@/components/ui/Card';

const LOW_STOCK_THRESHOLD = 3;

interface InventoryStats {
  valorizedInventory: number;
  lowStockCount: number;
}

/**
 * Inventario valorizado a costo: suma de (stock_quantity * cost_price)
 * por variante. Es el capital que hoy está inmovilizado en prendas,
 * sin importar si el producto está activo/publicado en el catálogo.
 */
function useInventoryStats() {
  const [stats, setStats] = useState<InventoryStats | null>(null);

  useEffect(() => {
    supabase
      .from('products')
      .select('cost_price, is_active, product_variants(stock_quantity, available_quantity, is_active)')
      .then(({ data }) => {
        if (!data) return;

        let valorizedInventory = 0;
        let lowStockCount = 0;

        for (const product of data as any[]) {
          const costPrice = Number(product.cost_price ?? 0);
          for (const variant of product.product_variants ?? []) {
            valorizedInventory += costPrice * (variant.stock_quantity ?? 0);
            if (product.is_active && variant.is_active && variant.available_quantity <= LOW_STOCK_THRESHOLD) {
              lowStockCount += 1;
            }
          }
        }

        setStats({ valorizedInventory, lowStockCount });
      });
  }, []);

  return stats;
}

export function DashboardPage() {
  const inventoryStats = useInventoryStats();

  const stats = [
    { label: 'Pedidos pendientes', value: '—', accent: 'text-amber-500' },
    {
      label: 'Inventario valorizado (a costo)',
      value: inventoryStats ? formatPEN(inventoryStats.valorizedInventory) : '…',
      accent: 'text-brand-600',
    },
    {
      label: 'Variantes con bajo stock',
      value: inventoryStats ? String(inventoryStats.lowStockCount) : '…',
      accent: 'text-red-500',
    },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight text-ink-900">Dashboard</h1>
      {/* TODO: gráficos de rendimiento comercial (ventas por temporada, top productos) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-5">
            <p className="text-sm font-medium text-ink-500">{stat.label}</p>
            <p className={`mt-2 text-3xl font-extrabold ${stat.accent}`}>{stat.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
