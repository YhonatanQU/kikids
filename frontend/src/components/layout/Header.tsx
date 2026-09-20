import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { CartDrawer } from '@/components/cart/CartDrawer';

export function Header() {
  const [cartOpen, setCartOpen] = useState(false);
  const itemCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
        <Link to="/" className="text-xl font-bold text-brand-600">KIKIDS</Link>

        {/* Menú de categorías superior permanente — solo desktop (ver brief sección 3.A) */}
        <nav className="hidden gap-6 text-sm font-medium text-gray-700 md:flex">
          <Link to="/catalogo?temporada=verano">Verano</Link>
          <Link to="/catalogo?temporada=invierno">Invierno</Link>
          <Link to="/catalogo?genero=nino">Niños</Link>
          <Link to="/catalogo?genero=nina">Niñas</Link>
          <Link to="/catalogo?genero=bebe">Bebés</Link>
        </nav>

        <button onClick={() => setCartOpen(true)} className="relative rounded-full p-2 hover:bg-gray-50">
          🛒
          {itemCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-xs text-white">
              {itemCount}
            </span>
          )}
        </button>
      </div>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </header>
  );
}
