import Card from "@/components/ui/Card";
import { formatAdminOrderCurrency } from "@/lib/orders/presenter";
import type { AdminOrderWorkspaceData } from "@/lib/orders/workspace";
import workspaceStyles from "./order-workspace.module.css";
import detailStyles from "./order-detail-surfaces.module.css";

type OrderTotalSectionProps = {
  order: AdminOrderWorkspaceData;
};

export default function OrderTotalSection({ order }: OrderTotalSectionProps) {
  return (
    <Card className={workspaceStyles["admin-detail-panel"]}>
      <div className={workspaceStyles["admin-detail-header"]}>
        <h2>Total</h2>
      </div>

      <div className={detailStyles.detailTotalCard}>
        <span>Total del pedido</span>
        <strong>{formatAdminOrderCurrency(order.total_price)}</strong>
      </div>
    </Card>
  );
}
