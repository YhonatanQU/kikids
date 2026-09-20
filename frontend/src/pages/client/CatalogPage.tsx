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
    <div className="px-4 py-6 md:px-8">
      <FilterBar />
      {loading && <p className="text-gray-500">Cargando catálogo...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && <ProductGrid products={products} />}
    </div>
  );
}
