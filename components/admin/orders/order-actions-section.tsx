import OrderAssignmentControls from "@/components/admin/orders/order-assignment-controls";
import OrderExternalActions from "@/components/admin/orders/order-external-actions";
import Card from "@/components/ui/Card";
import StatusForm from "@/components/admin/orders/status-form";
import type { AdminOrderAssignment } from "@/lib/orders/assignment";
import type { AdminOrderTimelineEvent } from "@/lib/orders/events.shared";
import type { AdminOrderWorkspaceData } from "@/lib/orders/workspace";
import workspaceStyles from "./order-workspace.module.css";
import detailStyles from "./order-detail-surfaces.module.css";

type OrderActionsSectionProps = {
  order: AdminOrderWorkspaceData;
  canUpdateOrders?: boolean;
  currentUserId: string;
  assignmentLabel: string | null;
  onStatusSuccess?: (nextStatus: AdminOrderWorkspaceData["status"]) => void;
  onOptimisticStatusChange?: (
    nextStatus: AdminOrderWorkspaceData["status"],
    previousStatus: AdminOrderWorkspaceData["status"]
  ) => void;
  onOptimisticStatusRollback?: (previousStatus: AdminOrderWorkspaceData["status"]) => void;
  onOptimisticStatusSettled?: (resolution?: {
    succeeded: boolean;
    finalStatus?: AdminOrderWorkspaceData["status"];
    event?: AdminOrderTimelineEvent | null;
  }) => void | Promise<void>;
  onOptimisticAssignmentChange?: (
    nextAssignment: AdminOrderAssignment,
    previousAssignment: AdminOrderAssignment
  ) => void;
  onOptimisticAssignmentRollback?: (previousAssignment: AdminOrderAssignment) => void;
  onOptimisticAssignmentSettled?: (resolution?: {
    succeeded: boolean;
    finalAssignment?: AdminOrderAssignment;
    event?: AdminOrderTimelineEvent | null;
  }) => void | Promise<void>;
  variant?: "default" | "modal" | "page" | "workstation";
  orderResponsibilityEnabled?: boolean;
};

export default function OrderActionsSection({
  order,
  canUpdateOrders = true,
  currentUserId,
  assignmentLabel,
  onStatusSuccess,
  onOptimisticStatusChange,
  onOptimisticStatusRollback,
  onOptimisticStatusSettled,
  onOptimisticAssignmentChange,
  onOptimisticAssignmentRollback,
  onOptimisticAssignmentSettled,
  variant = "default",
  orderResponsibilityEnabled = true
}: OrderActionsSectionProps) {
  const isWorkstation = variant === "workstation";

  const statusForm = canUpdateOrders ? (
    <StatusForm
      orderId={order.id}
      initialStatus={order.status}
      variant={isWorkstation ? "modal" : variant}
      onSuccess={onStatusSuccess}
      onOptimisticStatusChange={onOptimisticStatusChange}
      onOptimisticStatusRollback={onOptimisticStatusRollback}
      onOptimisticStatusSettled={onOptimisticStatusSettled}
    />
  ) : (
    <p className={detailStyles.detailNote}>Acceso de solo lectura para el estado del pedido.</p>
  );

  const assignmentControls = orderResponsibilityEnabled ? (
    <OrderAssignmentControls
      orderId={order.id}
      assignment={{
        assigned_to: order.assigned_to,
        assigned_at: order.assigned_at
      }}
      assignmentLabel={assignmentLabel}
      currentUserId={currentUserId}
      canUpdateOrders={canUpdateOrders}
      orderResponsibilityEnabled={orderResponsibilityEnabled}
      onOptimisticAssignmentChange={onOptimisticAssignmentChange}
      onOptimisticAssignmentRollback={onOptimisticAssignmentRollback}
      onOptimisticAssignmentSettled={onOptimisticAssignmentSettled}
    />
  ) : null;

  const operationalDescription = orderResponsibilityEnabled
    ? "Actualizá estado y responsable del pedido."
    : "Actualizá el estado del pedido.";

  const externalActions = <OrderExternalActions order={order} />;

  if (isWorkstation) {
    return (
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
              {operationalDescription}
            </p>
          </div>
          <div className={workspaceStyles["admin-actions-group__body"]}>
            {statusForm}
            {assignmentControls}
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
              Comunicación
            </h3>
            <p className={workspaceStyles["admin-actions-group__description"]}>
              Contactá al cliente y usá accesos rápidos.
            </p>
          </div>
          <div className={workspaceStyles["admin-actions-group__body"]}>{externalActions}</div>
        </section>
      </section>
    );
  }

  return (
    <Card
      className={`${workspaceStyles["admin-detail-panel"]} ${workspaceStyles["admin-detail-panel--actions"]}`}
    >
      <div className={workspaceStyles["admin-detail-header"]}>
        <h2>Acciones</h2>
      </div>

      {statusForm}
      {assignmentControls}
      {externalActions}
    </Card>
  );
}
