import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const ADMIN_NAV = [
  { to: '/admin', label: 'Dashboard', icon: 'M4 13h6V4H4v9zm0 7h6v-5H4v5zm10 0h6V11h-6v9zm0-16v5h6V4h-6z' },
  { to: '/admin/productos', label: 'Productos', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { to: '/admin/categorias', label: 'Categorías / Temporadas', icon: 'M4 6h16M4 12h16M4 18h7' },
  { to: '/admin/pedidos', label: 'Pedidos', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
];

function BrandMark() {
  return (
    <span className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-extrabold text-white">K</span>
      <span className="text-lg font-extrabold tracking-tight text-ink-900">KIKIDS</span>
    </span>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  return (
    <nav className="flex flex-1 flex-col gap-1">
      {ADMIN_NAV.map((item) => {
        const active = location.pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              active ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50'
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0">
              <path d={item.icon} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Panel de administración: sidebar fijo en escritorio/tablet, menú hamburguesa en móvil (brief 3.B). */
export function AdminLayout() {
  const { signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-ink-50 md:flex">
      {/* Barra superior + menú hamburguesa — solo móvil */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-ink-100 bg-white px-4 py-3 md:hidden">
        <Link to="/admin">
          <BrandMark />
        </Link>
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menú"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-600 hover:bg-ink-50"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-[2px]" />
          <div
            className="relative flex h-full w-72 max-w-[80%] flex-col bg-white p-4 shadow-soft"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-8 flex items-center justify-between px-2">
              <BrandMark />
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Cerrar menú"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-50 hover:text-ink-700"
              >
                <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                  <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <NavLinks onNavigate={() => setMenuOpen(false)} />
            <button
              onClick={signOut}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-ink-400 hover:bg-red-50 hover:text-red-500"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h2m4-14l5 5-5 5m5-5H9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Cerrar sesión
            </button>
          </div>
        </div>
      )}

      {/* Sidebar fijo — solo escritorio/tablet */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-ink-100 bg-white p-4 md:flex">
        <Link to="/admin" className="mb-8 px-2">
          <BrandMark />
        </Link>
        <NavLinks />
        <button
          onClick={signOut}
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-ink-400 hover:bg-red-50 hover:text-red-500"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h2m4-14l5 5-5 5m5-5H9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Cerrar sesión
        </button>
      </aside>

      <main className="flex-1 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
