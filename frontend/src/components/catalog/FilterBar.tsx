import { useSearchParams } from 'react-router-dom';
import { useSeasons, useCategories } from '@/hooks/useCategories';
import type { Gender } from '@/types/catalog';

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'nino', label: 'Niños' },
  { value: 'nina', label: 'Niñas' },
  { value: 'bebe', label: 'Bebés' },
];

/**
 * Filtro cruzado Temporada -> Género -> Categoría.
 * En desktop se muestra como menú horizontal permanente; en móvil
 * colapsa en un carrusel/scroll horizontal (ver AdminLayout vs PublicLayout).
 */
export function FilterBar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const seasons = useSeasons();
  const categories = useCategories();

  function updateFilter(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  }

  return (
    <div className="mb-4 flex flex-wrap gap-2 overflow-x-auto pb-2 md:flex-nowrap">
      <select
        className="rounded-md border border-gray-200 px-3 py-2 text-sm"
        value={searchParams.get('temporada') ?? ''}
        onChange={(e) => updateFilter('temporada', e.target.value || null)}
      >
        <option value="">Temporada</option>
        {seasons.map((s) => (
          <option key={s.id} value={s.slug}>{s.name}</option>
        ))}
      </select>

      <select
        className="rounded-md border border-gray-200 px-3 py-2 text-sm"
        value={searchParams.get('genero') ?? ''}
        onChange={(e) => updateFilter('genero', e.target.value || null)}
      >
        <option value="">Género</option>
        {GENDERS.map((g) => (
          <option key={g.value} value={g.value}>{g.label}</option>
        ))}
      </select>

      <select
        className="rounded-md border border-gray-200 px-3 py-2 text-sm"
        value={searchParams.get('categoria') ?? ''}
        onChange={(e) => updateFilter('categoria', e.target.value || null)}
      >
        <option value="">Categoría</option>
        {categories.map((c) => (
          <option key={c.id} value={c.slug}>{c.name}</option>
        ))}
      </select>
    </div>
  );
}
