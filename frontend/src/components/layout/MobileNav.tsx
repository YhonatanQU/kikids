import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  {
    to: '/',
    label: 'Inicio',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path d="M4 11.5L12 4l8 7.5M6 10v9a1 1 0 001 1h10a1 1 0 001-1v-9" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: '/catalogo',
    label: 'Catálogo',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6} />
        <rect x="13" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6} />
        <rect x="4" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6} />
        <rect x="13" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6} />
      </svg>
    ),
  },
  {
    to: '/catalogo?temporada=verano',
    label: 'Verano',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6} />
        <path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/catalogo?temporada=invierno',
    label: 'Invierno',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path d="M12 2v20M4.5 7l15 10M19.5 7l-15 10" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round" />
      </svg>
    ),
  },
];

/** Navegación táctil inferior — solo visible en móvil/tablet (brief 3.A). */
export function MobileNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-ink-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden">
      {NAV_ITEMS.map((item) => {
        const active = location.pathname + location.search === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
              active ? 'text-brand-600' : 'text-ink-400'
            }`}
          >
            {item.icon(active)}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
