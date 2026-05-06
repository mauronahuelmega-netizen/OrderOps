import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { requireAdminContext } from "@/lib/admin/context";
import { getAdminOrders } from "@/lib/orders/admin";

export default async function AdminDashboardPage() {
  const adminContext = await requireAdminContext();
  const orders = await getAdminOrders(adminContext.businessId);
  const catalogHref = adminContext.businessSlug
    ? `/b/${adminContext.businessSlug}/catalogo`
    : null;

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
              className="admin-order-link"
            >
              <Card
                className={`admin-order-card${
                  order.status === "pending" ? " admin-order-card--pending" : ""
                }`}
              >
                <div className="admin-order-row">
                  <h2>{order.customer_name}</h2>
                  <Badge status={order.status} />
                </div>

                <p className="admin-order-summary">
                  {buildSummary(order)}
                </p>

                <div className="admin-order-meta">
                  <div className="admin-order-meta-copy">
                    <span>{formatDate(order.delivery_date)}</span>
                    <span>{formatDeliveryMethod(order.delivery_method)}</span>
                  </div>
                  <div className="admin-order-meta-actions">
                    <strong>{formatCurrency(order.total_price)}</strong>
                    <span className="admin-order-detail-hint">Ver detalle</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="admin-empty-state">
          <h2>No hay pedidos todavía</h2>
          <p>
            Cuando tus clientes hagan pedidos desde el catálogo, van a aparecer acá
            ordenados por fecha de entrega.
          </p>
          <div className="admin-empty-actions">
            {catalogHref ? (
              <Link href={catalogHref} className="admin-secondary-link">
                Ver catálogo
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
