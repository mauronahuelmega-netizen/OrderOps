import Card from "@/components/ui/Card";
import { formatAdminDeliveryMethod, formatAdminOrderDate } from "@/lib/orders/presenter";
import type { AdminOrderWorkspaceData } from "@/lib/orders/workspace";
import workspaceStyles from "./order-workspace.module.css";
import detailStyles from "./order-detail-surfaces.module.css";

type OrderDeliverySectionProps = {
  order: AdminOrderWorkspaceData;
  compact?: boolean;
  showNotes?: boolean;
};

export default function OrderDeliverySection({
  order,
  compact = false,
  showNotes = true
}: OrderDeliverySectionProps) {
  if (compact) {
    if (order.delivery_method === "delivery" && order.address) {
      return (
        <Card
          className={`${workspaceStyles["admin-detail-panel"]} ${workspaceStyles["admin-detail-panel--compact"]}`}
        >
          <div className={workspaceStyles["admin-detail-header"]}>
            <h2>Entrega</h2>
          </div>

          <div className={detailStyles.detailStack}>
            <strong>{formatAdminOrderDate(order.delivery_date)}</strong>
            <p>{order.address}</p>
            {showNotes && order.notes ? (
              <p className={detailStyles.detailMuted}>{order.notes}</p>
            ) : null}
          </div>
        </Card>
      );
    }

    if (showNotes && order.notes) {
      return (
        <Card
          className={`${workspaceStyles["admin-detail-panel"]} ${workspaceStyles["admin-detail-panel--compact"]}`}
        >
          <div className={workspaceStyles["admin-detail-header"]}>
            <h2>Notas</h2>
          </div>

          <div className={detailStyles.detailStack}>
            <p>{order.notes}</p>
          </div>
        </Card>
      );
    }

    return null;
  }

  return (
    <Card className={workspaceStyles["admin-detail-panel"]}>
      <div className={workspaceStyles["admin-detail-header"]}>
        <h2>Entrega</h2>
      </div>

      <dl className={workspaceStyles["admin-detail-grid"]}>
        <div>
          <dt>Fecha de entrega</dt>
          <dd>{formatAdminOrderDate(order.delivery_date)}</dd>
        </div>
        <div>
          <dt>Metodo</dt>
          <dd>{formatAdminDeliveryMethod(order.delivery_method)}</dd>
        </div>
        {order.delivery_method === "delivery" && order.address ? (
          <div className={workspaceStyles["admin-detail-grid-full"]}>
            <dt>Direccion</dt>
            <dd>{order.address}</dd>
          </div>
        ) : null}
        {showNotes && order.notes ? (
          <div className={workspaceStyles["admin-detail-grid-full"]}>
            <dt>Notas</dt>
            <dd>{order.notes}</dd>
          </div>
        ) : null}
      </dl>
    </Card>
  );
}
