import { TaxonomyManager } from '@/components/admin/TaxonomyManager';

export function CategoriesPage() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold tracking-tight text-ink-900">Categorías / Temporadas / Género</h1>
      <p className="mb-6 text-sm text-ink-500">
        Estas opciones aparecen como filtros en el catálogo público. Usa las flechas para ordenarlas, el ícono del
        ojo para ocultarlas sin borrarlas, y el lápiz para renombrarlas.
      </p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <TaxonomyManager table="seasons" title="Temporadas / Colecciones" itemLabel="temporada" />
        <TaxonomyManager table="categories" title="Categorías de prenda" itemLabel="categoría" />
        <TaxonomyManager table="genders" title="Género" itemLabel="género" />
      </div>
    </div>
  );
}
