"use client";

import OrderAssignmentControls from "@/components/admin/orders/order-assignment-controls";
import OrderRiskPanel from "@/components/admin/orders/order-risk-panel";
import OrderWorkspaceContextualStatusAction from "@/components/admin/orders/order-workspace-contextual-status-action";
import StatusForm from "@/components/admin/orders/status-form";
import type { useOrderStatusMutation } from "@/components/admin/orders/use-order-status-mutation";
import type { AdminOrderAssignment } from "@/lib/orders/assignment";
import {
  getContextualStatusTransition,
  getTerminalStatusContext
} from "@/lib/orders/contextual-status-action";
import type { AdminOperationalMetrics } from "@/lib/orders/metrics";
import type { AdminOrderWorkspaceData } from "@/lib/orders/workspace";
import modalStyles from "./admin-order-modal.module.css";
import styles from "./order-workspace-status-section.module.css";

type OrderWorkspaceStatusSectionProps = {
  order: AdminOrderWorkspaceData;
  canChangeStatus: boolean;
  canUpdateOrders: boolean;
  canAssignOrders: boolean;
  statusReadOnlyReason?: string;
  assignmentReadOnlyReason?: string;
  assignmentLabel: string | null;
  currentUserId: string;
  operationalMetrics?: AdminOperationalMetrics;
  orderResponsibilityEnabled?: boolean;
  /** Shared workspace mutation controller — must be the only authoritative instance. */
  mutation: ReturnType<typeof useOrderStatusMutation>;
  onStatusSuccess: () => void;
  onOptimisticAssignmentChange: (
    nextAssignment: AdminOrderAssignment,
    previousAssignment: AdminOrderAssignment
  ) => void;
  onOptimisticAssignmentRollback: (previousAssignment: AdminOrderAssignment) => void;
  onOptimisticAssignmentSettled: (resolution?: {
    succeeded: boolean;
    finalAssignment?: AdminOrderAssignment;
    event?: import("@/lib/orders/events.shared").AdminOrderTimelineEvent | null;
  }) => void | Promise<void>;
};

export default function OrderWorkspaceStatusSection({
  order,
  canChangeStatus,
  canUpdateOrders,
  canAssignOrders,
  statusReadOnlyReason,
  assignmentReadOnlyReason,
  assignmentLabel,
  currentUserId,
  operationalMetrics,
  orderResponsibilityEnabled = true,
  mutation,
  onStatusSuccess,
  onOptimisticAssignmentChange,
  onOptimisticAssignmentRollback,
  onOptimisticAssignmentSettled
}: OrderWorkspaceStatusSectionProps) {
  const isTerminalStatus = order.status === "completed" || order.status === "cancelled";
  const contextualTransition = getContextualStatusTransition(order.status);
  const terminalContext = getTerminalStatusContext(order.status);

  const handleContextualAction = () => {
    if (!contextualTransition) {
      return;
    }

    mutation.submitStatusChange(contextualTransition.targetStatus);
  };

  return (
    <section
      className={modalStyles.workspaceSectionStatus}
      aria-labelledby="order-status-rail-title"
      data-terminal-status={isTerminalStatus ? "true" : undefined}
    >
      <h3
        id="order-status-rail-title"
        className={`${modalStyles.commandRailEyebrow} ${styles.statusSectionHeading}`}
      >
        Estado
      </h3>
      <div className={modalStyles.commandRailBody}>
        <OrderRiskPanel
          order={order}
          operationalMetrics={operationalMetrics}
          compact
          orderResponsibilityEnabled={orderResponsibilityEnabled}
        />

        {terminalContext ? (
          <p className={styles.terminalContext}>{terminalContext}</p>
        ) : null}

        {canChangeStatus && contextualTransition ? (
          <OrderWorkspaceContextualStatusAction
            placement="inline"
            label={contextualTransition.label}
            isPending={mutation.isPending}
            onAction={handleContextualAction}
          />
        ) : null}

        {canChangeStatus ? (
          <div className={styles.manualControls}>
            <p className={styles.manualLabel}>Cambiar estado manualmente</p>
            <StatusForm
              orderId={order.id}
              initialStatus={order.status}
              variant="workstation"
              canChangeStatus={canChangeStatus}
              readOnlyReason={statusReadOnlyReason}
              mutation={mutation}
              onSuccess={onStatusSuccess}
            />
          </div>
        ) : statusReadOnlyReason ? (
          <p className={styles.readOnlyNote}>{statusReadOnlyReason}</p>
        ) : null}

        <OrderAssignmentControls
          orderId={order.id}
          assignment={{
            assigned_to: order.assigned_to,
            assigned_at: order.assigned_at
          }}
          assignmentLabel={assignmentLabel}
          currentUserId={currentUserId}
          canUpdateOrders={canUpdateOrders}
          canAssignOrders={canAssignOrders}
          readOnlyReason={assignmentReadOnlyReason}
          orderResponsibilityEnabled={orderResponsibilityEnabled}
          onOptimisticAssignmentChange={onOptimisticAssignmentChange}
          onOptimisticAssignmentRollback={onOptimisticAssignmentRollback}
          onOptimisticAssignmentSettled={onOptimisticAssignmentSettled}
        />
      </div>
    </section>
  );
}
