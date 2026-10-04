import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import { useCustomFilterTypes } from '@/hooks/useCustomFilters';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import { FilterBar } from '@/components/catalog/FilterBar';

const RESERVED_PARAMS = new Set(['temporada', 'genero', 'categoria']);

export function CatalogPage() {
  const [searchParams] = useSearchParams();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const customFilterTypes = useCustomFilterTypes();

  // Cualquier filtro personalizado activo (ej. ?talla=2-anos) además de los
  // tres fijos — se resuelve por slug del tipo, nunca por nombre fijo en código,
  // ya que estos tipos los crea el admin libremente.
  const customFilters = useMemo(() => {
    const map: Record<string, string> = {};
    for (const ft of customFilterTypes) {
      if (RESERVED_PARAMS.has(ft.slug)) continue;
      const value = searchParams.get(ft.slug);
      if (value) map[ft.slug] = value;
    }
    return map;
  }, [customFilterTypes, searchParams]);

  const { products, loading, error } = useProducts({
    seasonSlug: searchParams.get('temporada') ?? undefined,
    genderSlug: searchParams.get('genero') ?? undefined,
    categorySlug: searchParams.get('categoria') ?? undefined,
    customFilters,
  });

  // El botón "subir" solo aparece después de bajar un poco — no tiene
  // sentido mostrarlo si ya se está arriba del todo.
  useEffect(() => {
    function onScroll() {
      setShowScrollTop(window.scrollY > 400);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
      <h1 className="mb-4 text-xl font-extrabold tracking-tight text-ink-900 md:text-2xl">Catálogo</h1>
      <FilterBar />
      {loading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 md:gap-5 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-ink-100" />
          ))}
        </div>
      )}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && <ProductGrid products={products} />}

      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Subir"
          title="Subir"
          className="fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-white shadow-soft transition-transform hover:scale-105 hover:bg-brand-600 md:bottom-6"
        >
          <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
            <path d="M10 15V5M5 9l5-5 5 5" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
