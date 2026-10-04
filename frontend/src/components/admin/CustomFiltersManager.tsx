import { TaxonomyManager } from './TaxonomyManager';

/**
 * CRUD de ejes de filtro personalizados (ej. "Talla", "Edad"): cada tipo se
 * administra con el mismo TaxonomyManager que temporadas/categorías/género,
 * y al expandir una fila aparece anidado otro TaxonomyManager con las
 * opciones de ese tipo puntual (filter_values, acotado por filter_type_id).
 * Las opciones se asignan después a cada producto desde su formulario.
 */
export function CustomFiltersManager() {
  return (
    <TaxonomyManager
      table="filter_types"
      title="Filtros personalizados (ej. Talla, Edad)"
      itemLabel="tipo de filtro"
      renderExpanded={(row) => (
        <TaxonomyManager
          table="filter_values"
          title={`Opciones de "${row.name}"`}
          itemLabel="opción"
          scopeColumn="filter_type_id"
          scopeValue={row.id}
        />
      )}
    />
  );
}
