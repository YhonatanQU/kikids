import { useSeasons, useCategories } from '@/hooks/useCategories';
import { Card } from '@/components/ui/Card';

export function CategoriesPage() {
  const seasons = useSeasons();
  const categories = useCategories();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight text-ink-900">Categorías / Temporadas</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink-400">Temporadas / Colecciones</h2>
          <ul className="mt-3 divide-y divide-ink-100">
            {seasons.map((s) => (
              <li key={s.id} className="py-2.5 text-sm font-medium text-ink-700">{s.name}</li>
            ))}
          </ul>
          {/* TODO: formulario de alta/edición de temporadas */}
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink-400">Categorías de prenda</h2>
          <ul className="mt-3 divide-y divide-ink-100">
            {categories.map((c) => (
              <li key={c.id} className="py-2.5 text-sm font-medium text-ink-700">{c.name}</li>
            ))}
          </ul>
          {/* TODO: formulario de alta/edición de categorías, con soporte parent_id */}
        </Card>
      </div>
    </div>
  );
}
