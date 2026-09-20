import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
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

/**
 * Alta/edición de producto con sus variantes (talla/color/stock) en un
 * solo formulario. La carga masiva de imágenes va a Supabase Storage
 * (bucket "product-images") y luego se registran las URLs en product_images.
 */
export function ProductForm({ onSaved }: Props) {
  const [name, setName] = useState('');
  const [basePrice, setBasePrice] = useState(0);
  const [gender, setGender] = useState<Gender>('nino');
  const [seasonId, setSeasonId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [variants, setVariants] = useState<VariantDraft[]>([
    { size: '', color: '', colorHex: '#000000', stockQuantity: 0, sku: '' },
  ]);
  const [images, setImages] = useState<FileList | null>(null);
  const [saving, setSaving] = useState(false);

  function addVariantRow() {
    setVariants((prev) => [...prev, { size: '', color: '', colorHex: '#000000', stockQuantity: 0, sku: '' }]);
  }

  function updateVariant(index: number, patch: Partial<VariantDraft>) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({ name, slug, base_price: basePrice, gender, season_id: seasonId, category_id: categoryId })
      .select()
      .single();

    if (productError || !product) {
      setSaving(false);
      alert(productError?.message ?? 'Error al crear el producto');
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
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-100 bg-white p-6">
      <input required placeholder="Nombre del producto" value={name} onChange={(e) => setName(e.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2" />

      <div className="grid grid-cols-3 gap-3">
        <input required type="number" placeholder="Precio base (S/)" value={basePrice}
          onChange={(e) => setBasePrice(Number(e.target.value))}
          className="rounded-md border border-gray-300 px-3 py-2" />
        <select value={gender} onChange={(e) => setGender(e.target.value as Gender)}
          className="rounded-md border border-gray-300 px-3 py-2">
          <option value="nino">Niño</option>
          <option value="nina">Niña</option>
          <option value="bebe">Bebé</option>
          <option value="unisex">Unisex</option>
        </select>
        <input required placeholder="ID de temporada" value={seasonId} onChange={(e) => setSeasonId(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2" />
      </div>

      <input required placeholder="ID de categoría" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2" />

      <div>
        <p className="mb-2 font-medium">Variantes (talla / color / stock)</p>
        {variants.map((v, i) => (
          <div key={i} className="mb-2 grid grid-cols-5 gap-2">
            <input placeholder="Talla" value={v.size} onChange={(e) => updateVariant(i, { size: e.target.value })}
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm" />
            <input placeholder="Color" value={v.color} onChange={(e) => updateVariant(i, { color: e.target.value })}
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm" />
            <input type="color" value={v.colorHex} onChange={(e) => updateVariant(i, { colorHex: e.target.value })}
              className="h-9 rounded-md border border-gray-300" />
            <input type="number" placeholder="Stock" value={v.stockQuantity}
              onChange={(e) => updateVariant(i, { stockQuantity: Number(e.target.value) })}
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm" />
            <input placeholder="SKU" value={v.sku} onChange={(e) => updateVariant(i, { sku: e.target.value })}
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm" />
          </div>
        ))}
        <button type="button" onClick={addVariantRow} className="text-sm text-brand-600">
          + Añadir variante
        </button>
      </div>

      <div>
        <p className="mb-1 font-medium">Fotos (carga múltiple)</p>
        <input type="file" multiple accept="image/*" onChange={(e) => setImages(e.target.files)} />
      </div>

      <button type="submit" disabled={saving} className="rounded-md bg-brand-600 px-6 py-2 font-medium text-white disabled:opacity-40">
        {saving ? 'Guardando...' : 'Guardar producto'}
      </button>
    </form>
  );
}
