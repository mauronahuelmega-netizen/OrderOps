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
import OrderWorkspaceContextualStatusAction from "@/components/admin/orders/order-workspace-contextual-status-action";
import { useOrderStatusMutation } from "@/components/admin/orders/use-order-status-mutation";
import { useOrderWorkspaceHydration } from "@/components/admin/orders/use-order-workspace-hydration";
import styles from "./admin-order-modal.module.css";
import OrderExternalActions from "@/components/admin/orders/order-external-actions";
import OrderWorkspaceStatusSection from "@/components/admin/orders/order-workspace-status-section";
import OrderItemsSection from "@/components/admin/orders/order-items-section";
import OrderNotesSection from "@/components/admin/orders/order-notes-section";
import OrderWorkspaceOverview from "@/components/admin/orders/order-workspace-overview";
import type { AdminOrderAssignment } from "@/lib/orders/assignment";
import type { AdminOrderTimelineEvent } from "@/lib/orders/events.shared";
import type { AdminOperationalMetrics } from "@/lib/orders/metrics";
import {
  DASHBOARD_REVIEW_MODE_BLOCKED_REASON,
  type DashboardActionPolicy
} from "@/lib/orders/analytics";
import { type AdminOrderDashboardItem } from "@/lib/orders/admin";
import { getContextualStatusTransition } from "@/lib/orders/contextual-status-action";
import { buildOrderDisplayRef } from "@/lib/orders/display-ref";
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
  orderResponsibilityEnabled?: boolean;
};

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
  onOptimisticAssignmentSettled,
  orderResponsibilityEnabled = true
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

  const canChangeStatus =
    Boolean(order) && canUpdateOrders && (orderActionPolicy?.canChangeStatus ?? true);
  const authoritativeStatus =
    displayOrder?.status ?? order?.status ?? ("pending" as AdminOrderDashboardItem["status"]);
  const contextualTransition = getContextualStatusTransition(authoritativeStatus);

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

  // Single authoritative workspace status mutation controller (StatusForm reuses via prop).
  const statusMutation = useOrderStatusMutation({
    orderId: order?.id ?? "",
    initialStatus: authoritativeStatus,
    canChangeStatus,
    onSuccess: handleStatusSuccess,
    onOptimisticStatusChange: handleOptimisticStatusChange,
    onOptimisticStatusRollback: handleOptimisticStatusRollback,
    onOptimisticStatusSettled: handleOptimisticStatusSettled
  });

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

      return `#${buildOrderDisplayRef(displayOrder)} - ${operationalSummary.customerShortName}`;
    }

    if (order) {
      return `#${buildOrderDisplayRef(order)} - ${order.customer_short_name}`;
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
        orderRef={buildOrderDisplayRef(displayOrder)}
        customerLabel={operationalSummary.customerShortName}
        status={displayOrder.status}
        deliveryMethod={displayOrder.delivery_method}
      />
    );
  }, [displayOrder]);

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

  const canAssignOrders = canUpdateOrders && (orderActionPolicy?.canAssignOrders ?? true);
  const statusReadOnlyReason = !canChangeStatus
    ? orderActionPolicy?.isReviewingLastClosedSession
      ? "Sesión cerrada: estado bloqueado para revisión."
      : DASHBOARD_REVIEW_MODE_BLOCKED_REASON
    : undefined;
  const assignmentReadOnlyReason = !canAssignOrders
    ? orderActionPolicy?.isReviewingLastClosedSession
      ? "Sesión cerrada: asignación bloqueada."
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
              <section className={styles.workspaceSectionProducts} aria-label="Productos">
                <OrderItemsSection order={displayOrder} compact showTotal />
              </section>

              {displayOrder.notes?.trim() ? (
                <section className={styles.workspaceSectionNotes} aria-label="Indicaciones">
                  <OrderNotesSection notes={displayOrder.notes} variant="workstation" />
                </section>
              ) : null}
            </div>

            <div className={styles.commandColumn}>
              <OrderWorkspaceStatusSection
                order={displayOrder}
                canChangeStatus={canChangeStatus}
                canUpdateOrders={canUpdateOrders}
                canAssignOrders={canAssignOrders}
                statusReadOnlyReason={statusReadOnlyReason}
                assignmentReadOnlyReason={assignmentReadOnlyReason}
                assignmentLabel={assignmentLabel}
                currentUserId={currentUserId}
                operationalMetrics={operationalMetrics}
                orderResponsibilityEnabled={orderResponsibilityEnabled}
                mutation={statusMutation}
                onStatusSuccess={handleStatusSuccess}
                onOptimisticAssignmentChange={handleOptimisticAssignmentChange}
                onOptimisticAssignmentRollback={handleOptimisticAssignmentRollback}
                onOptimisticAssignmentSettled={handleOptimisticAssignmentSettled}
              />

              <section className={styles.workspaceSectionContext} aria-label="Cliente y entrega">
                <OrderWorkspaceOverview
                  order={displayOrder}
                  assignmentLabel={assignmentLabel}
                  detailHref={detailHref}
                  dashboardHref={dashboardHref}
                  variant="workstation"
                />
              </section>

              <section
                className={styles.workspaceSectionContact}
                aria-labelledby="order-contact-rail-title"
              >
                <h3 id="order-contact-rail-title" className={styles.commandRailEyebrow}>
                  Contacto con el cliente
                </h3>
                <div className={styles.commandRailBody}>
                  <OrderExternalActions
                    key={displayOrder.id}
                    order={displayOrder}
                    compactContact
                    contextualTemplateDefault
                    presentation="workspace"
                  />
                </div>
              </section>
            </div>
          </div>

          {canChangeStatus && contextualTransition ? (
            <div className={styles.contextualStatusFooter}>
              <OrderWorkspaceContextualStatusAction
                placement="persistent"
                label={contextualTransition.label}
                isPending={statusMutation.isPending}
                onAction={() =>
                  statusMutation.submitStatusChange(contextualTransition.targetStatus)
                }
              />
            </div>
          ) : null}
        </AdminOrderWorkspaceErrorBoundary>
      ) : null}
    </AdminOrderModalShell>
  );
}
