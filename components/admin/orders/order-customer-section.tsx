import Card from "@/components/ui/Card";
import type { AdminOrderWorkspaceData } from "@/lib/orders/workspace";
import workspaceStyles from "./order-workspace.module.css";
import detailStyles from "./order-detail-surfaces.module.css";

type OrderCustomerSectionProps = {
  order: AdminOrderWorkspaceData;
  compact?: boolean;
  customerSignals?: string[];
};

export default function OrderCustomerSection({
  order,
  compact = false,
  customerSignals = []
}: OrderCustomerSectionProps) {
  if (compact) {
    return (
      <Card
        className={`${workspaceStyles["admin-detail-panel"]} ${workspaceStyles["admin-detail-panel--compact"]}`}
      >
        <div className={workspaceStyles["admin-detail-header"]}>
          <h2>Cliente</h2>
        </div>

        <div className={detailStyles.detailStack}>
          <strong>{order.customer_name}</strong>
          {order.phone ? <p>{order.phone}</p> : null}
          {customerSignals.length > 0 ? (
            <p className={detailStyles.detailMuted}>{customerSignals.join(" · ")}</p>
          ) : null}
        </div>
      </Card>
    );
  }

  return (
    <Card className={workspaceStyles["admin-detail-panel"]}>
      <div className={workspaceStyles["admin-detail-header"]}>
        <h2>Cliente</h2>
      </div>

      <dl className={workspaceStyles["admin-detail-grid"]}>
        <div>
          <dt>Nombre</dt>
          <dd>{order.customer_name}</dd>
        </div>
        {order.phone ? (
          <div>
            <dt>Telefono</dt>
            <dd>{order.phone}</dd>
          </div>
        ) : null}
        {customerSignals.length > 0 ? (
          <div className={workspaceStyles["admin-detail-grid-full"]}>
            <dt>Contexto</dt>
            <dd className={detailStyles.detailMuted}>{customerSignals.join(" · ")}</dd>
          </div>
        ) : null}
      </dl>
    </Card>
  );
}
