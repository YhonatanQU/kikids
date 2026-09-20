import { useParams } from 'react-router-dom';

export function OrderConfirmationPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();

  return (
    <div className="px-4 py-12 text-center">
      <h1 className="text-2xl font-bold text-green-600">¡Pedido registrado!</h1>
      <p className="mt-2 text-gray-600">
        Tu pedido <strong>#{orderNumber}</strong> quedó con stock reservado por 2 horas.
      </p>
      <p className="mt-1 text-gray-600">
        Se abrió WhatsApp con los datos de tu compra — envía el mensaje para coordinar el pago.
      </p>
    </div>
  );
}
