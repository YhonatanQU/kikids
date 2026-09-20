import { OrdersInbox } from '@/components/admin/OrdersInbox';

export function OrdersPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Pedidos</h1>
      <OrdersInbox />
    </div>
  );
}
