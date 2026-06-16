import type { AdminOrderDashboardItem } from "@/lib/orders/admin";
import type { AdminOrderAssignment } from "@/lib/orders/assignment";
import type { AdminOrderRealtimeRow } from "@/lib/orders/realtime";
import {
  patchAdminOrderDashboardItemAssignment,
  patchAdminOrderDashboardItemStatus
} from "@/lib/orders/workspace";

export type OrderOperationalStatus = AdminOrderDashboardItem["status"];

export type StatusAuthorityDecisionReason =
  | "no-current-status"
  | "no-pending-authority"
  | "incoming-matches-pending"
  | "incoming-is-forward-or-equal"
  | "incoming-is-stale-behind-current"
  | "incoming-is-stale-behind-pending"
  | "terminal-cancelled"
  | "incoming-cancelled"
  | "terminal-completed-protected";

export type StatusAuthorityDecision = {
  shouldApply: boolean;
  reason: StatusAuthorityDecisionReason;
};

const OPERATIONAL_STATUS_RANK: Record<
  Exclude<OrderOperationalStatus, "cancelled">,
  number
> = {
  pending: 0,
  preparing: 1,
  ready: 2,
  completed: 3
};

export function getOperationalStatusRank(
  status: OrderOperationalStatus | null | undefined
): number | null {
  if (!status) {
    return null;
  }

  if (status === "cancelled") {
    return -1;
  }

  return OPERATIONAL_STATUS_RANK[status];
}

export function isIncomingStatusStaleAgainstAuthority(
  incomingStatus: OrderOperationalStatus,
  authorityStatus: OrderOperationalStatus
): boolean {
  if (incomingStatus === authorityStatus) {
    return false;
  }

  const incomingRank = getOperationalStatusRank(incomingStatus);
  const authorityRank = getOperationalStatusRank(authorityStatus);

  if (incomingRank === null || authorityRank === null) {
    return false;
  }

  return incomingRank < authorityRank;
}

export function shouldApplyIncomingStatusForOrder(params: {
  currentStatus?: OrderOperationalStatus | null;
  incomingStatus: OrderOperationalStatus;
  pendingExpectedStatus?: OrderOperationalStatus | null;
  strictStaleGuard?: boolean;
}): StatusAuthorityDecision {
  const { currentStatus, incomingStatus, pendingExpectedStatus } = params;
  const strictStaleGuard = params.strictStaleGuard ?? true;

  if (incomingStatus === "cancelled") {
    return { shouldApply: true, reason: "incoming-cancelled" };
  }

  if (currentStatus === "cancelled") {
    return { shouldApply: false, reason: "terminal-cancelled" };
  }

  if (!currentStatus) {
    return { shouldApply: true, reason: "no-current-status" };
  }

  if (incomingStatus === currentStatus) {
    return { shouldApply: true, reason: "incoming-is-forward-or-equal" };
  }

  if (pendingExpectedStatus && incomingStatus === pendingExpectedStatus) {
    return { shouldApply: true, reason: "incoming-matches-pending" };
  }

  if (pendingExpectedStatus) {
    if (
      isIncomingStatusStaleAgainstAuthority(incomingStatus, pendingExpectedStatus)
    ) {
      return { shouldApply: false, reason: "incoming-is-stale-behind-pending" };
    }

    return { shouldApply: true, reason: "incoming-is-forward-or-equal" };
  }

  if (
    currentStatus === "completed" &&
    isIncomingStatusStaleAgainstAuthority(incomingStatus, currentStatus)
  ) {
    return { shouldApply: false, reason: "terminal-completed-protected" };
  }

  if (!strictStaleGuard) {
    return { shouldApply: true, reason: "no-pending-authority" };
  }

  if (isIncomingStatusStaleAgainstAuthority(incomingStatus, currentStatus)) {
    return { shouldApply: false, reason: "incoming-is-stale-behind-current" };
  }

  return { shouldApply: true, reason: "incoming-is-forward-or-equal" };
}

export type PendingOrderMutationKind = "status" | "assignment";

export type PendingOrderMutationPatch = {
  status?: AdminOrderDashboardItem["status"];
  assignment?: AdminOrderAssignment;
};

export type PendingOrderMutationResolution = {
  succeeded: boolean;
  serverStatus?: AdminOrderRealtimeRow["status"];
  serverAssignment?: AdminOrderAssignment;
};

export type PendingOrderMutationResolveResult = {
  conflict: boolean;
  needsRefresh: boolean;
  finalStatus?: AdminOrderDashboardItem["status"] | null;
  finalAssignment?: AdminOrderAssignment | null;
};

type PendingStatusMutationState = {
  expectedStatus: AdminOrderRealtimeRow["status"];
  previousStatus: AdminOrderRealtimeRow["status"];
  externalStatus?: AdminOrderRealtimeRow["status"];
  externalReceivedAt?: number;
};

type PendingAssignmentMutationState = {
  expectedAssignment: AdminOrderAssignment;
  previousAssignment: AdminOrderAssignment;
  externalAssignment?: AdminOrderAssignment;
  externalReceivedAt?: number;
};

