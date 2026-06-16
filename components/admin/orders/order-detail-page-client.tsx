"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminPageHeader from "@/components/admin/admin-page-header";
import AdminPageLayout from "@/components/admin/admin-page-layout";
import OrderRiskPanel from "@/components/admin/orders/order-risk-panel";
import OrderHumanTimeline from "@/components/admin/orders/order-human-timeline";
import OperatorPresencePill from "@/components/admin/orders/operator-presence-pill";
import OrderWorkspace from "@/components/admin/orders/order-workspace";
import OrderWorkspaceOverview from "@/components/admin/orders/order-workspace-overview";
import { useAdminPresence } from "@/components/admin/orders/use-admin-presence";
import Badge from "@/components/ui/Badge";
import {
  buildOrderAssignmentOwnerLabel,
  buildOrderContextualPresenceLabel,
  type AdminOrderAssignment
} from "@/lib/orders/assignment";
import type { AdminOrderDetail } from "@/lib/orders/admin";
import type { AdminOrderTimelineEvent } from "@/lib/orders/events.shared";
import {
  buildAdminOrderHeaderDescription,
  buildOrderRelativeTimeLabel,
  formatAdminOrderCurrency
} from "@/lib/orders/presenter";
import {
  patchWorkspaceOrderFromRealtime,
} from "@/lib/orders/realtime";
import {
  patchAdminOrderWorkspaceAssignment,
  patchAdminOrderWorkspaceStatus,
  type AdminOrderWorkspaceData
} from "@/lib/orders/workspace";
import type { ProfileRole } from "@/types/database";
import { useAdminOrdersRealtime } from "@/components/admin/orders/use-admin-orders-realtime";
import pageStyles from "./order-detail-page.module.css";

type OrderDetailPageClientProps = {
  order: AdminOrderDetail;
  customerSignals: string[];
  dashboardHref: string;
  businessId: string;
  canUpdateOrders: boolean;
  currentUserId: string;
  currentUserEmail?: string;
  currentUserRole: ProfileRole;
};

