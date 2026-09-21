import { useSearchParams } from 'react-router-dom';
import { useSeasons, useCategories } from '@/hooks/useCategories';
import type { Gender } from '@/types/catalog';

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'nino', label: 'Niños' },
  { value: 'nina', label: 'Niñas' },
  { value: 'bebe', label: 'Bebés' },
];

const selectClass =
  'rounded-xl border border-ink-200 bg-white px-3.5 py-2 text-sm font-medium text-ink-700 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400/40';

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

  const hasFilters = searchParams.toString().length > 0;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
      <select className={selectClass} value={searchParams.get('temporada') ?? ''} onChange={(e) => updateFilter('temporada', e.target.value || null)}>
        <option value="">Temporada</option>
        {seasons.map((s) => (
          <option key={s.id} value={s.slug}>{s.name}</option>
        ))}
      </select>

      <select className={selectClass} value={searchParams.get('genero') ?? ''} onChange={(e) => updateFilter('genero', e.target.value || null)}>
        <option value="">Género</option>
        {GENDERS.map((g) => (
          <option key={g.value} value={g.value}>{g.label}</option>
        ))}
      </select>

      <select className={selectClass} value={searchParams.get('categoria') ?? ''} onChange={(e) => updateFilter('categoria', e.target.value || null)}>
        <option value="">Categoría</option>
        {categories.map((c) => (
          <option key={c.id} value={c.slug}>{c.name}</option>
        ))}
      </select>

      {hasFilters && (
        <button
          onClick={() => setSearchParams(new URLSearchParams())}
          className="rounded-xl px-3 py-2 text-sm font-medium text-ink-400 hover:text-brand-600"
        >
          Limpiar
        </button>
      )}
    </div>
  );
}