export type PendingOrderMutationState = {
  startedAt: number;
  mutationId: string;
  status?: PendingStatusMutationState;
  assignment?: PendingAssignmentMutationState;
};

export function assignmentsMatch(
  left: AdminOrderAssignment | null | undefined,
  right: AdminOrderAssignment | null | undefined
) {
  return (left?.assigned_to ?? null) === (right?.assigned_to ?? null);
}

export function buildPendingOrderMutationPatch(
  pending: PendingOrderMutationState | null | undefined
): PendingOrderMutationPatch | null {
  if (!pending) {
    return null;
  }

  const patch: PendingOrderMutationPatch = {};

  if (pending.status) {
    patch.status = pending.status.expectedStatus;
  }

  if (pending.assignment) {
    patch.assignment = pending.assignment.expectedAssignment;
  }

  if (!patch.status && !patch.assignment) {
    return null;
  }

  return patch;
}

export function reconcileDashboardOrdersWithPendingMutations(
  serverOrders: AdminOrderDashboardItem[],
  getPendingMutationPatch: (orderId: string) => PendingOrderMutationPatch | null
): AdminOrderDashboardItem[] {
  return serverOrders.map((order) => {
    const patch = getPendingMutationPatch(order.id);

    if (!patch) {
      return order;
    }

    let nextOrder = order;

    if (patch.status && patch.status !== order.status) {
      nextOrder = patchAdminOrderDashboardItemStatus(nextOrder, patch.status);
    }

    if (
      patch.assignment &&
      (nextOrder.assigned_to ?? null) !== (patch.assignment.assigned_to ?? null)
    ) {
      nextOrder = patchAdminOrderDashboardItemAssignment(nextOrder, patch.assignment);
    }

    return nextOrder;
  });
}

export function resolvePendingStatusFromState(
  pending: PendingOrderMutationState,
  resolution: PendingOrderMutationResolution
): PendingOrderMutationResolveResult {
  const statusPending = pending.status;

  if (!statusPending) {
    return {
      conflict: false,
      needsRefresh: false,
      finalStatus: resolution.serverStatus ?? null
    };
  }

  const finalStatus =
    resolution.serverStatus ??
    (resolution.succeeded ? statusPending.expectedStatus : null);

  if (!resolution.succeeded) {
    const reconciledStatus = statusPending.externalStatus ?? statusPending.previousStatus;

    return {
      conflict: Boolean(statusPending.externalStatus),
      needsRefresh: Boolean(statusPending.externalStatus),
      finalStatus: reconciledStatus
    };
  }

  const hasConflict =
    Boolean(statusPending.externalStatus) && statusPending.externalStatus !== finalStatus;

  return {
    conflict: hasConflict,
    needsRefresh: hasConflict,
    finalStatus
  };
}

export function resolvePendingAssignmentFromState(
  pending: PendingOrderMutationState,
  resolution: PendingOrderMutationResolution
): PendingOrderMutationResolveResult {
  const assignmentPending = pending.assignment;

  if (!assignmentPending) {
    return {
      conflict: false,
      needsRefresh: false,
      finalAssignment: resolution.serverAssignment ?? null
    };
  }

  const finalAssignment =
    resolution.serverAssignment ??
    (resolution.succeeded ? assignmentPending.expectedAssignment : null);

  if (!resolution.succeeded) {
    const reconciledAssignment =
      assignmentPending.externalAssignment ?? assignmentPending.previousAssignment;

    return {
      conflict: Boolean(assignmentPending.externalAssignment),
      needsRefresh: Boolean(assignmentPending.externalAssignment),
      finalAssignment: reconciledAssignment
    };
  }

  const hasConflict =
    Boolean(assignmentPending.externalAssignment) &&
    !assignmentsMatch(assignmentPending.externalAssignment, finalAssignment);

  return {
    conflict: hasConflict,
    needsRefresh: hasConflict,
    finalAssignment
  };
}

export function shouldSuppressRealtimeUpdateForPendingMutation(
  row: AdminOrderRealtimeRow,
  pending: PendingOrderMutationState
): "suppress" | "apply" {
  let pendingKinds = 0;
  let echoedKinds = 0;
  let conflictDetected = false;

  if (pending.status) {
    pendingKinds += 1;

    if (row.status === pending.status.expectedStatus) {
      echoedKinds += 1;
    } else {
      pending.status.externalStatus = row.status;
      pending.status.externalReceivedAt = Date.now();
      conflictDetected = true;
    }
  }

  if (pending.assignment) {
    pendingKinds += 1;
    const rowAssignment: AdminOrderAssignment = {
      assigned_to: row.assigned_to ?? null,
      assigned_at: row.assigned_at ?? null
    };

    if (assignmentsMatch(rowAssignment, pending.assignment.expectedAssignment)) {
      echoedKinds += 1;
    } else {
      pending.assignment.externalAssignment = rowAssignment;
      pending.assignment.externalReceivedAt = Date.now();
      conflictDetected = true;
    }
  }

  if (pendingKinds === 0) {
    return "apply";
  }

  if (conflictDetected) {
    return "suppress";
  }

  if (echoedKinds === pendingKinds) {
    return "suppress";
  }

  return "apply";
}
