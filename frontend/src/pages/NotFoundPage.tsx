import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-ink-50 px-4 text-center">
      <span className="text-6xl font-extrabold text-brand-500">404</span>
      <p className="text-ink-500">No encontramos esta página.</p>
      <Link to="/" className="mt-3">
        <Button variant="secondary">Volver al inicio</Button>
      </Link>
    </div>
  );
}
