"use client";

import { memo, type ComponentProps, type KeyboardEvent } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import OrderCardQuickActions from "@/components/admin/orders/order-card-quick-actions";
import type { AdminOrderDashboardItem } from "@/lib/orders/admin";
import { buildOrderAssignmentOwnerLabel } from "@/lib/orders/assignment";
import {
  buildOrderRelativeTimeLabel,
  formatAdminDeliveryMethod,
  formatAdminOrderCurrency,
  formatAdminOrderDate
} from "@/lib/orders/presenter";
import type { OrderRiskAssessment } from "@/lib/orders/risk-detection";
import { buildOrderRiskBadgeLabel } from "@/lib/orders/risk-detection";
import styles from "./order-card.module.css";

type OrderCardQuickActionsProps = ComponentProps<typeof OrderCardQuickActions>;

export type OrderCardProps = {
  order: AdminOrderDashboardItem;
  currentUserId: string;
  onlineOperators: Array<{ userId: string; name: string }>;
  riskAssessment?: OrderRiskAssessment;
  isNewArrival: boolean;
  canUpdateOrders: boolean;
  canUseQuickActions?: boolean;
  isOrderStatusPending?: (orderId: string) => boolean;
  now: Date;
  showStatusBadge?: boolean;
  onOpen: (order: AdminOrderDashboardItem) => void;
  onCardKeyDown: (event: KeyboardEvent<HTMLElement>, orderId: string) => void;
  onOptimisticStatusChange?: OrderCardQuickActionsProps["onOptimisticStatusChange"];
  onOptimisticStatusRollback?: OrderCardQuickActionsProps["onOptimisticStatusRollback"];
  onOptimisticStatusSettled?: OrderCardQuickActionsProps["onOptimisticStatusSettled"];
};

function buildOrderDisplayRef(orderId: string) {
  return orderId.replace(/-/g, "").slice(-4).toUpperCase();
}

const ORDER_STATUS_ARIA_LABELS: Record<AdminOrderDashboardItem["status"], string> = {
  pending: "pendiente",
  preparing: "preparando",
  ready: "listo",
  completed: "completado",
  cancelled: "cancelado"
};

function serializeOnlineOperators(operators: OrderCardProps["onlineOperators"]) {
  return operators.map((operator) => operator.userId).join(",");
}

function areOrdersEqualForCard(
  previousOrder: AdminOrderDashboardItem,
  nextOrder: AdminOrderDashboardItem
) {
  return (
    previousOrder.id === nextOrder.id &&
    previousOrder.status === nextOrder.status &&
    previousOrder.assigned_to === nextOrder.assigned_to &&
    previousOrder.assigned_at === nextOrder.assigned_at &&
    previousOrder.operational_aging === nextOrder.operational_aging &&
    previousOrder.urgency_state === nextOrder.urgency_state &&
    previousOrder.total_price === nextOrder.total_price &&
    previousOrder.item_count === nextOrder.item_count &&
    previousOrder.has_notes === nextOrder.has_notes &&
    previousOrder.delivery_method === nextOrder.delivery_method &&
    previousOrder.customer_short_name === nextOrder.customer_short_name &&
    previousOrder.item_summary === nextOrder.item_summary &&
    previousOrder.notes_preview === nextOrder.notes_preview
  );
}

function areOrderCardPropsEqual(previousProps: OrderCardProps, nextProps: OrderCardProps) {
  return (
    areOrdersEqualForCard(previousProps.order, nextProps.order) &&
    previousProps.now.getTime() === nextProps.now.getTime() &&
    previousProps.isNewArrival === nextProps.isNewArrival &&
    previousProps.canUpdateOrders === nextProps.canUpdateOrders &&
    previousProps.canUseQuickActions === nextProps.canUseQuickActions &&
    previousProps.isOrderStatusPending === nextProps.isOrderStatusPending &&
    previousProps.currentUserId === nextProps.currentUserId &&
    serializeOnlineOperators(previousProps.onlineOperators) ===
      serializeOnlineOperators(nextProps.onlineOperators) &&
    previousProps.riskAssessment?.level === nextProps.riskAssessment?.level &&
    previousProps.riskAssessment?.score === nextProps.riskAssessment?.score &&
    previousProps.showStatusBadge === nextProps.showStatusBadge &&
    previousProps.onOpen === nextProps.onOpen &&
    previousProps.onCardKeyDown === nextProps.onCardKeyDown &&
    previousProps.onOptimisticStatusChange === nextProps.onOptimisticStatusChange &&
    previousProps.onOptimisticStatusRollback === nextProps.onOptimisticStatusRollback &&
    previousProps.onOptimisticStatusSettled === nextProps.onOptimisticStatusSettled
  );
}

