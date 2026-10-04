import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSeasons, useCategories, useGenders } from '@/hooks/useCategories';
import { KIDS_SIZES } from '@/lib/sizes';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

interface Props {
  onImported: () => void;
  onClose: () => void;
}

interface ImportRow {
  seasonLabel: string;
  size: string;
  costPrice: number;
  sku: string;
  imageUrl: string;
  filename: string;
}

interface ImportResult {
  sku: string;
  ok: boolean;
  error?: string;
}

/** CSV simple, con soporte básico de campos entre comillas (por si la
 * hoja exporta algún texto con comas). */
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  function splitLine(line: string): string[] {
    const cells: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQuotes) {
        if (c === '"') {
          if (line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          cur += c;
        }
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        cells.push(cur);
        cur = '';
      } else {
        cur += c;
      }
    }
    cells.push(cur);
    return cells;
  }

  const header = splitLine(lines[0]).map((h) => h.trim().toUpperCase());
  return lines.slice(1).map((line) => {
    const cells = splitLine(line);
    const row: Record<string, string> = {};
    header.forEach((h, i) => {
      row[h] = (cells[i] ?? '').trim();
    });
    return row;
  });
}

function toImportRows(raw: Record<string, string>[]): ImportRow[] {
  return raw
    .map((r) => ({
      seasonLabel: r['CATEGORIA'] ?? r['TEMPORADA'] ?? '',
      size: r['TALLA'] ?? '',
      costPrice: Number(r['PRECIO COMPRA'] ?? r['PRECIO_COMPRA'] ?? 0),
      sku: r['SKU'] ?? '',
      imageUrl: r['URL IMAGEN'] ?? r['URL_IMAGEN'] ?? '',
      filename: r['NOMBRE ARCHIVO'] ?? r['NOMBRE_ARCHIVO'] ?? '',
    }))
    .filter((r) => r.sku && r.imageUrl && r.size);
}

/**
 * Importa productos en lote desde un CSV tipo "ficha de fotos" (temporada,
 * talla, precio de compra, SKU y enlace de la imagen por fila — un producto
 * por fila, con una sola variante). La categoría (tipo de prenda), género,
 * margen y stock inicial no vienen en ese CSV, así que se eligen una vez
 * para todo el lote. Las fotos se traen vía api/fetch-image (mismo proxy
 * que el botón "pegar enlace" del formulario normal) para evitar el bloqueo
 * de CORS de Drive y poder resolver el nombre real del archivo.
 */
