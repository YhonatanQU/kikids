import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function ProtectedRoute() {
  const { session, loading } = useAuth();

  if (loading) return null;
  if (!session) return <Navigate to="/admin/login" replace />;

  return <Outlet />;
}
