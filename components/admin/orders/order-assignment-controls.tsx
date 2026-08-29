"use client";

import { useTransition } from "react";
import { updateOrderAssignmentAction } from "@/app/admin/(protected)/orders/[id]/actions";
import { useAdminToast } from "@/components/admin/admin-toast-provider";
import Button from "@/components/ui/Button";
import detailStyles from "./order-detail-surfaces.module.css";
import {
  buildOrderAssignmentActionLabel,
  type AdminOrderAssignment
} from "@/lib/orders/assignment";
import type { AdminOrderTimelineEvent } from "@/lib/orders/events.shared";
import { isSessionMutationBlockedCode } from "@/lib/store-sessions/types";

function notifySessionMutationBlocked(onSessionMutationBlocked?: () => void) {
  onSessionMutationBlocked?.();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("orderops:operational-mutation-blocked"));
  }
}

type OrderAssignmentControlsProps = {
  orderId: string;
  assignment: AdminOrderAssignment;
  assignmentLabel: string | null;
  currentUserId: string;
  canUpdateOrders?: boolean;
  canAssignOrders?: boolean;
  readOnlyReason?: string;
  onSessionMutationBlocked?: () => void;
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
  orderResponsibilityEnabled?: boolean;
};

export default function OrderAssignmentControls({
  orderId,
  assignment,
  assignmentLabel,
  currentUserId,
  canUpdateOrders = true,
  canAssignOrders = true,
  readOnlyReason,
  onSessionMutationBlocked,
  onOptimisticAssignmentChange,
  onOptimisticAssignmentRollback,
  onOptimisticAssignmentSettled,
  orderResponsibilityEnabled = true
}: OrderAssignmentControlsProps) {
  const { pushToast } = useAdminToast();
  const [isPending, startTransition] = useTransition();

  if (!orderResponsibilityEnabled) {
    return null;
  }

  const isAssignedToCurrentUser = assignment.assigned_to === currentUserId;
  const hasAssignment = Boolean(assignment.assigned_to);
  const actionLabel = buildOrderAssignmentActionLabel({
    assignedTo: assignment.assigned_to,
    currentUserId
  });
  const nextAssignment: AdminOrderAssignment = isAssignedToCurrentUser
    ? { assigned_to: null, assigned_at: null }
    : { assigned_to: currentUserId, assigned_at: new Date().toISOString() };

  const handleSubmit = () => {
    if (!canAssignOrders) {
      return;
    }

    const previousAssignment = assignment;

    onOptimisticAssignmentChange?.(nextAssignment, previousAssignment);

    startTransition(async () => {
      let resolution: {
        succeeded: boolean;
        finalAssignment?: AdminOrderAssignment;
        event?: AdminOrderTimelineEvent | null;
      } = {
        succeeded: false
      };

      try {
        const formData = new FormData();
        formData.set("order_id", orderId);
        formData.set("assignment_action", isAssignedToCurrentUser ? "release" : "claim");

        const result = await updateOrderAssignmentAction({}, formData);

        if (result?.error) {
          onOptimisticAssignmentRollback?.(previousAssignment);
          if (isSessionMutationBlockedCode(result.code)) {
            notifySessionMutationBlocked(onSessionMutationBlocked);
          }
          pushToast({
            tone: "error",
            message: result.error
          });
          return;
        }

        resolution = {
          succeeded: result?.changed !== false,
          finalAssignment: {
            assigned_to: result.order?.assigned_to ?? nextAssignment.assigned_to,
            assigned_at: result.order?.assigned_at ?? nextAssignment.assigned_at
          },
          event: result.event ?? null
        };

        if (result?.changed === false) {
          pushToast({
            tone: "info",
            message: result.message ?? "No hubo cambios para guardar"
          });
        } else {
          pushToast({
            tone: "success",
            message: isAssignedToCurrentUser ? "Pedido liberado" : "Pedido tomado"
          });
        }
      } catch {
        onOptimisticAssignmentRollback?.(previousAssignment);
        pushToast({
          tone: "error",
          message: "No pudimos actualizar el responsable"
        });
      } finally {
        await onOptimisticAssignmentSettled?.(resolution);
      }
    });
  };

  return (
    <div className={detailStyles.assignmentControls}>
      <div className={detailStyles.assignmentControlsCopy}>
        <span className={detailStyles.assignmentControlsLabel}>Responsable</span>
        <strong>{assignmentLabel ?? "Sin responsable"}</strong>
        {!canAssignOrders && readOnlyReason ? (
          <p className={detailStyles.detailNote}>{readOnlyReason}</p>
        ) : !canUpdateOrders ? (
          <p className={detailStyles.detailNote}>
            Solo lectura. Podés ver responsable, presencia e historial.
          </p>
        ) : hasAssignment && !isAssignedToCurrentUser ? (
          <p className={detailStyles.detailNote}>
            Ya tiene responsable. Podés tomarlo igual si hace falta.
          </p>
        ) : null}
      </div>

      {canUpdateOrders && canAssignOrders ? (
        <Button
          type="button"
          variant={isAssignedToCurrentUser || hasAssignment ? "secondary" : "primary"}
          className={detailStyles.assignmentControlsButton}
          onClick={handleSubmit}
          disabled={isPending}
          aria-busy={isPending}
        >
          {isPending ? "Sincronizando..." : actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
