import OrderActionsSection from "@/components/admin/orders/order-actions-section";
import OrderCustomerSection from "@/components/admin/orders/order-customer-section";
import OrderDeliverySection from "@/components/admin/orders/order-delivery-section";
import OrderItemsSection from "@/components/admin/orders/order-items-section";
import OrderNotesSection from "@/components/admin/orders/order-notes-section";
import OrderTotalSection from "@/components/admin/orders/order-total-section";
import type { AdminOrderAssignment } from "@/lib/orders/assignment";
import type { AdminOrderTimelineEvent } from "@/lib/orders/events.shared";
import type { AdminOrderWorkspaceData } from "@/lib/orders/workspace";
import styles from "./order-workspace.module.css";

type OrderWorkspaceProps = {
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
  variant?: "default" | "modal" | "page";
  customerSignals?: string[];
  orderResponsibilityEnabled?: boolean;
};

export default function OrderWorkspace({
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
  customerSignals = [],
  orderResponsibilityEnabled = true
}: OrderWorkspaceProps) {
  const isModal = variant === "modal";
  const isPage = variant === "page";
  const layoutClassName = [
    styles["admin-detail-layout"],
    isModal ? styles["admin-detail-layout--modal"] : null,
    isPage ? styles["admin-detail-layout--page"] : null
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={layoutClassName}>
      <OrderCustomerSection order={order} compact={isModal} customerSignals={customerSignals} />
      <OrderDeliverySection order={order} compact={isModal} showNotes={!isPage} />
      <OrderItemsSection order={order} compact={isModal} />
      {isModal || isPage ? null : <OrderTotalSection order={order} />}
      <OrderActionsSection
        order={order}
        canUpdateOrders={canUpdateOrders}
        currentUserId={currentUserId}
        assignmentLabel={assignmentLabel}
        variant={variant}
        orderResponsibilityEnabled={orderResponsibilityEnabled}
        onStatusSuccess={onStatusSuccess}
        onOptimisticStatusChange={onOptimisticStatusChange}
        onOptimisticStatusRollback={onOptimisticStatusRollback}
        onOptimisticStatusSettled={onOptimisticStatusSettled}
        onOptimisticAssignmentChange={onOptimisticAssignmentChange}
        onOptimisticAssignmentRollback={onOptimisticAssignmentRollback}
        onOptimisticAssignmentSettled={onOptimisticAssignmentSettled}
      />
      {isPage ? <OrderNotesSection notes={order.notes} /> : null}
    </div>
  );
}
