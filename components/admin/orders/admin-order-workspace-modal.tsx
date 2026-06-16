"use client";

import { useCallback, useMemo } from "react";
import AdminOrderWorkspaceErrorBoundary from "@/components/admin/orders/admin-order-workspace-error-boundary";
import AdminOrderModalShell from "@/components/admin/orders/admin-order-modal-shell";
import {
  OrderModalHeaderLeading,
  OrderModalHeaderMeta
} from "@/components/admin/orders/order-modal-header";
import { OrderModalErrorState, OrderModalLoadingState } from "@/components/admin/orders/order-modal-states";
import OrderModalWorkspaceToolbar from "@/components/admin/orders/order-modal-workspace-toolbar";
import { useOrderWorkspaceHydration } from "@/components/admin/orders/use-order-workspace-hydration";
import styles from "./admin-order-modal.module.css";
import OrderExternalActions from "@/components/admin/orders/order-external-actions";
import OrderAssignmentControls from "@/components/admin/orders/order-assignment-controls";
import StatusForm from "@/components/admin/orders/status-form";
import workspaceStyles from "./order-workspace.module.css";
import OrderHumanTimeline from "@/components/admin/orders/order-human-timeline";
import OrderItemsSection from "@/components/admin/orders/order-items-section";
import OrderNotesSection from "@/components/admin/orders/order-notes-section";
import OrderRecommendedActionPanel from "@/components/admin/orders/order-recommended-action-panel";
import OrderRiskPanel from "@/components/admin/orders/order-risk-panel";
import OrderWorkspaceOverview from "@/components/admin/orders/order-workspace-overview";
import type { AdminOrderAssignment } from "@/lib/orders/assignment";
import type { AdminOrderTimelineEvent } from "@/lib/orders/events.shared";
import type { AdminOperationalMetrics } from "@/lib/orders/metrics";
import {
  DASHBOARD_REVIEW_MODE_BLOCKED_REASON,
  type DashboardActionPolicy
} from "@/lib/orders/analytics";
import { type AdminOrderDashboardItem } from "@/lib/orders/admin";
import { buildOrderOperationalSummary, buildOrderRelativeTimeLabel } from "@/lib/orders/presenter";
import {
  buildAdminOrderInitialDetail,
  patchAdminOrderWorkspaceStatus,
  type AdminOrderWorkspaceData
} from "@/lib/orders/workspace";

type AdminOrderWorkspaceModalProps = {
  order: AdminOrderDashboardItem | null;
  isOpen: boolean;
  activeFilter: string;
  onClose: () => void;
  dashboardHref: string;
  canUpdateOrders?: boolean;
  orderActionPolicy?: DashboardActionPolicy;
  currentUserId: string;
  operationalMetrics?: AdminOperationalMetrics;
  assignmentLabel: string | null;
  orderPresenceLabel?: string | null;
  orderPresenceNames?: string[];
  onOptimisticStatusChange?: (
    orderId: string,
    nextStatus: AdminOrderDashboardItem["status"],
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
      event?: AdminOrderTimelineEvent | null;
    }
  ) => void | Promise<void>;
  onOptimisticAssignmentChange?: (
    orderId: string,
    nextAssignment: AdminOrderAssignment,
    previousAssignment: AdminOrderAssignment
  ) => void;
  onOptimisticAssignmentRollback?: (
    orderId: string,
    previousAssignment: AdminOrderAssignment
  ) => void;
  onOptimisticAssignmentSettled?: (
    orderId: string,
    resolution?: {
      succeeded: boolean;
      finalAssignment?: AdminOrderAssignment;
      event?: AdminOrderTimelineEvent | null;
    }
  ) => void | Promise<void>;
};

function buildOrderDisplayRef(orderId: string) {
  return orderId.replace(/-/g, "").slice(-4).toUpperCase();
}

