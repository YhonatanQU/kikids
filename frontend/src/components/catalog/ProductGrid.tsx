import type { Product } from '@/types/catalog';
import { ProductCard } from './ProductCard';

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return <p className="py-12 text-center text-gray-500">No hay productos para este filtro.</p>;
  }

  return (
    // Responsive: 2 columnas en móvil, hasta 5 en desktop (ver sección 3.A del brief)
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:gap-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
