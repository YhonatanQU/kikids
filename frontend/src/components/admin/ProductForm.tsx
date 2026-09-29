import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSeasons, useCategories } from '@/hooks/useCategories';
import { KIDS_SIZES, sizeLabel } from '@/lib/sizes';
import { formatPEN } from '@/lib/formatCurrency';
import { decodeImageFilename, type DecodedImageSku } from '@/lib/skuDecoder';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import type { Gender, Product, ProductImage } from '@/types/catalog';

interface VariantDraft {
  id?: string; // presente si ya existe en la DB (modo edición)
  size: string;
  color: string;
  colorHex: string;
  stockQuantity: number;
  sku: string;
}

interface Props {
  editingProduct?: Product | null;
  onSaved: () => void;
  onCancelEdit?: () => void;
}

const MAX_PHOTOS = 3;

const STEPS = [
  { id: 1, label: 'Fotos y video' },
  { id: 2, label: 'Datos y costeo' },
  { id: 3, label: 'Variantes' },
] as const;

const emptyVariant = (): VariantDraft => ({
  size: KIDS_SIZES[0].value,
  color: '',
  colorHex: '#000000',
  stockQuantity: 0,
  sku: '',
});

function blankState() {
  return {
    name: '',
    description: '',
    gender: 'nino' as Gender,
    seasonId: '',
    categoryId: '',
    costPrice: 0,
    freightCost: 0,
    adminCost: 0,
    markupPercentage: 30,
    discountPercentage: 0,
    discountActive: false,
    variants: [emptyVariant()],
  };
}

/**
 * Alta/edición de producto en 3 pasos: (1) fotos/video — con detección
 * automática de temporada/talla/precio de compra/SKU a partir del nombre
 * de la primera foto, (2) datos, clasificación, costeo y descuento, y
 * (3) variantes (talla/color/stock) + guardar. La carga de imágenes va a
 * Supabase Storage (bucket "product-images").
 */
