import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSeasons, useCategories } from '@/hooks/useCategories';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import type { Gender } from '@/types/catalog';

interface VariantDraft {
  size: string;
  color: string;
  colorHex: string;
  stockQuantity: number;
  sku: string;
}

interface Props {
  onSaved: () => void;
}

const emptyVariant = (): VariantDraft => ({ size: '', color: '', colorHex: '#000000', stockQuantity: 0, sku: '' });

/**
 * Alta/edición de producto con sus variantes (talla/color/stock) en un
 * solo formulario. La carga masiva de imágenes va a Supabase Storage
 * (bucket "product-images") y luego se registran las URLs en product_images.
 */
export function ProductForm({ onSaved }: Props) {
  const seasons = useSeasons();
  const categories = useCategories();
  const [name, setName] = useState('');
  const [basePrice, setBasePrice] = useState(0);
  const [gender, setGender] = useState<Gender>('nino');
  const [seasonId, setSeasonId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [variants, setVariants] = useState<VariantDraft[]>([emptyVariant()]);
  const [images, setImages] = useState<FileList | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addVariantRow() {
    setVariants((prev) => [...prev, emptyVariant()]);
  }

  function removeVariantRow(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  function updateVariant(index: number, patch: Partial<VariantDraft>) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({ name, slug, base_price: basePrice, gender, season_id: seasonId, category_id: categoryId })
      .select()
      .single();

    if (productError || !product) {
      setSaving(false);
      setError(productError?.message ?? 'Error al crear el producto');
      return;
    }

    await supabase.from('product_variants').insert(
      variants.map((v) => ({
        product_id: product.id,
        size: v.size,
        color: v.color,
        color_hex: v.colorHex,
        stock_quantity: v.stockQuantity,
        sku: v.sku,
      }))
    );

    if (images) {
      for (const file of Array.from(images)) {
        const path = `${product.id}/${file.name}`;
        const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file);
        if (!uploadError) {
          const { data: publicUrl } = supabase.storage.from('product-images').getPublicUrl(path);
          await supabase.from('product_images').insert({ product_id: product.id, url: publicUrl.publicUrl });
        }
      }
    }

    setSaving(false);
    onSaved();
  }

  return (
    <Card className="p-6 sm:p-7">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-ink-400">Datos generales</h3>
          <div className="mt-3 space-y-4">
            <Input
              label="Nombre del producto"
              required
              placeholder="Polo estampado dinosaurio"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input
                label="Precio base (S/)"
                required
                type="number"
                min={0}
                step="0.10"
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
              />
              <Select label="Género" value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
                <option value="nino">Niño</option>
                <option value="nina">Niña</option>
                <option value="bebe">Bebé</option>
                <option value="unisex">Unisex</option>
              </Select>
              <Select label="Temporada" required value={seasonId} onChange={(e) => setSeasonId(e.target.value)}>
                <option value="" disabled>Selecciona</option>
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </div>
            <Select label="Categoría" required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="" disabled>Selecciona</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
        </div>

        <div className="border-t border-ink-100 pt-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wide text-ink-400">Variantes (talla / color / stock)</h3>
            <button type="button" onClick={addVariantRow} className="text-sm font-semibold text-brand-600 hover:text-brand-700">
              + Añadir variante
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {variants.map((v, i) => (
              <div key={i} className="flex items-center gap-2 rounded-xl border border-ink-100 bg-ink-50/50 p-2.5">
                <input placeholder="Talla" value={v.size} onChange={(e) => updateVariant(i, { size: e.target.value })}
                  className="w-16 rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40" />
                <input placeholder="Color" value={v.color} onChange={(e) => updateVariant(i, { color: e.target.value })}
                  className="w-28 flex-1 rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40" />
                <input type="color" value={v.colorHex} onChange={(e) => updateVariant(i, { colorHex: e.target.value })}
                  className="h-9 w-9 shrink-0 rounded-lg border border-ink-200 bg-white p-0.5" />
                <input type="number" placeholder="Stock" value={v.stockQuantity}
                  onChange={(e) => updateVariant(i, { stockQuantity: Number(e.target.value) })}
                  className="w-20 rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40" />
                <input placeholder="SKU" value={v.sku} onChange={(e) => updateVariant(i, { sku: e.target.value })}
                  className="w-28 rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40" />
                <button type="button" onClick={() => removeVariantRow(i)} disabled={variants.length === 1}
                  className="shrink-0 rounded-lg p-1.5 text-ink-300 hover:bg-red-50 hover:text-red-500 disabled:opacity-30 disabled:hover:bg-transparent">
                  <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                    <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-ink-100 pt-5">
          <h3 className="text-sm font-bold uppercase tracking-wide text-ink-400">Fotos</h3>
          <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink-200 bg-ink-50/50 px-4 py-8 text-center transition-colors hover:border-brand-300 hover:bg-brand-50/40">
            <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-ink-300">
              <path d="M12 16V4m0 0L7 9m5-5l5 5M5 20h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="mt-2 text-sm font-medium text-ink-600">
              {images && images.length > 0 ? `${images.length} archivo(s) seleccionado(s)` : 'Arrastra o haz clic para subir fotos'}
            </span>
            <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => setImages(e.target.files)} />
          </label>
        </div>

        {error && <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{error}</div>}

        <Button type="submit" loading={saving} size="lg">
          Guardar producto
        </Button>
      </form>
    </Card>
  );
}
