import { Link, useLocation, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function OrderConfirmationPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const location = useLocation();
  // Viene de CheckoutForm vía navigate(path, { state }) justo al crear el
  // pedido. Si la página se recarga o se abre directo, no hay state — en
  // ese caso no se puede reconstruir el mensaje (no tenemos el carrito ya
  // vaciado), así que se muestra el aviso sin el botón.
  const whatsappLink = (location.state as { whatsappLink?: string } | null)?.whatsappLink;

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

      {whatsappLink ? (
        <>
          <p className="mt-6 text-sm text-ink-500">
            Tu stock quedó <strong className="text-ink-800">reservado por 2 horas</strong>. Toca el botón para
            enviarnos los datos de tu compra por WhatsApp y coordinar el pago.
          </p>
          <a href={whatsappLink} target="_blank" rel="noreferrer" className="mt-6 w-full">
            <Button variant="whatsapp" fullWidth size="lg">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12.001 2C6.478 2 2 6.477 2 12c0 1.86.505 3.686 1.463 5.278L2 22l4.828-1.44A9.96 9.96 0 0012.001 22C17.523 22 22 17.523 22 12S17.523 2 12.001 2zm0 18.222c-1.635 0-3.234-.44-4.63-1.272l-.331-.196-2.865.854.86-2.797-.216-.343A8.19 8.19 0 013.778 12c0-4.535 3.688-8.222 8.223-8.222 4.535 0 8.222 3.687 8.222 8.222 0 4.535-3.687 8.222-8.222 8.222z" />
              </svg>
              Enviar pedido por WhatsApp
            </Button>
          </a>
        </>
      ) : (
        <p className="mt-6 text-sm text-ink-500">
          Tu stock quedó <strong className="text-ink-800">reservado por 2 horas</strong>. Si no llegamos a coordinar
          por WhatsApp, escríbenos con tu número de pedido para confirmar el pago.
        </p>
      )}

      <Link to="/catalogo" className="mt-8">
        <Button variant="secondary">Seguir comprando</Button>
      </Link>
    </div>
  );
}
