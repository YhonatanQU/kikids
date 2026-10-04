import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export interface TaxonomyRow {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  display_order: number;
}
type Row = TaxonomyRow;

interface Props {
  table: 'seasons' | 'categories' | 'genders' | 'filter_types' | 'filter_values';
  title: string;
  itemLabel: string; // ej. "temporada", "categoría", "género" — para mensajes
  /** Para tablas hijas (ej. filter_values de un filter_type puntual): columna y
   * valor para acotar el select/insert, en vez de traer/crear filas de toda la tabla. */
  scopeColumn?: string;
  scopeValue?: string;
  /** Si se da, cada fila muestra una flecha para expandir/colapsar este contenido
   * debajo de ella (ej. el CRUD de opciones anidado dentro de cada tipo de filtro). */
  renderExpanded?: (row: Row) => React.ReactNode;
}

/** Quita tildes/signos y normaliza a slug (igual criterio que ProductForm usa para sus propios slugs). */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * CRUD genérico para las tablas de taxonomía del catálogo (temporadas,
 * categorías, géneros, y los tipos/opciones de filtro personalizados) —
 * todas comparten la misma forma (name/slug/is_active/display_order) y
 * las mismas policies RLS, así que un solo componente basta para todas
 * en vez de repetir el formulario cada vez. `scopeColumn`/`scopeValue`
 * acotan una tabla hija (ej. filter_values de un filter_type puntual) y
 * `renderExpanded` permite anidar otro CRUD de este mismo componente
 * debajo de cada fila.
 */