export default function OrderDetailPageClient({
  order: initialOrder,
  customerSignals,
  dashboardHref,
  businessId,
  canUpdateOrders,
  currentUserId,
  currentUserEmail,
  currentUserRole
}: OrderDetailPageClientProps) {
  const [order, setOrder] = useState<AdminOrderWorkspaceData>(initialOrder);

  useEffect(() => {
    setOrder(initialOrder);
  }, [initialOrder]);

  const { markPendingMutation, resolvePendingMutation } = useAdminOrdersRealtime({
    businessId,
    onOrderUpdate: (row) => {
      if (row.id !== order.id) {
        return;
      }

      setOrder((currentOrder) => patchWorkspaceOrderFromRealtime(currentOrder, row));
    }
  });

  const { onlineOperators, getOperatorsViewingOrder, isPresenceHealthy } = useAdminPresence({
    businessId,
    userId: currentUserId,
    userEmail: currentUserEmail,
    role: currentUserRole,
    currentSurface: "order_detail",
    currentOrderId: order.id
  });

  const operatorsViewingOrder = useMemo(
    () => getOperatorsViewingOrder(order.id),
    [getOperatorsViewingOrder, order.id]
  );

  const relativeTime = useMemo(
    () => buildOrderRelativeTimeLabel({ created_at: order.created_at }),
    [order.created_at]
  );

  const orderPresenceLabel = useMemo(() => {
    return buildOrderContextualPresenceLabel({
      viewingNames: operatorsViewingOrder.map((entry) => entry.name),
      assignedTo: order.assigned_to,
      onlineOperators
    });
  }, [onlineOperators, operatorsViewingOrder, order.assigned_to]);

  const assignmentLabel = useMemo(
    () =>
      buildOrderAssignmentOwnerLabel({
        assignedTo: order.assigned_to,
        currentUserId,
        onlineOperators
      }),
    [currentUserId, onlineOperators, order.assigned_to]
  );

  const headerActions = (
    <div className={pageStyles["admin-order-page-header-actions"]}>
      {isPresenceHealthy && orderPresenceLabel ? (
        <OperatorPresencePill
          label={orderPresenceLabel}
          names={operatorsViewingOrder.map((entry) => entry.name)}
          tone="contextual"
        />
      ) : null}
      <Badge status={order.status} />
      <div className={pageStyles["admin-order-page-header-total"]}>
        <span>Total</span>
        <strong>{formatAdminOrderCurrency(order.total_price)}</strong>
      </div>
      <Link className="admin-secondary-link" href={dashboardHref} scroll={false}>
        Volver al dashboard
      </Link>
    </div>
  );

  const handleOptimisticStatusChange = useCallback(
    (
      nextStatus: AdminOrderWorkspaceData["status"],
      previousStatus: AdminOrderWorkspaceData["status"]
    ) => {
      markPendingMutation(order.id, nextStatus, previousStatus);
      setOrder((currentOrder) => patchAdminOrderWorkspaceStatus(currentOrder, nextStatus));
    },
    [markPendingMutation, order.id]
  );

  const handleOptimisticStatusRollback = useCallback(
    (previousStatus: AdminOrderWorkspaceData["status"]) => {
      setOrder((currentOrder) => patchAdminOrderWorkspaceStatus(currentOrder, previousStatus));
    },
    []
  );

  const handleOptimisticStatusSettled = useCallback(
    (resolution?: {
      succeeded: boolean;
      finalStatus?: AdminOrderWorkspaceData["status"];
      event?: AdminOrderTimelineEvent | null;
    }) => {
      const pendingResolution = resolvePendingMutation(order.id, {
        succeeded: resolution?.succeeded ?? true,
        serverStatus: resolution?.finalStatus
      });

      if (!pendingResolution.finalStatus) {
        return;
      }

      setOrder((currentOrder) => {
        const nextOrder = patchAdminOrderWorkspaceStatus(
          currentOrder,
          pendingResolution.finalStatus!
        );

        if (
          !resolution?.event ||
          (nextOrder.order_events ?? []).some((event) => event.id === resolution.event!.id)
        ) {
          return nextOrder;
        }

        return {
          ...nextOrder,
          order_events: [...(nextOrder.order_events ?? []), resolution.event]
        };
      });
    },
    [order.id, resolvePendingMutation]
  );

  const handleOptimisticAssignmentChange = useCallback(
    (nextAssignment: AdminOrderAssignment) => {
      setOrder((currentOrder) => patchAdminOrderWorkspaceAssignment(currentOrder, nextAssignment));
    },
    []
  );

  const handleOptimisticAssignmentRollback = useCallback(
    (previousAssignment: AdminOrderAssignment) => {
      setOrder((currentOrder) =>
        patchAdminOrderWorkspaceAssignment(currentOrder, previousAssignment)
      );
    },
    []
  );

  const handleOptimisticAssignmentSettled = useCallback(
    (resolution?: {
      succeeded: boolean;
      finalAssignment?: AdminOrderAssignment;
      event?: AdminOrderTimelineEvent | null;
    }) => {
      if (!resolution?.finalAssignment && !resolution?.event) {
        return;
      }

      setOrder((currentOrder) => {
        const nextOrder = resolution.finalAssignment
          ? patchAdminOrderWorkspaceAssignment(currentOrder, resolution.finalAssignment)
          : currentOrder;

        if (
          !resolution?.event ||
          (nextOrder.order_events ?? []).some((event) => event.id === resolution.event!.id)
        ) {
          return nextOrder;
        }

        return {
          ...nextOrder,
          order_events: [...(nextOrder.order_events ?? []), resolution.event]
        };
      });
    },
    []
  );

  return (
    <AdminPageLayout size="default">
      <AdminPageHeader
        eyebrow="Detalle del pedido"
        title={`Pedido de ${order.customer_name}`}
        description={
          relativeTime
            ? `${buildAdminOrderHeaderDescription(order)} - ${relativeTime}`
            : buildAdminOrderHeaderDescription(order)
        }
        actions={headerActions}
      />

      <OrderWorkspaceOverview order={order} variant="page" assignmentLabel={assignmentLabel} />
      <OrderRiskPanel order={order} />
      <OrderWorkspace
        order={order}
        canUpdateOrders={canUpdateOrders}
        currentUserId={currentUserId}
        assignmentLabel={assignmentLabel}
        variant="page"
        customerSignals={customerSignals}
        onOptimisticStatusChange={handleOptimisticStatusChange}
        onOptimisticStatusRollback={handleOptimisticStatusRollback}
        onOptimisticStatusSettled={handleOptimisticStatusSettled}
        onOptimisticAssignmentChange={handleOptimisticAssignmentChange}
        onOptimisticAssignmentRollback={handleOptimisticAssignmentRollback}
        onOptimisticAssignmentSettled={handleOptimisticAssignmentSettled}
      />
      <OrderHumanTimeline
        events={order.order_events ?? []}
        orderCreatedAt={order.created_at}
        currentStatus={order.status}
      />
    </AdminPageLayout>
  );
}
