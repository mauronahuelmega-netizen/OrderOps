import Link from "next/link";
import { notFound } from "next/navigation";
import OrderProductsList from "@/components/admin/orders/order-products-list";
import StatusForm from "@/components/admin/orders/status-form";
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
  const { id } = await params;
  const order = await getAdminOrderById(id);

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
        <div>
          <p className="catalog-eyebrow">Pedido</p>
          <h1>{order.customer_name}</h1>
        </div>
        <Link className="admin-secondary-link" href="/admin/dashboard">
          Volver al dashboard
        </Link>
      </header>

      <div className="admin-detail-layout">
        <section className="admin-detail-panel">
          <div className="admin-detail-header">
            <h2>Informacion del cliente</h2>
            <span className={`admin-status-badge admin-status-badge--${order.status}`}>
              {formatStatus(order.status)}
            </span>
          </div>

          <dl className="admin-detail-grid">
            <div>
              <dt>Nombre</dt>
              <dd>{order.customer_name}</dd>
            </div>
            <div>
              <dt>Telefono</dt>
              <dd>{order.phone}</dd>
            </div>
            <div>
              <dt>Fecha de entrega</dt>
              <dd>{formatDate(order.delivery_date)}</dd>
            </div>
            <div>
              <dt>Metodo</dt>
              <dd>{formatDeliveryMethod(order.delivery_method)}</dd>
            </div>
            {order.delivery_method === "delivery" && order.address ? (
              <div className="admin-detail-grid-full">
                <dt>Direccion</dt>
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
        </section>

        <section className="admin-detail-panel">
          <div className="admin-detail-header">
            <h2>Productos</h2>
          </div>

          <OrderProductsList items={order.order_items} totalPrice={order.total_price} />
        </section>

        <aside className="admin-detail-panel">
          <div className="admin-detail-header">
            <h2>Acciones</h2>
          </div>

          <StatusForm orderId={order.id} initialStatus={order.status} />

          <a
            className="admin-whatsapp-link"
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
          >
            Abrir WhatsApp
          </a>
        </aside>
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

function formatStatus(status: "pending" | "in_progress" | "completed" | "cancelled") {
  if (status === "pending") {
    return "Pendiente";
  }

  if (status === "in_progress") {
    return "En proceso";
  }

  if (status === "completed") {
    return "Completado";
  }

  return "Cancelado";
}

function formatDeliveryMethod(method: "delivery" | "pickup") {
  return method === "delivery" ? "Delivery" : "Retiro";
}
