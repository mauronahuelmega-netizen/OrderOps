"use client";

import { useState, useTransition } from "react";
import { useAdminToast } from "@/components/admin/admin-toast-provider";
import { updateOrderStatusAction } from "@/app/admin/(protected)/orders/[id]/actions";
import type { AdminOrderDashboardItem } from "@/lib/orders/admin";
import { buildOrderStatusSuccessMessage } from "@/lib/orders/presenter";
import { traceKanbanTransition } from "@/lib/orders/kanban-transition-trace";
import styles from "./order-card-quick-actions.module.css";

type OrderCardQuickActionsProps = {
  order: AdminOrderDashboardItem;
  canUpdateOrders?: boolean;
  canUseQuickActions?: boolean;
  isOrderStatusPending?: (orderId: string) => boolean;
  variant?: "default" | "compact";
  onOptimisticStatusChange?: (
    orderId: string,
    nextStatus: QuickStatus,
    previousStatus: AdminOrderDashboardItem["status"]
  ) => void;
  onOptimisticStatusRollback?: (
    orderId: string,
    previousStatus: AdminOrderDashboardItem["status"]
  ) => void;
  onOptimisticStatusSettled?: (
    orderId: string,
    resolution?: {
      succeeded: boolean;
      finalStatus?: AdminOrderDashboardItem["status"];
    }
  ) => void | Promise<void>;
};

type QuickStatus = "preparing" | "ready" | "completed" | "cancelled";

const STATUS_LABELS: Record<QuickStatus, string> = {
  preparing: "Preparar",
  ready: "Marcar listo",
  completed: "Completar",
  cancelled: "Cancelar"
};

function resolvePrimaryStatusAction(
  order: AdminOrderDashboardItem,
  canUpdateOrders: boolean,
  canUseQuickActions: boolean,
  variant: "default" | "compact"
): QuickStatus | null {
  if (!canUpdateOrders || !canUseQuickActions) {
    return null;
  }

  if (variant === "compact") {
    if (order.status === "pending") {
      return "preparing";
    }

    if (order.status === "preparing") {
      return "ready";
    }

    if (order.status === "ready") {
      return "completed";
    }

    return null;
  }

  if (order.status === "pending") {
    return "preparing";
  }

  if (order.status === "preparing") {
    return "ready";
  }

  if (order.status === "ready") {
    return "completed";
  }

  return null;
}

function resolveSecondaryStatusActions(
  order: AdminOrderDashboardItem,
  canUpdateOrders: boolean,
  canUseQuickActions: boolean,
  variant: "default" | "compact"
): QuickStatus[] {
  if (!canUpdateOrders || !canUseQuickActions || variant === "compact") {
    return [];
  }

  if (order.status === "pending") {
    return ["cancelled"];
  }

  if (order.status === "preparing") {
    return ["completed"];
  }

  return [];
}

