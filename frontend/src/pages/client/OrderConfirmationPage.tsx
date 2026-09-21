import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function OrderConfirmationPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8">
          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-ink-900">¡Pedido registrado!</h1>

      <Card className="mt-6 w-full p-5">
        <p className="text-sm text-ink-500">Número de pedido</p>
        <p className="mt-1 font-mono text-lg font-bold text-brand-600">#{orderNumber}</p>
      </Card>

      <p className="mt-6 text-sm text-ink-500">
        Tu stock quedó <strong className="text-ink-800">reservado por 2 horas</strong>. Se abrió WhatsApp con los
        datos de tu compra — envía el mensaje para coordinar el pago por Yape, Plin o transferencia.
      </p>

      <Link to="/catalogo" className="mt-8">
        <Button variant="secondary">Seguir comprando</Button>
      </Link>
    </div>
  );
}