export default function AdminOrderWorkspaceModal({
  order,
  isOpen,
  activeFilter,
  onClose,
  dashboardHref,
  canUpdateOrders = true,
  orderActionPolicy,
  currentUserId,
  operationalMetrics,
  assignmentLabel,
  orderPresenceLabel,
  orderPresenceNames = [],
  onOptimisticStatusChange,
  onOptimisticStatusRollback,
  onOptimisticStatusSettled,
  onOptimisticAssignmentChange,
  onOptimisticAssignmentRollback,
  onOptimisticAssignmentSettled
}: AdminOrderWorkspaceModalProps) {
  const {
    displayOrder,
    detail,
    initialDetail,
    loading,
    error,
    refresh,
    appendTimelineEvent,
    updateWorkspaceDetail
  } = useOrderWorkspaceHydration({ order, isOpen });

  const modalTitle = useMemo(() => {
    if (displayOrder) {
      const operationalSummary = buildOrderOperationalSummary(
        displayOrder.customer_name,
        displayOrder.notes,
        (displayOrder.order_items ?? []).map((item) => ({
          product_name: item.product_name,
          quantity: item.quantity
        }))
      );

      return `#${buildOrderDisplayRef(displayOrder.id)} - ${operationalSummary.customerShortName}`;
    }

    if (order) {
      return `#${buildOrderDisplayRef(order.id)} - ${order.customer_short_name}`;
    }

    return "Pedido";
  }, [displayOrder, order]);

  const workstationHeaderLeading = useMemo(() => {
    if (!displayOrder) {
      return null;
    }

    const operationalSummary = buildOrderOperationalSummary(
      displayOrder.customer_name,
      displayOrder.notes,
      (displayOrder.order_items ?? []).map((item) => ({
        product_name: item.product_name,
        quantity: item.quantity
      }))
    );

    return (
      <OrderModalHeaderLeading
        orderRef={buildOrderDisplayRef(displayOrder.id)}
        customerLabel={operationalSummary.customerShortName}
        status={displayOrder.status}
      />
    );
  }, [displayOrder]);

  const handleStatusSuccess = useCallback(() => {
    if (!order) {
      return;
    }

    void refresh({ force: true });
  }, [order, refresh]);

  const handleOptimisticStatusChange = useCallback(
    (
      nextStatus: AdminOrderWorkspaceData["status"],
      previousStatus: AdminOrderWorkspaceData["status"]
    ) => {
      if (!order) {
        return;
      }

      const nextDetail = patchAdminOrderWorkspaceStatus(
        displayOrder ??
          initialDetail ??
          detail ??
          {
            ...buildAdminOrderInitialDetail(order),
            status: nextStatus
          },
        nextStatus
      );

      updateWorkspaceDetail(nextDetail);
      onOptimisticStatusChange?.(order.id, nextStatus, previousStatus);
    },
    [detail, displayOrder, initialDetail, onOptimisticStatusChange, order, updateWorkspaceDetail]
  );

  const handleOptimisticStatusRollback = useCallback(
    (previousStatus: AdminOrderWorkspaceData["status"]) => {
      if (!order) {
        return;
      }

      const rollbackSource =
        displayOrder ?? initialDetail ?? detail ?? buildAdminOrderInitialDetail(order);
      const rollbackDetail = patchAdminOrderWorkspaceStatus(rollbackSource, previousStatus);

      updateWorkspaceDetail(rollbackDetail);
      onOptimisticStatusRollback?.(order.id, previousStatus);
    },
    [detail, displayOrder, initialDetail, onOptimisticStatusRollback, order, updateWorkspaceDetail]
  );

  const handleOptimisticStatusSettled = useCallback(
    (resolution?: {
      succeeded: boolean;
      finalStatus?: AdminOrderWorkspaceData["status"];
      event?: AdminOrderTimelineEvent | null;
    }) => {
      if (!order) {
        return;
      }

      if (resolution?.event) {
        appendTimelineEvent(resolution.event);
      }

      return onOptimisticStatusSettled?.(order.id, resolution);
    },
    [appendTimelineEvent, onOptimisticStatusSettled, order]
  );

  const handleOptimisticAssignmentChange = useCallback(
    (nextAssignment: AdminOrderAssignment, previousAssignment: AdminOrderAssignment) => {
      if (!order) {
        return;
      }

      const nextDetail = {
        ...(displayOrder ?? initialDetail ?? detail ?? buildAdminOrderInitialDetail(order)),
        assigned_to: nextAssignment.assigned_to,
        assigned_at: nextAssignment.assigned_at
      };

      updateWorkspaceDetail(nextDetail);
      onOptimisticAssignmentChange?.(order.id, nextAssignment, previousAssignment);
    },
    [detail, displayOrder, initialDetail, onOptimisticAssignmentChange, order, updateWorkspaceDetail]
  );

  const handleOptimisticAssignmentRollback = useCallback(
    (previousAssignment: AdminOrderAssignment) => {
      if (!order) {
        return;
      }

      const rollbackDetail = {
        ...(displayOrder ?? initialDetail ?? detail ?? buildAdminOrderInitialDetail(order)),
        assigned_to: previousAssignment.assigned_to,
        assigned_at: previousAssignment.assigned_at
      };

      updateWorkspaceDetail(rollbackDetail);
      onOptimisticAssignmentRollback?.(order.id, previousAssignment);
    },
    [detail, displayOrder, initialDetail, onOptimisticAssignmentRollback, order, updateWorkspaceDetail]
  );

  const handleOptimisticAssignmentSettled = useCallback(
    (resolution?: {
      succeeded: boolean;
      finalAssignment?: AdminOrderAssignment;
      event?: AdminOrderTimelineEvent | null;
    }) => {
      if (!order) {
        return;
      }

      if (resolution?.event) {
        appendTimelineEvent(resolution.event);
      }

      return onOptimisticAssignmentSettled?.(order.id, resolution);
    },
    [appendTimelineEvent, onOptimisticAssignmentSettled, order]
  );

  if (!order) {
    return null;
  }

  const canChangeStatus = canUpdateOrders && (orderActionPolicy?.canChangeStatus ?? true);
  const canAssignOrders = canUpdateOrders && (orderActionPolicy?.canAssignOrders ?? true);
  const statusReadOnlyReason = !canChangeStatus
    ? orderActionPolicy?.isReviewingLastClosedSession
      ? "Sesi\u00f3n cerrada: estado bloqueado para revisi\u00f3n."
      : DASHBOARD_REVIEW_MODE_BLOCKED_REASON
    : undefined;
  const assignmentReadOnlyReason = !canAssignOrders
    ? orderActionPolicy?.isReviewingLastClosedSession
      ? "Sesi\u00f3n cerrada: asignaci\u00f3n bloqueada."
      : DASHBOARD_REVIEW_MODE_BLOCKED_REASON
    : undefined;

  const detailParams = new URLSearchParams({
    from: "dashboard",
    filter: activeFilter
  });
  const detailHref = `/admin/orders/${order.id}?${detailParams.toString()}`;
  const headerElapsedTime = displayOrder
    ? buildOrderRelativeTimeLabel({ created_at: displayOrder.created_at })
    : null;

  return (
    <AdminOrderModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      headerLeading={displayOrder ? workstationHeaderLeading : undefined}
      headerMeta={
        headerElapsedTime ? <OrderModalHeaderMeta elapsedLabel={headerElapsedTime} /> : null
      }
      variant="workstation"
    >
      {loading && !displayOrder ? <OrderModalLoadingState /> : null}

      {error && !displayOrder ? <OrderModalErrorState message={error} /> : null}

      {displayOrder ? (
        <AdminOrderWorkspaceErrorBoundary key={displayOrder.id}>
          <OrderModalWorkspaceToolbar
            loading={loading}
            orderPresenceLabel={orderPresenceLabel}
            orderPresenceNames={orderPresenceNames}
          />

          <div className={styles.workspaceGrid}>
            <div className={styles.executionColumn}>
              <OrderItemsSection order={displayOrder} compact showTotal />
              <OrderWorkspaceOverview
                order={displayOrder}
                assignmentLabel={assignmentLabel}
                detailHref={detailHref}
                dashboardHref={dashboardHref}
                variant="workstation"
              />
              <OrderHumanTimeline
                events={displayOrder.order_events ?? []}
                orderCreatedAt={displayOrder.created_at}
                currentStatus={displayOrder.status}
                compact
                detailHref={detailHref}
              />
              <OrderNotesSection notes={displayOrder.notes} />
            </div>

            <div className={styles.commandColumn}>
              <OrderRecommendedActionPanel
                status={displayOrder.status}
                assignedTo={displayOrder.assigned_to}
                currentUserId={currentUserId}
                canUpdateOrders={canChangeStatus}
              />
              <OrderRiskPanel
                order={displayOrder}
                operationalMetrics={operationalMetrics}
                compact
              />
              <section
                className={`${workspaceStyles["admin-detail-panel"]} ${workspaceStyles["admin-detail-panel--actions-workstation"]}`}
                aria-label="Acciones operativas"
              >
                <section
                  className={workspaceStyles["admin-actions-group"]}
                  aria-labelledby="order-operational-controls-title"
                >
                  <div className={workspaceStyles["admin-actions-group__header"]}>
                    <h3
                      id="order-operational-controls-title"
                      className={workspaceStyles["admin-actions-group__title"]}
                    >
                      Control operativo
                    </h3>
                    <p className={workspaceStyles["admin-actions-group__description"]}>
                      {orderActionPolicy?.isReviewingLastClosedSession
                        ? "Revis\u00e1 estado y responsable del pedido. Las acciones operativas est\u00e1n bloqueadas."
                        : "Actualiz\u00e1 estado y responsable del pedido."}
                    </p>
                  </div>
                  <div className={workspaceStyles["admin-actions-group__body"]}>
                    <StatusForm
                      orderId={displayOrder.id}
                      initialStatus={displayOrder.status}
                      variant="modal"
                      canChangeStatus={canChangeStatus}
                      readOnlyReason={statusReadOnlyReason}
                      onSuccess={handleStatusSuccess}
                      onOptimisticStatusChange={handleOptimisticStatusChange}
                      onOptimisticStatusRollback={handleOptimisticStatusRollback}
                      onOptimisticStatusSettled={handleOptimisticStatusSettled}
                    />
                    <OrderAssignmentControls
                      orderId={displayOrder.id}
                      assignment={{
                        assigned_to: displayOrder.assigned_to,
                        assigned_at: displayOrder.assigned_at
                      }}
                      assignmentLabel={assignmentLabel}
                      currentUserId={currentUserId}
                      canUpdateOrders={canUpdateOrders}
                      canAssignOrders={canAssignOrders}
                      readOnlyReason={assignmentReadOnlyReason}
                      onOptimisticAssignmentChange={handleOptimisticAssignmentChange}
                      onOptimisticAssignmentRollback={handleOptimisticAssignmentRollback}
                      onOptimisticAssignmentSettled={handleOptimisticAssignmentSettled}
                    />
                  </div>
                </section>

                <section
                  className={workspaceStyles["admin-actions-group"]}
                  aria-labelledby="order-communication-controls-title"
                >
                  <div className={workspaceStyles["admin-actions-group__header"]}>
                    <h3
                      id="order-communication-controls-title"
                      className={workspaceStyles["admin-actions-group__title"]}
                    >
                      Comunicaci\u00f3n
                    </h3>
                    <p className={workspaceStyles["admin-actions-group__description"]}>
                      Contact\u00e1 al cliente y us\u00e1 accesos r\u00e1pidos.
                    </p>
                  </div>
                  <div className={workspaceStyles["admin-actions-group__body"]}>
                    <OrderExternalActions order={displayOrder} />
                  </div>
                </section>
              </section>
            </div>
          </div>
        </AdminOrderWorkspaceErrorBoundary>
      ) : null}
    </AdminOrderModalShell>
  );
}