export function BulkImportCsv({ onImported, onClose }: Props) {
  const seasons = useSeasons();
  const categories = useCategories();
  const genders = useGenders();

  const [csvText, setCsvText] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [genderId, setGenderId] = useState('');
  const [marginPercentage, setMarginPercentage] = useState(30);
  const [initialStock, setInitialStock] = useState(1);

  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<ImportResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Por defecto "Unisex" (si existe) en cuanto cargan los géneros, para no
  // obligar a elegir en el caso más común de este tipo de importación masiva.
  useEffect(() => {
    if (genderId || genders.length === 0) return;
    const unisex = genders.find((g) => g.slug === 'unisex');
    setGenderId((unisex ?? genders[0]).id);
  }, [genders, genderId]);

  const rows = useMemo(() => toImportRows(parseCsv(csvText)), [csvText]);
  const seasonCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of rows) counts.set(r.seasonLabel.toUpperCase(), (counts.get(r.seasonLabel.toUpperCase()) ?? 0) + 1);
    return counts;
  }, [rows]);

  function handleFile(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCsvText(String(reader.result ?? ''));
    reader.readAsText(file);
  }

  async function handleImport() {
    if (rows.length === 0 || !categoryId || !genderId) return;
    setImporting(true);
    setError(null);
    setResults([]);
    setProgress({ done: 0, total: rows.length });

    const collected: ImportResult[] = [];

    for (const row of rows) {
      try {
        const season = seasons.find(
          (s) => s.slug.toLowerCase() === row.seasonLabel.toLowerCase() || s.name.toLowerCase() === row.seasonLabel.toLowerCase()
        );
        if (!season) throw new Error(`Temporada "${row.seasonLabel}" no existe`);

        const marginRatio = Math.min(marginPercentage, 99) / 100;
        const basePrice = Math.round((row.costPrice / (1 - marginRatio)) * 100) / 100;
        const slug = `${row.sku}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');

        const { data: product, error: productError } = await supabase
          .from('products')
          .insert({
            name: row.sku,
            description: null,
            gender_id: genderId,
            season_id: season.id,
            category_id: categoryId,
            cost_price: row.costPrice,
            freight_cost: 0,
            admin_cost: 0,
            markup_percentage: marginPercentage,
            base_price: basePrice,
            slug,
          })
          .select()
          .single();
        if (productError || !product) throw new Error(productError?.message ?? 'No se pudo crear el producto');

        const { error: variantError } = await supabase.from('product_variants').insert({
          product_id: product.id,
          size: row.size,
          color: '',
          sku: row.sku,
          stock_quantity: initialStock,
        });
        if (variantError) throw new Error(`Producto creado, pero la variante falló: ${variantError.message}`);

        const imgRes = await fetch(`/api/fetch-image?url=${encodeURIComponent(row.imageUrl)}`);
        if (!imgRes.ok) {
          const body = await imgRes.json().catch(() => null);
          throw new Error(`Producto creado, pero la foto falló: ${body?.error ?? 'no se pudo descargar'}`);
        }
        const blob = await imgRes.blob();
        const filenameHeader = imgRes.headers.get('X-Filename');
        const filename = filenameHeader ? decodeURIComponent(filenameHeader) : row.filename || `${row.sku}.jpg`;
        const path = `${product.id}/${Date.now()}-${filename}`;
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(path, blob, { contentType: blob.type || 'image/jpeg' });
        if (uploadError) throw new Error(`Producto creado, pero no se pudo subir la foto: ${uploadError.message}`);

        const { data: publicUrl } = supabase.storage.from('product-images').getPublicUrl(path);
        const { error: imageError } = await supabase
          .from('product_images')
          .insert({ product_id: product.id, url: publicUrl.publicUrl });
        if (imageError) throw new Error(`Producto y foto subidos, pero no se pudo registrar la imagen: ${imageError.message}`);

        collected.push({ sku: row.sku, ok: true });
      } catch (err) {
        collected.push({ sku: row.sku, ok: false, error: err instanceof Error ? err.message : 'Error desconocido' });
      }
      setProgress((p) => ({ ...p, done: p.done + 1 }));
      setResults([...collected]);
    }

    setImporting(false);
    onImported();
  }

  const okCount = results.filter((r) => r.ok).length;
  const failCount = results.filter((r) => !r.ok).length;
  const finished = !importing && results.length > 0 && results.length === rows.length;

  return (
    <Card className="p-6 sm:p-7">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-ink-900">Importar productos desde CSV</h2>
        <button type="button" onClick={onClose} className="text-sm font-medium text-ink-400 hover:text-ink-700">
          Cerrar
        </button>
      </div>
      <p className="mt-1.5 text-sm text-ink-500">
        Para fichas de fotos con temporada, talla, precio de compra, SKU y enlace de imagen por fila (una fila = un
        producto con una variante). La categoría, género, margen y stock inicial se aplican a todo el lote.
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-700">Archivo CSV</label>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-ink-600 file:mr-3 file:rounded-lg file:border-0 file:bg-ink-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-ink-700 hover:file:bg-ink-200"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-700">O pega el contenido del CSV</label>
          <textarea
            rows={5}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="CATEGORIA,TALLA,PRECIO COMPRA,SKU,URL IMAGEN..."
            className="w-full resize-none rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 font-mono text-xs text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400"
          />
        </div>

        {rows.length > 0 && (
          <div className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
            <p className="font-semibold">{rows.length} productos detectados</p>
            <p className="mt-0.5 text-xs text-brand-600">
              {[...seasonCounts.entries()].map(([k, v]) => `${k}: ${v}`).join(' · ')}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Categoría (para todo el lote)" required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="" disabled>Elegir</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Select label="Género" required value={genderId} onChange={(e) => setGenderId(e.target.value)}>
            <option value="" disabled>Elegir</option>
            {genders.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </Select>
          <Input
            label="Margen (%)"
            type="number"
            min={0}
            step="1"
            value={marginPercentage}
            onChange={(e) => setMarginPercentage(Number(e.target.value))}
          />
          <Input
            label="Stock inicial por producto"
            type="number"
            min={0}
            step="1"
            value={initialStock}
            onChange={(e) => setInitialStock(Number(e.target.value))}
          />
        </div>

        {rows.some((r) => !KIDS_SIZES.some((s) => s.value === r.size)) && (
          <p className="text-xs text-amber-600">
            Algunas tallas del CSV no están en la lista cerrada de tallas — se guardan igual, pero podrías querer
            revisarlas después en cada producto.
          </p>
        )}

        {error && <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{error}</div>}

        {progress.total > 0 && (
          <div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
              <div
                className="h-full rounded-full bg-brand-500 transition-all"
                style={{ width: `${(progress.done / progress.total) * 100}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-ink-500">
              {importing ? `Importando ${progress.done}/${progress.total}...` : `${progress.done}/${progress.total} procesados`}
            </p>
          </div>
        )}

        {finished && (
          <div className="rounded-xl border border-ink-100 p-4">
            <p className="text-sm font-semibold text-ink-800">
              {okCount} creados{failCount > 0 ? `, ${failCount} con error` : ''}
            </p>
            {failCount > 0 && (
              <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-red-600">
                {results.filter((r) => !r.ok).map((r, i) => (
                  <li key={i}>
                    <span className="font-mono">{r.sku}</span>: {r.error}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            size="lg"
            fullWidth
            loading={importing}
            disabled={rows.length === 0 || !categoryId || !genderId}
            onClick={handleImport}
          >
            Importar {rows.length > 0 ? rows.length : ''} productos
          </Button>
        </div>
      </div>
    </Card>
  );
}