function OrderCardComponent({
  order,
  currentUserId,
  onlineOperators,
  riskAssessment,
  isNewArrival,
  canUpdateOrders,
  canUseQuickActions = true,
  isOrderStatusPending,
  now,
  showStatusBadge = true,
  onOpen,
  onCardKeyDown,
  onOptimisticStatusChange,
  onOptimisticStatusRollback,
  onOptimisticStatusSettled
}: OrderCardProps) {
  const isActiveOrder =
    order.status === "pending" || order.status === "preparing" || order.status === "ready";
  const isResolvedOrder = order.status === "completed" || order.status === "cancelled";
  const ownershipTone = !order.assigned_to
    ? "unassigned"
    : order.assigned_to === currentUserId
      ? "self"
      : "assigned";
  const assignmentLabel = buildOrderAssignmentOwnerLabel({
    assignedTo: order.assigned_to,
    currentUserId,
    onlineOperators
  });

  const orderDisplayRef = buildOrderDisplayRef(order.id);
  const timeLabel =
    buildOrderRelativeTimeLabel({ created_at: order.created_at, now }) ??
    formatAdminOrderDate(order.delivery_date);
  const deliveryMethodLabel = formatAdminDeliveryMethod(order.delivery_method);
  const itemCountLabel = `${order.item_count} ${order.item_count === 1 ? "item" : "items"}`;
  const cardAriaLabel = `Pedido #${orderDisplayRef} de ${order.customer_short_name}, ${deliveryMethodLabel}, estado ${ORDER_STATUS_ARIA_LABELS[order.status]}.`;
  const isKanbanSurface = !showStatusBadge;
  const isStatusPending = isOrderStatusPending?.(order.id) ?? false;

  const riskChipClassName =
    riskAssessment && riskAssessment.level !== "stable"
      ? [
          styles.riskChip,
          riskAssessment.level === "warning"
            ? styles.riskChipWarning
            : styles.riskChipAttention
        ].join(" ")
      : null;

  const badgeClassName = [
    order.operational_aging === "aging" ? "ui-badge--aging" : null,
    order.operational_aging === "stale" ? "ui-badge--stale" : null
  ]
    .filter(Boolean)
    .join(" ");

  const assignmentClassName = [
    styles.metaLine,
    ownershipTone === "self" ? styles.metaLineSelf : null,
    ownershipTone === "unassigned" ? styles.metaLineUnassigned : null,
    ownershipTone === "assigned" ? styles.metaLineOther : null
  ]
    .filter(Boolean)
    .join(" ");

  const stopCardClick = (event: React.SyntheticEvent) => {
    event.stopPropagation();
  };

  const showAssignmentMeta = isActiveOrder || Boolean(order.assigned_to);

  return (
    <article
      className={styles.link}
      role="button"
      tabIndex={0}
      aria-label={cardAriaLabel}
      onClick={() => onOpen(order)}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) {
          return;
        }

        onCardKeyDown(event, order.id);
      }}
    >
      <div
        className={styles.card}
        data-order-card-active={isActiveOrder ? "" : undefined}
        data-order-card-resolved={isResolvedOrder ? "" : undefined}
        data-order-card-surface={isKanbanSurface ? "kanban" : undefined}
        data-status-pending={isStatusPending ? "true" : undefined}
      >
        <div className={styles.topRow}>
          <p className={styles.titleLine}>
            <span className={styles.orderRef}>#{orderDisplayRef}</span>
            <span className={styles.titleSeparator} aria-hidden="true">
              {" \u00b7 "}
            </span>
            <span className={styles.customerName}>{order.customer_short_name}</span>
          </p>
          <span className={styles.time} suppressHydrationWarning>
            {timeLabel}
          </span>
        </div>

        <div className={styles.signalRow}>
          <span className={styles.methodChip}>{deliveryMethodLabel}</span>
          {showStatusBadge ? (
            <Badge status={order.status} className={badgeClassName || undefined} />
          ) : null}
          {riskAssessment && riskAssessment.level !== "stable" ? (
            <span className={riskChipClassName ?? styles.riskChip}>
              {buildOrderRiskBadgeLabel(riskAssessment)}
            </span>
          ) : null}
          {isNewArrival ? <span className={styles.newChip}>Nuevo</span> : null}
        </div>

        <p className={styles.itemSummary}>
          <span className={styles.itemQty}>{itemCountLabel}</span>
          <span className={styles.itemSummaryText}>{order.item_summary}</span>
        </p>

        {showAssignmentMeta ? <p className={assignmentClassName}>{assignmentLabel}</p> : null}

        <div className={styles.actionRow}>
          <span className={styles.total}>{formatAdminOrderCurrency(order.total_price)}</span>
          <div className={styles.actionRowControls}>
            <OrderCardQuickActions
              variant="compact"
              order={order}
              canUpdateOrders={canUpdateOrders}
              canUseQuickActions={canUseQuickActions}
              isOrderStatusPending={isOrderStatusPending}
              onOptimisticStatusChange={onOptimisticStatusChange}
              onOptimisticStatusRollback={onOptimisticStatusRollback}
              onOptimisticStatusSettled={onOptimisticStatusSettled}
            />
            <Button
              type="button"
              variant="secondary"
              className={styles.viewButton}
              aria-label={`Ver pedido de ${order.customer_short_name}`}
              onClick={(event) => {
                stopCardClick(event);
                onOpen(order);
              }}
            >
              Ver pedido
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

const OrderCard = memo(OrderCardComponent, areOrderCardPropsEqual);

export default OrderCard;
