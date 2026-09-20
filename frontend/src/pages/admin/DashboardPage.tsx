export function DashboardPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
      {/* TODO: gráficos de rendimiento comercial (ventas por temporada, top productos) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Pedidos pendientes</p>
          <p className="text-2xl font-bold">—</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Ventas del mes</p>
          <p className="text-2xl font-bold">—</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Productos con bajo stock</p>
          <p className="text-2xl font-bold">—</p>
        </div>
      </div>
    </div>
  );
}
