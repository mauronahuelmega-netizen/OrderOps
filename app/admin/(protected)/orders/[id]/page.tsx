import Link from "next/link";
import { notFound } from "next/navigation";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import OrderProductsList from "@/components/admin/orders/order-products-list";
import StatusForm from "@/components/admin/orders/status-form";
import { requireAdminContext } from "@/lib/admin/context";
import { getAdminOrderById } from "@/lib/orders/admin";
import { buildAdminOrderWhatsappUrl } from "@/lib/whatsapp/admin";

type AdminOrderDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminOrderDetailPage({
  params
}: AdminOrderDetailPageProps) {
  const adminContext = await requireAdminContext();
  const { id } = await params;
  const order = await getAdminOrderById(id, adminContext.businessId);

  if (!order) {
    notFound();
  }

  const whatsappUrl = buildAdminOrderWhatsappUrl({
    customerPhone: order.phone,
    orderId: order.id
  });

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div className="admin-order-page-heading">
          <p className="catalog-eyebrow">Pedido</p>
          <div className="admin-order-title-row">
            <h1>{order.customer_name}</h1>
            <Badge status={order.status} />
          </div>
        </div>
        <Link className="admin-secondary-link" href="/admin/dashboard">
          Volver al dashboard
        </Link>
      </header>

      <div className="admin-detail-layout">
        <Card className="admin-detail-panel">
          <div className="admin-detail-header">
            <h2>Cliente</h2>
          </div>

          <dl className="admin-detail-grid">
            <div>
              <dt>Nombre</dt>
              <dd>{order.customer_name}</dd>
            </div>
            <div>
              <dt>Teléfono</dt>
              <dd>{order.phone}</dd>
            </div>
          </dl>
        </Card>

        <Card className="admin-detail-panel">
          <div className="admin-detail-header">
            <h2>Entrega</h2>
          </div>

          <dl className="admin-detail-grid">
            <div>
              <dt>Fecha de entrega</dt>
              <dd>{formatDate(order.delivery_date)}</dd>
            </div>
            <div>
              <dt>Método</dt>
              <dd>{formatDeliveryMethod(order.delivery_method)}</dd>
            </div>
            {order.delivery_method === "delivery" && order.address ? (
              <div className="admin-detail-grid-full">
                <dt>Dirección</dt>
                <dd>{order.address}</dd>
              </div>
            ) : null}
            {order.notes ? (
              <div className="admin-detail-grid-full">
                <dt>Notas</dt>
                <dd>{order.notes}</dd>
              </div>
            ) : null}
          </dl>
        </Card>

        <Card className="admin-detail-panel admin-detail-panel--products">
          <div className="admin-detail-header">
            <h2>Productos</h2>
          </div>

          <OrderProductsList items={order.order_items} totalPrice={order.total_price} />
        </Card>

        <Card className="admin-detail-panel">
          <div className="admin-detail-header">
            <h2>Total</h2>
          </div>

          <div className="admin-detail-total-card">
            <span>Total del pedido</span>
            <strong>{formatCurrency(order.total_price)}</strong>
          </div>
        </Card>

        <Card className="admin-detail-panel">
          <div className="admin-detail-header">
            <h2>Acciones</h2>
          </div>

          <StatusForm orderId={order.id} initialStatus={order.status} />

          <Button
            className="admin-whatsapp-link"
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            variant="accent"
          >
            Abrir WhatsApp
          </Button>
        </Card>
      </div>
    </main>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2
  }).format(value);
}

function formatDeliveryMethod(method: "delivery" | "pickup") {
  return method === "delivery" ? "Delivery" : "Retiro";
}
