import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const ADMIN_NAV = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/productos', label: 'Productos' },
  { to: '/admin/categorias', label: 'Categorías / Temporadas' },
  { to: '/admin/pedidos', label: 'Pedidos' },
];

/** Panel de administración: optimizado para escritorio/tablet (brief 3.B). */
export function AdminLayout() {
  const { signOut } = useAuth();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 flex-col border-r border-gray-100 bg-white p-4 md:flex">
        <p className="mb-6 text-lg font-bold text-brand-600">KIKIDS Admin</p>
        <nav className="flex flex-col gap-1 text-sm">
          {ADMIN_NAV.map((item) => (
            <Link key={item.to} to={item.to} className="rounded-md px-3 py-2 hover:bg-gray-50">
              {item.label}
            </Link>
          ))}
        </nav>
        <button onClick={signOut} className="mt-auto rounded-md px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50">
          Cerrar sesión
        </button>
      </aside>
      <main className="flex-1 bg-gray-50 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