export function TaxonomyManager({ table, title, itemLabel, scopeColumn, scopeValue, renderExpanded }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    let query = supabase.from(table).select('id, name, slug, is_active, display_order');
    if (scopeColumn && scopeValue) query = query.eq(scopeColumn, scopeValue);
    query.order('display_order').then(({ data }) => {
      setRows((data ?? []) as Row[]);
      setLoading(false);
    });
  }

  useEffect(load, [table, scopeColumn, scopeValue]);

  async function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    setError(null);
    const slugBase = slugify(name);
    const slug = rows.some((r) => r.slug === slugBase) ? `${slugBase}-${Date.now().toString(36)}` : slugBase;
    const nextOrder = rows.length > 0 ? Math.max(...rows.map((r) => r.display_order)) + 1 : 1;
    const payload: Record<string, unknown> = { name, slug, display_order: nextOrder };
    if (scopeColumn && scopeValue) payload[scopeColumn] = scopeValue;
    const { error: insertError } = await supabase.from(table).insert(payload);
    setAdding(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setNewName('');
    load();
  }

  function startEdit(row: Row) {
    setEditingId(row.id);
    setEditingName(row.name);
  }

  async function saveEdit() {
    if (!editingId) return;
    const name = editingName.trim();
    const current = rows.find((r) => r.id === editingId);
    if (!name || name === current?.name) {
      setEditingId(null);
      return;
    }
    setBusyId(editingId);
    const { error: updateError } = await supabase.from(table).update({ name }).eq('id', editingId);
    setBusyId(null);
    setEditingId(null);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    load();
  }

  async function toggleActive(row: Row) {
    setBusyId(row.id);
    setError(null);
    const { error: updateError } = await supabase.from(table).update({ is_active: !row.is_active }).eq('id', row.id);
    setBusyId(null);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    load();
  }

  async function move(row: Row, direction: -1 | 1) {
    const sorted = [...rows].sort((a, b) => a.display_order - b.display_order);
    const index = sorted.findIndex((r) => r.id === row.id);
    const other = sorted[index + direction];
    if (!other) return;
    setBusyId(row.id);
    await Promise.all([
      supabase.from(table).update({ display_order: other.display_order }).eq('id', row.id),
      supabase.from(table).update({ display_order: row.display_order }).eq('id', other.id),
    ]);
    setBusyId(null);
    load();
  }

  async function handleDelete(row: Row) {
    if (!confirm(`¿Eliminar "${row.name}"? Esta acción no se puede deshacer.`)) return;
    setBusyId(row.id);
    setError(null);
    const { error: deleteError } = await supabase.from(table).delete().eq('id', row.id);
    setBusyId(null);
    if (deleteError) {
      // 23503 = foreign_key_violation: hay productos usando esta fila.
      alert(
        deleteError.code === '23503'
          ? `No se puede eliminar: hay productos usando esta ${itemLabel}. Desactívala (ícono del ojo) para ocultarla del catálogo sin perder esos productos.`
          : deleteError.message
      );
      return;
    }
    load();
  }

  return (
    <Card className="p-5">
      <h2 className="text-sm font-bold uppercase tracking-wide text-ink-400">{title}</h2>

      {error && <div className="mt-3 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{error}</div>}

      <div className="mt-3 flex gap-2">
        <Input
          placeholder={`Nueva ${itemLabel}...`}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Button type="button" loading={adding} disabled={!newName.trim()} onClick={handleAdd}>
          Agregar
        </Button>
      </div>

      {loading ? (
        <p className="mt-3 text-sm text-ink-400">Cargando...</p>
      ) : rows.length === 0 ? (
        <p className="mt-3 text-sm text-ink-400">Sin {itemLabel}s registradas.</p>
      ) : (
        <ul className="mt-3 divide-y divide-ink-100">
          {rows.map((row, i) => (
            <li key={row.id} className="py-2.5">
            <div className="flex items-center gap-1.5">
              {renderExpanded && (
                <button
                  type="button"
                  onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                  aria-label={expandedId === row.id ? 'Colapsar' : 'Expandir'}
                  className="shrink-0 text-ink-400 hover:text-ink-700"
                >
                  <svg viewBox="0 0 20 20" fill="none" className={`h-3.5 w-3.5 transition-transform ${expandedId === row.id ? 'rotate-90' : ''}`}>
                    <path d="M7 5l6 5-6 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
              <div className="flex shrink-0 flex-col">
                <button
                  type="button"
                  disabled={i === 0 || busyId === row.id}
                  onClick={() => move(row, -1)}
                  aria-label="Subir"
                  className="text-ink-300 hover:text-ink-600 disabled:opacity-30"
                >
                  <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
                    <path d="M5 12l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  disabled={i === rows.length - 1 || busyId === row.id}
                  onClick={() => move(row, 1)}
                  aria-label="Bajar"
                  className="text-ink-300 hover:text-ink-600 disabled:opacity-30"
                >
                  <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
                    <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              {editingId === row.id ? (
                <input
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit();
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  onBlur={saveEdit}
                  className="flex-1 rounded-lg border border-brand-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40"
                />
              ) : (
                <span className={`flex-1 truncate text-sm font-medium ${row.is_active ? 'text-ink-700' : 'text-ink-300 line-through'}`}>
                  {row.name}
                </span>
              )}

              <button
                type="button"
                title={row.is_active ? 'Ocultar del catálogo' : 'Mostrar en catálogo'}
                onClick={() => toggleActive(row)}
                disabled={busyId === row.id}
                className={`shrink-0 rounded-lg p-1.5 ${row.is_active ? 'text-brand-500 hover:bg-brand-50' : 'text-ink-300 hover:bg-ink-50'}`}
              >
                {row.is_active ? (
                  <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                    <path d="M1 10s3-6 9-6 9 6 9 6-3 6-9 6-9-6-9-6z" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                    <path
                      d="M3 3l14 14M1 10s3-6 9-6c1.5 0 2.8.35 3.9.9M19 10s-1 2-3 3.6M7.5 7.8A2.5 2.5 0 0010 12.5c.5 0 1-.15 1.4-.4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </button>

              <button
                type="button"
                title="Editar"
                onClick={() => startEdit(row)}
                disabled={busyId === row.id}
                className="shrink-0 rounded-lg p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink-700"
              >
                <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                  <path d="M13.5 3.5l3 3L7 16l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <button
                type="button"
                title="Eliminar"
                onClick={() => handleDelete(row)}
                disabled={busyId === row.id}
                className="shrink-0 rounded-lg p-1.5 text-ink-300 hover:bg-red-50 hover:text-red-500"
              >
                <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                  <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {renderExpanded && expandedId === row.id && (
              <div className="mt-2 ml-5">{renderExpanded(row)}</div>
            )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