export function ProductForm({ editingProduct, onSaved, onCancelEdit }: Props) {
  const seasons = useSeasons();
  const categories = useCategories();
  const isEditing = !!editingProduct;

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [name, setName] = useState(blankState().name);
  const [description, setDescription] = useState(blankState().description);
  const [gender, setGender] = useState<Gender>(blankState().gender);
  const [seasonId, setSeasonId] = useState(blankState().seasonId);
  const [categoryId, setCategoryId] = useState(blankState().categoryId);

  const [costPrice, setCostPrice] = useState(blankState().costPrice);
  const [freightCost, setFreightCost] = useState(blankState().freightCost);
  const [adminCost, setAdminCost] = useState(blankState().adminCost);
  const [markupPercentage, setMarkupPercentage] = useState(blankState().markupPercentage);
  const [discountPercentage, setDiscountPercentage] = useState(blankState().discountPercentage);
  const [discountActive, setDiscountActive] = useState(blankState().discountActive);

  const [variants, setVariants] = useState<VariantDraft[]>(blankState().variants);
  const [deletedVariantIds, setDeletedVariantIds] = useState<string[]>([]);

  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<{ file: File; url: string }[]>([]);

  const [decoded, setDecoded] = useState<DecodedImageSku | null>(null);
  const [useImageDetails, setUseImageDetails] = useState(true);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [urlImporting, setUrlImporting] = useState(false);
  const existingImagesCountRef = useRef(0);

  const [existingVideoUrl, setExistingVideoUrl] = useState<string | null>(null);
  const [deleteExistingVideo, setDeleteExistingVideo] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carga los datos del producto a editar (o limpia el formulario al salir de edición).
  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name);
      setDescription(editingProduct.description ?? '');
      setGender(editingProduct.gender);
      setSeasonId(editingProduct.seasonId);
      setCategoryId(editingProduct.categoryId);
      setCostPrice(editingProduct.costPrice);
      setFreightCost(editingProduct.freightCost);
      setAdminCost(editingProduct.adminCost);
      setMarkupPercentage(editingProduct.markupPercentage);
      setDiscountPercentage(editingProduct.discountPercentage);
      setDiscountActive(editingProduct.discountActive);
      setVariants(
        editingProduct.variants.length
          ? editingProduct.variants.map((v) => ({
              id: v.id,
              size: v.size,
              color: v.color,
              colorHex: v.colorHex ?? '#000000',
              stockQuantity: v.stockQuantity,
              sku: v.sku,
            }))
          : [emptyVariant()]
      );
      setExistingImages(editingProduct.images);
      setDeletedVariantIds([]);
      setDeletedImageIds([]);
      setImages([]);
      setDecoded(null);
      setExistingVideoUrl(editingProduct.videoUrl);
      setDeleteExistingVideo(false);
      setVideoFile(null);
      setError(null);
      setStep(1);
    } else {
      resetForm();
    }
  }, [editingProduct]);

  // Vistas previas de las fotos nuevas seleccionadas (con su nombre de
  // archivo debajo) — se liberan los object URLs al reemplazar la selección.
  useEffect(() => {
    const list = images.map((file) => ({ file, url: URL.createObjectURL(file) }));
    setImagePreviews(list);
    return () => {
      list.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [images]);

  useEffect(() => {
    existingImagesCountRef.current = existingImages.length;
  }, [existingImages.length]);

  // Aplica los datos detectados en el nombre de la primera foto a los
  // campos correspondientes mientras el check "Usar detalles de la
  // imagen" esté activo.
  useEffect(() => {
    if (!decoded || !useImageDetails) return;
    if (decoded.seasonSlug) {
      const season = seasons.find((s) => s.slug === decoded.seasonSlug);
      if (season) setSeasonId(season.id);
    }
    setCostPrice(decoded.costPrice);
    setVariants((prev) =>
      prev.map((v, i) =>
        i === 0
          ? {
              ...v,
              size: KIDS_SIZES.some((s) => s.value === decoded.sizeDigit) ? decoded.sizeDigit : v.size,
              sku: decoded.sku,
            }
          : v
      )
    );
  }, [decoded, useImageDetails, seasons]);

  // Precio de venta = costo_total / (1 - margen%). Es margen (% sobre el
  // precio de venta), no markup (% sobre el costo) — ej. margen 30% y
  // costo 70 -> precio 100 (la ganancia de 30 es el 30% del precio final).
  const totalCost = costPrice + freightCost + adminCost;
  const marginRatio = Math.min(markupPercentage, 99) / 100;
  const salePrice = useMemo(() => {
    const divisor = 1 - marginRatio;
    return divisor > 0 ? Math.round((totalCost / divisor) * 100) / 100 : 0;
  }, [totalCost, marginRatio]);
  const discountedPrice = useMemo(() => {
    if (!discountActive || discountPercentage <= 0) return salePrice;
    return Math.round(salePrice * (1 - discountPercentage / 100) * 100) / 100;
  }, [salePrice, discountActive, discountPercentage]);

  function addVariantRow() {
    setVariants((prev) => [...prev, emptyVariant()]);
  }

  function removeVariantRow(index: number) {
    const removed = variants[index];
    if (removed.id) setDeletedVariantIds((prev) => [...prev, removed.id!]);
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  function updateVariant(index: number, patch: Partial<VariantDraft>) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  function removeExistingImage(imageId: string) {
    setDeletedImageIds((prev) => [...prev, imageId]);
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
  }

  /** Punto único de entrada para agregar fotos nuevas, vengan de donde
   * vengan (selector de archivos, arrastradas, pegadas con Ctrl+V, o
   * importadas por enlace). Se acumulan (no se reemplazan) hasta el
   * máximo de MAX_PHOTOS — así la primera foto se mantiene siempre como
   * tal aunque después se agreguen más, y la detección de SKU (que solo
   * lee esa primera foto) no cambia por accidente. Usa una ref para el
   * conteo de fotos existentes para poder ser estable entre renders. */
  const addFiles = useCallback((newFiles: File[]) => {
    if (newFiles.length === 0) return;
    setImages((prev) => {
      const remaining = Math.max(MAX_PHOTOS - existingImagesCountRef.current - prev.length, 0);
      if (newFiles.length > remaining) {
        setError(`Máximo ${MAX_PHOTOS} fotos por producto. Se tomaron las primeras ${remaining}.`);
      }
      const added = newFiles.slice(0, remaining);
      if (added.length === 0) return prev;
      if (prev.length === 0) setDecoded(decodeImageFilename(added[0].name));
      return [...prev, ...added];
    });
  }, []);

  // No todas las fotos vienen como archivo local: a veces se copian desde
  // Drive, WhatsApp Web, etc. y se pegan directo. Mientras el paso 1 esté
  // activo, cualquier imagen pegada con Ctrl+V se agrega igual que si se
  // hubiera subido desde el selector de archivos.
  useEffect(() => {
    if (step !== 1) return;
    function handlePaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      const pasted: File[] = [];
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) pasted.push(file);
        }
      }
      if (pasted.length === 0) return;
      e.preventDefault();
      addFiles(pasted);
    }
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [step, addFiles]);

  function handlePhotosSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    addFiles(Array.from(fileList));
  }

  /** Quita una foto nueva (aún no subida) de la selección. Si era la
   * primera, la detección se recalcula con la que pase a ocupar ese lugar. */
  function removeNewImage(index: number) {
    const next = images.filter((_, i) => i !== index);
    setImages(next);
    if (index === 0) {
      setDecoded(next.length > 0 ? decodeImageFilename(next[0].name) : null);
    }
  }

  /** Importa una foto desde un enlace (Drive u otro sitio). La descarga la
   * hace nuestro propio servidor (api/fetch-image), no el navegador — así
   * se evita el bloqueo de CORS que Drive y otros sitios aplican a un
   * fetch() hecho directo desde el cliente, y de paso se recupera el
   * nombre real del archivo (clave para que el SKU se detecte bien). */
  async function handleAddImageFromUrl() {
    const rawUrl = imageUrlInput.trim();
    if (!rawUrl) return;
    setUrlImporting(true);
    setError(null);
    try {
      const res = await fetch(`/api/fetch-image?url=${encodeURIComponent(rawUrl)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || 'No se pudo cargar la imagen desde ese enlace.');
      }
      const blob = await res.blob();
      const filenameHeader = res.headers.get('X-Filename');
      const name = filenameHeader ? decodeURIComponent(filenameHeader) : `imagen-${Date.now()}.jpg`;
      addFiles([new File([blob], name, { type: blob.type || 'image/jpeg' })]);
      setImageUrlInput('');
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'No se pudo cargar esa imagen desde el enlace. Copia la imagen y pégala aquí con Ctrl+V, o descárgala y súbela como archivo.'
      );
    } finally {
      setUrlImporting(false);
    }
  }

  /** Check desactivado: quita del formulario lo que se había autocompletado. */
  function handleToggleUseImageDetails(checked: boolean) {
    setUseImageDetails(checked);
    if (!checked) {
      setSeasonId('');
      setCostPrice(0);
      setVariants((prev) => prev.map((v, i) => (i === 0 ? { ...v, size: KIDS_SIZES[0].value, sku: '' } : v)));
    }
  }

  function resetForm() {
    const blank = blankState();
    setName(blank.name);
    setDescription(blank.description);
    setGender(blank.gender);
    setSeasonId(blank.seasonId);
    setCategoryId(blank.categoryId);
    setCostPrice(blank.costPrice);
    setFreightCost(blank.freightCost);
    setAdminCost(blank.adminCost);
    setMarkupPercentage(blank.markupPercentage);
    setDiscountPercentage(blank.discountPercentage);
    setDiscountActive(blank.discountActive);
    setVariants(blank.variants);
    setDeletedVariantIds([]);
    setExistingImages([]);
    setDeletedImageIds([]);
    setImages([]);
    setDecoded(null);
    setUseImageDetails(true);
    setImageUrlInput('');
    setExistingVideoUrl(null);
    setDeleteExistingVideo(false);
    setVideoFile(null);
    setStep(1);
  }

  /** Devuelve mensajes de error (si los hay) en vez de tragárselos en
   * silencio — así "se guardó pero la foto no subió" queda visible. */
  async function uploadImages(productId: string): Promise<string[]> {
    if (images.length === 0) return [];
    const failures: string[] = [];
    for (const file of images) {
      const path = `${productId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file);
      if (uploadError) {
        failures.push(`${file.name}: ${uploadError.message}`);
        continue;
      }
      const { data: publicUrl } = supabase.storage.from('product-images').getPublicUrl(path);
      const { error: insertError } = await supabase
        .from('product_images')
        .insert({ product_id: productId, url: publicUrl.publicUrl });
      if (insertError) failures.push(`${file.name}: ${insertError.message}`);
    }
    return failures;
  }

  /** Sube el video (si hay uno nuevo) y devuelve la url final a guardar
   * en products.video_url — null si se quitó, undefined si no cambió. */
  async function resolveVideoUrl(productId: string): Promise<{ videoUrl: string | null | undefined; error: string | null }> {
    if (videoFile) {
      const path = `${productId}/video-${Date.now()}-${videoFile.name}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(path, videoFile);
      if (uploadError) return { videoUrl: undefined, error: `${videoFile.name}: ${uploadError.message}` };
      const { data: publicUrl } = supabase.storage.from('product-images').getPublicUrl(path);
      return { videoUrl: publicUrl.publicUrl, error: null };
    }
    if (deleteExistingVideo) return { videoUrl: null, error: null };
    return { videoUrl: undefined, error: null }; // sin cambios
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name,
      description: description || null,
      gender,
      season_id: seasonId,
      category_id: categoryId,
      cost_price: costPrice,
      freight_cost: freightCost,
      admin_cost: adminCost,
      markup_percentage: markupPercentage,
      base_price: salePrice,
      discount_percentage: discountPercentage,
      discount_active: discountActive,
    };

    let productId: string;

    if (isEditing) {
      productId = editingProduct!.id;
      const { error: updateError } = await supabase.from('products').update(payload).eq('id', productId);
      if (updateError) {
        setSaving(false);
        setError(updateError.message);
        return;
      }

      if (deletedVariantIds.length > 0) {
        await supabase.from('product_variants').delete().in('id', deletedVariantIds);
      }
      if (deletedImageIds.length > 0) {
        await supabase.from('product_images').delete().in('id', deletedImageIds);
      }

      for (const v of variants) {
        if (v.id) {
          await supabase
            .from('product_variants')
            .update({ size: v.size, color: v.color, color_hex: v.colorHex, stock_quantity: v.stockQuantity, sku: v.sku })
            .eq('id', v.id);
        } else {
          await supabase.from('product_variants').insert({
            product_id: productId,
            size: v.size,
            color: v.color,
            color_hex: v.colorHex,
            stock_quantity: v.stockQuantity,
            sku: v.sku,
          });
        }
      }
    } else {
      const slug = `${name}-${Date.now().toString(36)}`
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({ ...payload, slug })
        .select()
        .single();

      if (productError || !product) {
        setSaving(false);
        setError(productError?.message ?? 'Error al crear el producto');
        return;
      }
      productId = product.id;

      await supabase.from('product_variants').insert(
        variants.map((v) => ({
          product_id: productId,
          size: v.size,
          color: v.color,
          color_hex: v.colorHex,
          stock_quantity: v.stockQuantity,
          sku: v.sku,
        }))
      );
    }

    const uploadFailures = await uploadImages(productId);

    const { videoUrl, error: videoError } = await resolveVideoUrl(productId);
    if (videoError) uploadFailures.push(videoError);
    if (videoUrl !== undefined) {
      await supabase.from('products').update({ video_url: videoUrl }).eq('id', productId);
    }

    setSaving(false);
    resetForm(); // el producto ya se guardó; evita reenviar y duplicarlo
    onSaved();

    if (uploadFailures.length > 0) {
      setError(
        `El producto se guardó, pero no se pudo subir: ${uploadFailures.join('; ')}. Ábrelo con "Editar" para volver a intentar.`
      );
    }
  }

  const totalPhotos = existingImages.length + images.length;

  return (
    <Card className="p-6 sm:p-7">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-ink-900">{isEditing ? 'Editar producto' : 'Registrar producto'}</h2>
        {onCancelEdit && (
          <button type="button" onClick={onCancelEdit} className="text-sm font-medium text-ink-400 hover:text-ink-700">
            {isEditing ? 'Cancelar' : 'Cerrar'}
          </button>
        )}
      </div>

      {/* Indicador de pasos — clicable para saltar entre pasos ya que es
          un panel interno de admin, no un checkout de cliente. */}
      <div className="mt-5 flex items-center">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex flex-1 items-center last:flex-none">
            <button
              type="button"
              onClick={() => setStep(s.id)}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                step === s.id
                  ? 'bg-brand-500 text-white'
                  : step > s.id
                    ? 'bg-brand-100 text-brand-600'
                    : 'bg-ink-100 text-ink-400'
              }`}
              aria-label={`Ir al paso ${s.id}: ${s.label}`}
            >
              {step > s.id ? '✓' : s.id}
            </button>
            <span className={`ml-2 hidden text-xs font-semibold sm:block ${step === s.id ? 'text-ink-900' : 'text-ink-400'}`}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && <div className={`mx-3 h-px flex-1 ${step > s.id ? 'bg-brand-300' : 'bg-ink-100'}`} />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {step === 1 && (
          <>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wide text-ink-400">Fotos</h3>
                <span className="text-xs text-ink-400">{totalPhotos}/{MAX_PHOTOS}</span>
              </div>

              {existingImages.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {existingImages.map((img) => (
                    <div key={img.id} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-ink-100">
                      <img src={img.url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(img.id)}
                        className="absolute inset-0 flex items-center justify-center bg-ink-900/0 text-white opacity-0 transition-opacity group-hover:bg-ink-900/50 group-hover:opacity-100"
                      >
                        <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
                          <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {imagePreviews.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-3">
                  {imagePreviews.map((p, i) => (
                    <div key={i} className="w-20 text-center">
                      <div className="group relative h-20 w-20 overflow-hidden rounded-lg border border-ink-100">
                        <img src={p.url} alt={p.file.name} className="h-full w-full object-cover" />
                        {i === 0 && (
                          <span className="absolute left-1 top-1 rounded-full bg-brand-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                            1ª
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeNewImage(i)}
                          className="absolute inset-0 flex items-center justify-center bg-ink-900/0 text-white opacity-0 transition-opacity group-hover:bg-ink-900/50 group-hover:opacity-100"
                        >
                          <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
                            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                      <p className="mt-1 truncate text-[10px] text-ink-400" title={p.file.name}>
                        {p.file.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {totalPhotos < MAX_PHOTOS ? (
                <>
                  <label
                    className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink-200 bg-ink-50/50 px-4 py-8 text-center transition-colors hover:border-brand-300 hover:bg-brand-50/40"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const dropped = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
                      if (dropped.length > 0) addFiles(dropped);
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-ink-300">
                      <path d="M12 16V4m0 0L7 9m5-5l5 5M5 20h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="mt-2 text-sm font-medium text-ink-600">
                      {imagePreviews.length > 0 ? `${imagePreviews.length} archivo(s) seleccionado(s)` : 'Arrastra, pega (Ctrl+V) o haz clic para subir fotos'}
                    </span>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handlePhotosSelected(e.target.files)} />
                  </label>

                  <div className="mt-2 flex gap-2">
                    <input
                      type="url"
                      placeholder="O pega el enlace de una imagen (Drive, etc.)"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      className="flex-1 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      loading={urlImporting}
                      disabled={!imageUrlInput.trim()}
                      onClick={handleAddImageFromUrl}
                    >
                      Agregar
                    </Button>
                  </div>
                  <p className="mt-1 text-[11px] text-ink-400">
                    Las fotos no tienen que estar en tu computadora: cópialas de Drive, WhatsApp Web, etc. y pégalas aquí con Ctrl+V, o pega el enlace.
                  </p>
                </>
              ) : (
                <p className="mt-3 text-xs text-ink-400">Máximo de {MAX_PHOTOS} fotos alcanzado. Quita una para agregar otra.</p>
              )}

              <div className="mt-3 rounded-xl border border-ink-100 bg-ink-50/50 p-3.5">
                <label className={`flex items-center gap-2 text-sm font-medium ${decoded ? 'cursor-pointer text-ink-700' : 'cursor-not-allowed text-ink-400'}`}>
                  <input
                    type="checkbox"
                    disabled={!decoded}
                    checked={useImageDetails}
                    onChange={(e) => handleToggleUseImageDetails(e.target.checked)}
                    className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-400/40 disabled:opacity-50"
                  />
                  Usar detalles de la imagen (temporada, talla, precio de compra y SKU)
                </label>
                {decoded ? (
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                    <span className="rounded-full bg-white px-2 py-0.5 font-medium text-ink-600 shadow-soft">SKU: {decoded.sku}</span>
                    <span className="rounded-full bg-white px-2 py-0.5 font-medium text-ink-600 shadow-soft">{decoded.seasonLabel}</span>
                    <span className="rounded-full bg-white px-2 py-0.5 font-medium text-ink-600 shadow-soft">
                      Talla {sizeLabel(decoded.sizeDigit)}
                    </span>
                    <span className="rounded-full bg-white px-2 py-0.5 font-medium text-ink-600 shadow-soft">
                      Compra {formatPEN(decoded.costPrice)}
                    </span>
                  </div>
                ) : (
                  <p className="mt-1.5 text-[11px] text-ink-400">
                    Nombra la foto como el proveedor (ej. I329-073.jpg) para detectar estos datos automáticamente.
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-ink-100 pt-5">
              <h3 className="text-xs font-bold uppercase tracking-wide text-ink-400">Video del producto</h3>

              {existingVideoUrl && !deleteExistingVideo ? (
                <div className="group relative mt-3 w-40 overflow-hidden rounded-lg border border-ink-100">
                  <video src={existingVideoUrl} className="h-24 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setDeleteExistingVideo(true)}
                    className="absolute inset-0 flex items-center justify-center bg-ink-900/0 text-white opacity-0 transition-opacity group-hover:bg-ink-900/50 group-hover:opacity-100"
                  >
                    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
                      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              ) : (
                <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink-200 bg-ink-50/50 px-4 py-8 text-center transition-colors hover:border-brand-300 hover:bg-brand-50/40">
                  <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-ink-300">
                    <path d="M15 10l4.5-2.5v9L15 14M4 6h9a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="mt-2 text-sm font-medium text-ink-600">
                    {videoFile ? videoFile.name : 'Un video (opcional)'}
                  </span>
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      setVideoFile(e.target.files?.[0] ?? null);
                      setDeleteExistingVideo(false);
                    }}
                  />
                </label>
              )}
            </div>

            <div className="flex gap-3">
              <Button type="button" size="lg" fullWidth onClick={() => setStep(2)}>
                Siguiente
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-ink-400">Datos generales</h3>
              <div className="mt-3 space-y-4">
                <Input
                  label="Nombre del producto"
                  required
                  placeholder="Polo estampado dinosaurio"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-700">Descripción del producto</label>
                  <textarea
                    rows={3}
                    placeholder="Tela 100% algodón, estampado frontal, cuello redondo..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full resize-none rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-ink-100 pt-5">
              <h3 className="text-xs font-bold uppercase tracking-wide text-ink-400">Clasificación</h3>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Select label="Género" value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
                  <option value="nino">Niño</option>
                  <option value="nina">Niña</option>
                  <option value="bebe">Bebé</option>
                  <option value="unisex">Unisex</option>
                </Select>
                <div>
                  <Select label="Temporada" required value={seasonId} onChange={(e) => setSeasonId(e.target.value)}>
                    <option value="" disabled>Elegir</option>
                    {seasons.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </Select>
                  {decoded && useImageDetails && decoded.seasonSlug && (
                    <p className="mt-1 text-[11px] text-brand-600">Detectado de la foto</p>
                  )}
                </div>
                <Select label="Categoría" required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="" disabled>Elegir</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="border-t border-ink-100 pt-5">
              <h3 className="text-xs font-bold uppercase tracking-wide text-ink-400">Costeo y precio de venta</h3>
              <div className="mt-3 grid grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Precio de compra (S/)"
                    required
                    type="number"
                    min={0}
                    step="0.10"
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                  />
                  {decoded && useImageDetails && (
                    <p className="mt-1 text-[11px] text-brand-600">Detectado de la foto</p>
                  )}
                </div>
                <Input
                  label="Flete por prenda (S/)"
                  type="number"
                  min={0}
                  step="0.10"
                  value={freightCost}
                  onChange={(e) => setFreightCost(Number(e.target.value))}
                />
                <Input
                  label="Gastos administrativos (S/)"
                  type="number"
                  min={0}
                  step="0.10"
                  value={adminCost}
                  onChange={(e) => setAdminCost(Number(e.target.value))}
                />
                <Input
                  label="Margen (%)"
                  required
                  type="number"
                  min={0}
                  step="1"
                  value={markupPercentage}
                  onChange={(e) => setMarkupPercentage(Number(e.target.value))}
                />
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3">
                <div>
                  <p className="text-xs font-medium text-brand-700">Precio de venta (calculado)</p>
                  <p className="text-[11px] text-brand-500">
                    {formatPEN(totalCost)} ÷ (1 − {markupPercentage}%)
                  </p>
                </div>
                <p className="text-2xl font-extrabold text-brand-700">{formatPEN(salePrice)}</p>
              </div>
              {markupPercentage >= 99 && (
                <p className="mt-2 text-xs text-red-500">El margen debe ser menor a 100%.</p>
              )}
            </div>

            <div className="border-t border-ink-100 pt-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wide text-ink-400">Descuento</h3>
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-ink-700">
                  <input
                    type="checkbox"
                    checked={discountActive}
                    onChange={(e) => setDiscountActive(e.target.checked)}
                    className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-400/40"
                  />
                  Activo
                </label>
              </div>
              <div className="mt-3">
                <Input
                  label="Descuento (%)"
                  type="number"
                  min={0}
                  max={100}
                  step="1"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                />
              </div>
              {discountActive && discountPercentage > 0 && (
                <div className="mt-4 flex items-center justify-between rounded-xl bg-red-50 px-4 py-3">
                  <div>
                    <p className="text-xs font-medium text-red-700">Precio con descuento</p>
                    <p className="text-[11px] text-red-500 line-through">{formatPEN(salePrice)}</p>
                  </div>
                  <p className="text-2xl font-extrabold text-red-600">{formatPEN(discountedPrice)}</p>
                </div>
              )}
              {discountPercentage < 0 || discountPercentage > 100 ? (
                <p className="mt-2 text-xs text-red-500">El descuento debe estar entre 0 y 100%.</p>
              ) : null}
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="secondary" size="lg" onClick={() => setStep(1)}>
                Atrás
              </Button>
              <Button type="button" size="lg" fullWidth onClick={() => setStep(3)}>
                Siguiente
              </Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wide text-ink-400">Variantes (talla / color / stock)</h3>
                <button type="button" onClick={addVariantRow} className="text-sm font-semibold text-brand-600 hover:text-brand-700">
                  + Añadir variante
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {variants.map((v, i) => (
                  <div key={v.id ?? `new-${i}`} className="flex flex-wrap items-center gap-2 rounded-xl border border-ink-100 bg-ink-50/50 p-2.5">
                    <select value={v.size} onChange={(e) => updateVariant(i, { size: e.target.value })}
                      className="rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40">
                      {/* Preserva tallas antiguas (texto libre, previas al select cerrado) que no calzan con KIDS_SIZES */}
                      {!KIDS_SIZES.some((s) => s.value === v.size) && v.size && (
                        <option value={v.size}>{v.size} (heredada)</option>
                      )}
                      {KIDS_SIZES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    <input placeholder="Color" value={v.color} onChange={(e) => updateVariant(i, { color: e.target.value })}
                      className="w-24 flex-1 rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40" />
                    <input type="color" value={v.colorHex} onChange={(e) => updateVariant(i, { colorHex: e.target.value })}
                      className="h-9 w-9 shrink-0 rounded-lg border border-ink-200 bg-white p-0.5" />
                    <input type="number" placeholder="Stock" value={v.stockQuantity}
                      onChange={(e) => updateVariant(i, { stockQuantity: Number(e.target.value) })}
                      className="w-20 rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40" />
                    <input placeholder="SKU" value={v.sku} onChange={(e) => updateVariant(i, { sku: e.target.value })}
                      className="w-24 flex-1 rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40" />
                    <button type="button" onClick={() => removeVariantRow(i)} disabled={variants.length === 1}
                      className="shrink-0 rounded-lg p-1.5 text-ink-300 hover:bg-red-50 hover:text-red-500 disabled:opacity-30 disabled:hover:bg-transparent">
                      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                        <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              {decoded && useImageDetails && (
                <p className="mt-2 text-[11px] text-brand-600">Talla y SKU de la primera variante detectados de la foto</p>
              )}
            </div>

            <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wide text-ink-400">Resumen</h3>
              <div className="mt-2 space-y-1 text-sm text-ink-700">
                <p><span className="text-ink-400">Producto:</span> {name || '—'}</p>
                <p><span className="text-ink-400">Fotos:</span> {totalPhotos}/{MAX_PHOTOS}</p>
                <p>
                  <span className="text-ink-400">Precio de venta:</span>{' '}
                  {discountActive && discountPercentage > 0 ? (
                    <>
                      <span className="font-semibold text-red-600">{formatPEN(discountedPrice)}</span>{' '}
                      <span className="text-ink-400 line-through">{formatPEN(salePrice)}</span>
                    </>
                  ) : (
                    <span className="font-semibold">{formatPEN(salePrice)}</span>
                  )}
                </p>
              </div>
            </div>

            {error && <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{error}</div>}

            <div className="flex gap-3">
              <Button type="button" variant="secondary" size="lg" onClick={() => setStep(2)}>
                Atrás
              </Button>
              <Button type="submit" loading={saving} size="lg" fullWidth>
                {isEditing ? 'Guardar cambios' : 'Guardar producto'}
              </Button>
            </div>
          </>
        )}
      </form>
    </Card>
  );
}
