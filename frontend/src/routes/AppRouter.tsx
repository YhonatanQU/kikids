import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';

import { PublicLayout } from '@/components/layout/PublicLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';

import { HomePage } from '@/pages/client/HomePage';
import { CatalogPage } from '@/pages/client/CatalogPage';
import { ProductDetailPage } from '@/pages/client/ProductDetailPage';
import { CheckoutPage } from '@/pages/client/CheckoutPage';
import { OrderConfirmationPage } from '@/pages/client/OrderConfirmationPage';

import { LoginPage } from '@/pages/admin/LoginPage';
import { DashboardPage } from '@/pages/admin/DashboardPage';
import { ProductsPage } from '@/pages/admin/ProductsPage';
import { OrdersPage } from '@/pages/admin/OrdersPage';
import { CategoriesPage } from '@/pages/admin/CategoriesPage';

import { NotFoundPage } from '@/pages/NotFoundPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Vista pública / e-commerce */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/catalogo" element={<CatalogPage />} />
            <Route path="/producto/:slug" element={<ProductDetailPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/pedido-confirmado/:orderNumber" element={<OrderConfirmationPage />} />
          </Route>

          {/* Login admin (fuera del layout protegido) */}
          <Route path="/admin/login" element={<LoginPage />} />

          {/* Panel admin protegido */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<DashboardPage />} />
              <Route path="/admin/productos" element={<ProductsPage />} />
              <Route path="/admin/categorias" element={<CategoriesPage />} />
              <Route path="/admin/pedidos" element={<OrdersPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
