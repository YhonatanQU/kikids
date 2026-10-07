import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const ADMIN_NAV = [
  { to: '/admin', label: 'Dashboard', icon: 'M4 13h6V4H4v9zm0 7h6v-5H4v5zm10 0h6V11h-6v9zm0-16v5h6V4h-6z' },
  { to: '/admin/productos', label: 'Productos', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { to: '/admin/categorias', label: 'Categorías / Filtros', icon: 'M4 6h16M4 12h16M4 18h7' },
  { to: '/admin/pedidos', label: 'Pedidos', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
];

const LOGOUT_ICON = 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h2m4-14l5 5-5 5m5-5H9';

const SIDEBAR_COLLAPSED_KEY = 'kikids-admin-sidebar-collapsed';

function BrandMark({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <img src="/icon-192.png" alt="KIKIDS" className="h-8 w-8 shrink-0" />
      {!collapsed && <span className="text-lg font-extrabold tracking-tight text-ink-900">KIKIDS</span>}
    </span>
  );
}

interface TooltipState {
  label: string;
  top: number;
  left: number;
}

/** Tooltip del sidebar contraído, portado a document.body: el <aside> tiene
 * overflow-y-auto (para cuando el menú crece), y por la regla de CSS que
 * convierte el otro eje de "visible" a "auto" en cuanto uno de los dos no
 * es "visible", cualquier cosa posicionada fuera de su borde horizontal
 * quedaba recortada e invisible — igual problema que tuvo el CartDrawer con
 * el backdrop-filter del header. Portarlo fuera de ese contenedor lo evita. */
function SidebarTooltip({ tooltip }: { tooltip: TooltipState | null }) {
  if (!tooltip) return null;
  return createPortal(
    <div
      className="pointer-events-none fixed z-[100] -translate-y-1/2 whitespace-nowrap rounded-lg bg-ink-900 px-3 py-1.5 text-xs font-semibold text-white shadow-card"
      style={{ top: tooltip.top, left: tooltip.left }}
    >
      {tooltip.label}
      <span className="absolute right-full top-1/2 h-0 w-0 -translate-y-1/2 border-[5px] border-transparent border-r-ink-900" />
    </div>,
    document.body
  );
}

/** Ícono + etiqueta — en modo contraído la etiqueta se oculta (el tooltip se
 * muestra aparte, vía SidebarTooltip). */
function NavItemContent({ icon, label, collapsed }: { icon: string; label: string; collapsed: boolean }) {
  return (
    <>
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0">
        <path d={icon} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {!collapsed && label}
    </>
  );
}

interface TooltipHandlers {
  onShowTooltip: (label: string, el: HTMLElement) => void;
  onHideTooltip: () => void;
}

function NavLinks({
  onNavigate,
  collapsed = false,
  onShowTooltip,
  onHideTooltip,
}: { onNavigate?: () => void; collapsed?: boolean } & Partial<TooltipHandlers>) {
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
            aria-label={collapsed ? item.label : undefined}
            onMouseEnter={collapsed ? (e) => onShowTooltip?.(item.label, e.currentTarget) : undefined}
            onMouseLeave={collapsed ? onHideTooltip : undefined}
            onFocus={collapsed ? (e) => onShowTooltip?.(item.label, e.currentTarget) : undefined}
            onBlur={collapsed ? onHideTooltip : undefined}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              collapsed ? 'justify-center' : ''
            } ${active ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50'}`}
          >
            <NavItemContent icon={item.icon} label={item.label} collapsed={collapsed} />
          </Link>
        );
      })}
    </nav>
  );
}

function LogoutButton({
  onClick,
  collapsed = false,
  onShowTooltip,
  onHideTooltip,
}: { onClick: () => void; collapsed?: boolean } & Partial<TooltipHandlers>) {
  return (
    <button
      onClick={onClick}
      aria-label={collapsed ? 'Cerrar sesión' : undefined}
      onMouseEnter={collapsed ? (e) => onShowTooltip?.('Cerrar sesión', e.currentTarget) : undefined}
      onMouseLeave={collapsed ? onHideTooltip : undefined}
      onFocus={collapsed ? (e) => onShowTooltip?.('Cerrar sesión', e.currentTarget) : undefined}
      onBlur={collapsed ? onHideTooltip : undefined}
      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-ink-400 hover:bg-red-50 hover:text-red-500 ${
        collapsed ? 'justify-center' : ''
      }`}
    >
      <NavItemContent icon={LOGOUT_ICON} label="Cerrar sesión" collapsed={collapsed} />
    </button>
  );
}

/** Panel de administración: sidebar fijo en escritorio/tablet (contraíble a
 * solo iconos, con tooltip al pasar el mouse), menú hamburguesa en móvil. */
export function AdminLayout() {
  const { signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
    } catch {
      // modo privado / storage bloqueado: no es crítico, simplemente no se recuerda la preferencia
    }
    if (!collapsed) setTooltip(null); // al expandir, no queda un tooltip de un hover ya viejo
  }, [collapsed]);

  function showTooltip(label: string, el: HTMLElement) {
    const rect = el.getBoundingClientRect();
    setTooltip({ label, top: rect.top + rect.height / 2, left: rect.right + 10 });
  }
  function hideTooltip() {
    setTooltip(null);
  }

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
            <LogoutButton onClick={signOut} />
          </div>
        </div>
      )}

      {/* Sidebar fijo — solo escritorio/tablet. "sticky" + alto de viewport
          para que no se vaya con el scroll cuando el listado (ej. 100+
          tarjetas de producto) es más alto que la pantalla. Contraíble: el
          botón de la flecha achica el ancho a solo-íconos y la preferencia
          se recuerda en localStorage. */}
      <aside
        className={`hidden shrink-0 flex-col border-r border-ink-100 bg-white p-4 transition-all duration-200 md:flex md:sticky md:top-0 md:h-screen md:overflow-y-auto ${
          collapsed ? 'w-[72px]' : 'w-60'
        }`}
      >
        <div className={`mb-6 flex items-center gap-2 ${collapsed ? 'flex-col' : 'justify-between px-2'}`}>
          <Link to="/admin">
            <BrandMark collapsed={collapsed} />
          </Link>
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-50 hover:text-ink-700"
          >
            <svg viewBox="0 0 20 20" fill="none" className={`h-3.5 w-3.5 transition-transform ${collapsed ? 'rotate-180' : ''}`}>
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <NavLinks collapsed={collapsed} onShowTooltip={showTooltip} onHideTooltip={hideTooltip} />
        <LogoutButton onClick={signOut} collapsed={collapsed} onShowTooltip={showTooltip} onHideTooltip={hideTooltip} />
      </aside>

      <SidebarTooltip tooltip={tooltip} />

      <main className="flex-1 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
