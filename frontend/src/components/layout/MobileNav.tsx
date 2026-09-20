import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Inicio', icon: '🏠' },
  { to: '/catalogo', label: 'Catálogo', icon: '🧒' },
  { to: '/catalogo?temporada=verano', label: 'Verano', icon: '☀️' },
  { to: '/catalogo?temporada=invierno', label: 'Invierno', icon: '❄️' },
];

/** Navegación táctil inferior — solo visible en móvil/tablet (brief 3.A). */
export function MobileNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-gray-100 bg-white md:hidden">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className={`flex flex-1 flex-col items-center py-2 text-xs ${
            location.pathname + location.search === item.to ? 'text-brand-600' : 'text-gray-500'
          }`}
        >
          <span className="text-lg">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
