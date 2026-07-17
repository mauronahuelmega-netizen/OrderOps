import { memo } from "react";
import Card from "@/components/ui/Card";
import OrderProductsList from "@/components/admin/orders/order-products-list";
import type { AdminOrderWorkspaceData } from "@/lib/orders/workspace";
import workspaceStyles from "./order-workspace.module.css";

type OrderItemsSectionProps = {
  order: AdminOrderWorkspaceData;
  compact?: boolean;
  showTotal?: boolean;
};

function OrderItemsSectionComponent({
  order,
  compact = false,
  showTotal
}: OrderItemsSectionProps) {
  const panelClassName = [
    workspaceStyles["admin-detail-panel"],
    workspaceStyles["admin-detail-panel--products"],
    compact ? workspaceStyles["admin-detail-panel--compact"] : null
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Card className={panelClassName}>
      <div className={workspaceStyles["admin-detail-header"]}>
        <h2>Productos</h2>
      </div>

      <OrderProductsList
        items={order.order_items ?? []}
        totalPrice={order.total_price}
        compact={compact}
        dense={compact}
        showTotal={showTotal ?? !compact}
      />
    </Card>
  );
}

function areOrderItemsSectionPropsEqual(
  previous: OrderItemsSectionProps,
  next: OrderItemsSectionProps
) {
  if (previous.compact !== next.compact || previous.order.id !== next.order.id) {
    return false;
  }

  if (previous.order.total_price !== next.order.total_price) {
    return false;
  }

  const previousItems = previous.order.order_items ?? [];
  const nextItems = next.order.order_items ?? [];

  if (previousItems === nextItems) {
    return true;
  }

  if (previousItems.length !== nextItems.length) {
    return false;
  }

  for (let index = 0; index < previousItems.length; index += 1) {
    const previousItem = previousItems[index];
    const nextItem = nextItems[index];

    if (
      previousItem.id !== nextItem.id ||
      previousItem.quantity !== nextItem.quantity ||
      previousItem.unit_price !== nextItem.unit_price ||
      previousItem.product_name !== nextItem.product_name ||
      previousItem.item_kind !== nextItem.item_kind ||
      previousItem.parent_order_item_id !== nextItem.parent_order_item_id ||
      previousItem.customization_snapshot !== nextItem.customization_snapshot
    ) {
      return false;
    }
  }

  return true;
}

const OrderItemsSection = memo(OrderItemsSectionComponent, areOrderItemsSectionPropsEqual);

export default OrderItemsSection;
