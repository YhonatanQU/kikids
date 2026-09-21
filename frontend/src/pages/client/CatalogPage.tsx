import { useSearchParams } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import { FilterBar } from '@/components/catalog/FilterBar';
import type { Gender } from '@/types/catalog';

export function CatalogPage() {
  const [searchParams] = useSearchParams();

  const { products, loading, error } = useProducts({
    seasonSlug: searchParams.get('temporada') ?? undefined,
    gender: (searchParams.get('genero') as Gender) ?? undefined,
    categorySlug: searchParams.get('categoria') ?? undefined,
  });

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
    </div>
  );
}
