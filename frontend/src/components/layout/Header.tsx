import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { CartDrawer } from '@/components/cart/CartDrawer';

const NAV_LINKS = [
  { to: '/catalogo?temporada=verano', label: 'Verano' },
  { to: '/catalogo?temporada=invierno', label: 'Invierno' },
  { to: '/catalogo?genero=nino', label: 'Niños' },
  { to: '/catalogo?genero=nina', label: 'Niñas' },
  { to: '/catalogo?genero=bebe', label: 'Bebés' },
];

export function Header() {
  const [cartOpen, setCartOpen] = useState(false);
  const itemCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
        <Link to="/" className="flex items-center gap-2">
          <img src="/icon-192.png" alt="KIKIDS" className="h-9 w-9" />
          <span className="text-xl font-extrabold tracking-tight text-ink-900">KIKIDS</span>
        </Link>

        {/* Menú de categorías superior permanente — solo desktop (ver brief sección 3.A) */}
        <nav className="hidden gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={() => setCartOpen(true)}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-ink-600 transition-colors hover:bg-ink-50"
          aria-label="Abrir carrito"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path d="M3 3h2l.4 2M7 13h10l3-7H5.4M7 13L5.4 5M7 13l-2 5h13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="9" cy="20" r="1.4" fill="currentColor" />
            <circle cx="17" cy="20" r="1.4" fill="currentColor" />
          </svg>
          {itemCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[11px] font-bold text-white shadow-soft">
              {itemCount}
            </span>
          )}
        </button>
      </div>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </header>
  );
}
