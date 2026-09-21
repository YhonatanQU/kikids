import { Card } from '@/components/ui/Card';

const STATS = [
  { label: 'Pedidos pendientes', value: '—', accent: 'text-amber-500' },
  { label: 'Ventas del mes', value: '—', accent: 'text-emerald-600' },
  { label: 'Productos con bajo stock', value: '—', accent: 'text-red-500' },
];

export function DashboardPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight text-ink-900">Dashboard</h1>
      {/* TODO: gráficos de rendimiento comercial (ventas por temporada, top productos) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STATS.map((stat) => (
          <Card key={stat.label} className="p-5">
            <p className="text-sm font-medium text-ink-500">{stat.label}</p>
            <p className={`mt-2 text-3xl font-extrabold ${stat.accent}`}>{stat.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
