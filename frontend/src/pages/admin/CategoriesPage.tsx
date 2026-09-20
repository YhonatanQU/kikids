import { useSeasons, useCategories } from '@/hooks/useCategories';

export function CategoriesPage() {
  const seasons = useSeasons();
  const categories = useCategories();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Categorías / Temporadas</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold">Temporadas / Colecciones</h2>
          <ul className="space-y-1 text-sm">
            {seasons.map((s) => <li key={s.id}>{s.name}</li>)}
          </ul>
          {/* TODO: formulario de alta/edición de temporadas */}
        </div>

        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold">Categorías de prenda</h2>
          <ul className="space-y-1 text-sm">
            {categories.map((c) => <li key={c.id}>{c.name}</li>)}
          </ul>
          {/* TODO: formulario de alta/edición de categorías, con soporte parent_id */}
        </div>
      </div>
    </div>
  );
}
