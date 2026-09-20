import PDFDocument from 'pdfkit';
import { supabaseAdmin } from '@/config/supabaseClient.js';

interface OrderItemRow {
  product_name_snapshot: string;
  size_snapshot: string;
  color_snapshot: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface OrderRow {
  id: string;
  order_number: string;
  shipping_full_name: string;
  shipping_address: string;
  shipping_district: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  currency: string;
}

/**
 * Genera el PDF de la factura/comprobante al confirmar el pago de un
 * pedido, lo sube a Supabase Storage y registra la fila en `invoices`.
 * Se dispara desde el controller tras `confirm_order_payment`.
 */
export async function generateInvoiceForOrder(orderId: string): Promise<string> {
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('id, order_number, shipping_full_name, shipping_address, shipping_district, subtotal, shipping_cost, total, currency')
    .eq('id', orderId)
    .single<OrderRow>();

  if (orderError || !order) throw new Error('Pedido no encontrado para facturar');

  const { data: items } = await supabaseAdmin
    .from('order_items')
    .select('product_name_snapshot, size_snapshot, color_snapshot, quantity, unit_price, subtotal')
    .eq('order_id', orderId)
    .returns<OrderItemRow[]>();

  const invoiceNumber = `F001-${order.order_number}`;
  const pdfBuffer = await buildPdfBuffer(order, items ?? [], invoiceNumber);

  const storagePath = `${order.order_number}/${invoiceNumber}.pdf`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from('invoices')
    .upload(storagePath, pdfBuffer, { contentType: 'application/pdf', upsert: true });

  if (uploadError) throw uploadError;

  const { data: publicUrl } = supabaseAdmin.storage.from('invoices').getPublicUrl(storagePath);

  await supabaseAdmin.from('invoices').insert({
    order_id: order.id,
    invoice_number: invoiceNumber,
    pdf_url: publicUrl.publicUrl,
    total: order.total,
  });

  return publicUrl.publicUrl;
}

function buildPdfBuffer(order: OrderRow, items: OrderItemRow[], invoiceNumber: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).text('KIKIDS - Comprobante de Venta', { align: 'center' });
    doc.moveDown();
    doc.fontSize(11).text(`Comprobante: ${invoiceNumber}`);
    doc.text(`Pedido: ${order.order_number}`);
    doc.text(`Cliente: ${order.shipping_full_name}`);
    doc.text(`Dirección: ${order.shipping_address}, ${order.shipping_district}`);
    doc.moveDown();

    items.forEach((item) => {
      doc.text(
        `${item.product_name_snapshot} (Talla ${item.size_snapshot}, ${item.color_snapshot}) x${item.quantity} — S/ ${item.subtotal.toFixed(2)}`
      );
    });

    doc.moveDown();
    doc.text(`Subtotal: S/ ${order.subtotal.toFixed(2)}`);
    doc.text(`Envío: S/ ${order.shipping_cost.toFixed(2)}`);
    doc.fontSize(13).text(`Total: S/ ${order.total.toFixed(2)} ${order.currency}`, { underline: true });

    doc.end();
  });
}
