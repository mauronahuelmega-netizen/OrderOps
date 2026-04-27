import { requireAdminContext } from "@/lib/admin/context";
import Link from "next/link";
import { getAdminOrders } from "@/lib/orders/admin";

export default async function AdminDashboardPage() {
  const adminContext = await requireAdminContext();
  const orders = await getAdminOrders();
  const catalogHref = adminContext.businessSlug ? `/b/${adminContext.businessSlug}` : null;

  return (
    <section className="admin-orders-section">
      <header className="admin-section-header">
        <div>
          <p className="catalog-eyebrow">Dashboard</p>
          <h1>Pedidos</h1>
        </div>
      </header>

      {orders.length > 0 ? (
        <div className="admin-orders-list">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/admin/orders/${order.id}`}
              className={`admin-order-card${
                order.status === "pending" ? " admin-order-card--pending" : ""
              }`}
            >
              <div className="admin-order-row">
                <h2>{order.customer_name}</h2>
                <span className={`admin-status-badge admin-status-badge--${order.status}`}>
                  {formatStatus(order.status)}
                </span>
              </div>

              <div className="admin-order-meta">
                <span>{formatDate(order.delivery_date)}</span>
                <span>{formatDeliveryMethod(order.delivery_method)}</span>
                <strong>{formatCurrency(order.total_price)}</strong>
              </div>

              <p className="admin-order-summary">
                {buildSummary(order)}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="admin-empty-state">
          <h2>No hay pedidos todavia</h2>
          <p>
            Cuando tus clientes hagan pedidos desde el catalogo, van a aparecer aca
            ordenados por fecha de entrega.
          </p>
          <div className="admin-empty-actions">
            {catalogHref ? (
              <Link href={catalogHref} className="admin-secondary-link">
                Ver catalogo
              </Link>
            ) : null}
            <Link href="/admin/products" className="admin-secondary-link">
              Gestionar productos
            </Link>
          </div>
        </div>
      )}
    </section>
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

function buildSummary(order: {
  delivery_method: "delivery" | "pickup";
  notes: string | null;
}) {
  if (order.notes && order.notes.trim()) {
    return order.notes.trim();
  }

  return order.delivery_method === "delivery"
    ? "Pedido con entrega a domicilio."
    : "Pedido para retiro en el local.";
}