export default function OrderCardQuickActions({
  order,
  canUpdateOrders = true,
  canUseQuickActions = true,
  isOrderStatusPending,
  variant = "compact",
  onOptimisticStatusChange,
  onOptimisticStatusRollback,
  onOptimisticStatusSettled
}: OrderCardQuickActionsProps) {
  const { pushToast } = useAdminToast();
  const [isPending, startTransition] = useTransition();
  const [pendingStatus, setPendingStatus] = useState<QuickStatus | null>(null);

  const primaryStatusAction = resolvePrimaryStatusAction(
    order,
    canUpdateOrders,
    canUseQuickActions,
    variant
  );
  const secondaryStatusActions = resolveSecondaryStatusActions(
    order,
    canUpdateOrders,
    canUseQuickActions,
    variant
  );
  const isStatusPending = isOrderStatusPending?.(order.id) ?? false;

  const stopCardClick = (event: React.SyntheticEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleStatusAction = (nextStatus: QuickStatus) => {
    if (!canUseQuickActions) {
      return;
    }

    if (isOrderStatusPending?.(order.id) || isPending) {
      traceKanbanTransition({
        source: "quick-action.blocked",
        orderId: order.id,
        fromStatus: order.status,
        toStatus: nextStatus,
        reason: "pending-status-mutation"
      });
      return;
    }

    const previousStatus = order.status;

    onOptimisticStatusChange?.(order.id, nextStatus, previousStatus);
    setPendingStatus(nextStatus);

    startTransition(async () => {
      let resolution: {
        succeeded: boolean;
        finalStatus?: AdminOrderDashboardItem["status"];
      } = {
        succeeded: false
      };

      try {
        const formData = new FormData();
        formData.set("order_id", order.id);
        formData.set("status", nextStatus);

        const result = await updateOrderStatusAction({}, formData);

        if (result?.error) {
          onOptimisticStatusRollback?.(order.id, previousStatus);
          pushToast({
            tone: "error",
            message: result.error
          });
          return;
        }

        resolution = {
          succeeded: result?.changed !== false,
          finalStatus: result.order?.status ?? nextStatus
        };
        const finalStatus = resolution.finalStatus ?? nextStatus;

        if (result?.changed === false) {
          pushToast({
            tone: "info",
            message: result.message ?? "No hubo cambios para guardar"
          });
        } else {
          pushToast({
            tone: "success",
            message: buildOrderStatusSuccessMessage(finalStatus)
          });
        }
      } catch {
        onOptimisticStatusRollback?.(order.id, previousStatus);
        pushToast({
          tone: "error",
          message: "No pudimos actualizar el pedido"
        });
      } finally {
        await onOptimisticStatusSettled?.(order.id, resolution);
        setPendingStatus(null);
      }
    });
  };

  if (!primaryStatusAction && secondaryStatusActions.length === 0) {
    return null;
  }

  const isStatusActionLocked = isStatusPending || isPending;

  const rootClassName = [
    styles["admin-order-quick-actions"],
    variant === "compact" ? styles["admin-order-quick-actions--compact"] : null,
    !primaryStatusAction ? styles["admin-order-quick-actions--no-primary"] : null
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={rootClassName}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {primaryStatusAction ? (
        <div className={styles["admin-order-quick-actions__primary"]}>
          <button
            type="button"
            className={`${styles["admin-order-quick-action"]} ${styles["admin-order-quick-action--status"]} ${styles["admin-order-quick-action--primary"]}`}
            onClick={(event) => {
              stopCardClick(event);
              handleStatusAction(primaryStatusAction);
            }}
            disabled={isStatusActionLocked}
            aria-busy={isStatusActionLocked}
            aria-disabled={isStatusActionLocked}
            aria-label={
              isStatusActionLocked
                ? `Actualizando pedido de ${order.customer_short_name}`
                : `${STATUS_LABELS[primaryStatusAction]} pedido de ${order.customer_short_name}`
            }
            data-syncing={isStatusActionLocked ? "true" : undefined}
            data-status-pending={isStatusPending ? "true" : undefined}
          >
            {isStatusActionLocked ? "Actualizando..." : STATUS_LABELS[primaryStatusAction]}
          </button>
        </div>
      ) : null}

      {secondaryStatusActions.length > 0 ? (
        <div className={styles["admin-order-quick-actions__secondary"]}>
          {secondaryStatusActions.map((status) => (
            <button
              key={status}
              type="button"
              className={`${styles["admin-order-quick-action"]} ${styles["admin-order-quick-action--status"]} ${styles["admin-order-quick-action--secondary"]}`}
              onClick={(event) => {
                stopCardClick(event);
                handleStatusAction(status);
              }}
              disabled={isStatusActionLocked}
              aria-busy={isStatusActionLocked && pendingStatus === status}
              aria-disabled={isStatusActionLocked}
              aria-label={`${STATUS_LABELS[status]} pedido de ${order.customer_short_name}`}
              data-syncing={isStatusActionLocked && pendingStatus === status ? "true" : undefined}
            >
              {STATUS_LABELS[status]}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
