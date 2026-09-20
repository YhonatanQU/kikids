import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <h1 className="text-3xl font-bold">404</h1>
      <p className="text-gray-500">Página no encontrada.</p>
      <Link to="/" className="text-brand-600 underline">Volver al inicio</Link>
    </div>
  );
}
