/**
 * Regression verify for pending status mutation finalization.
 *
 * Reproduces the P1 crash class:
 * clearPendingMutationKind deletes `status` in place on the Map entry,
 * then post-clear reads of `pending.status.expectedStatus` throw.
 *
 * Run: npx tsx lib/orders/pending-status-mutation-finalization.verify.ts
 */
import assert from "node:assert/strict";

import {
  resolvePendingStatusFromState,
  type PendingOrderMutationResolution,
  type PendingOrderMutationState
} from "@/lib/orders/dashboard-order-reconciliation";
import type { AdminOrderRealtimeRow } from "@/lib/orders/realtime";

type TraceFields = {
  expectedStatus: AdminOrderRealtimeRow["status"];
  previousStatus: AdminOrderRealtimeRow["status"];
  externalStatus: AdminOrderRealtimeRow["status"] | null;
  mutationId: string;
};

function createPending(
  orderId: string,
  expectedStatus: AdminOrderRealtimeRow["status"],
  previousStatus: AdminOrderRealtimeRow["status"]
): PendingOrderMutationState {
  return {
    startedAt: Date.now(),
    mutationId: `${orderId}:test`,
    status: {
      expectedStatus,
      previousStatus
    }
  };
}

/** Mirrors clearPendingMutationKind(..., "status") in-place mutation semantics. */
function clearStatusKindInPlace(
  registry: Map<string, PendingOrderMutationState>,
  orderId: string
) {
  const pendingMutation = registry.get(orderId);

  if (!pendingMutation) {
    return;
  }

  delete pendingMutation.status;

  if (!pendingMutation.status && !pendingMutation.assignment) {
    registry.delete(orderId);
    return;
  }

  registry.set(orderId, pendingMutation);
}

/**
 * Mirrors resolvePendingStatusMutation success path after the fix:
 * snapshot status fields → resolve → clear → trace from snapshot (never from deleted status).
 */
function resolvePendingStatusOnce(
  registry: Map<string, PendingOrderMutationState>,
  orderId: string,
  resolution: PendingOrderMutationResolution
): {
  lateNoOp: boolean;
  finalStatus: AdminOrderRealtimeRow["status"] | null;
  needsRefresh: boolean;
  conflict: boolean;
  trace: TraceFields | null;
} {
  const pendingMutation = registry.get(orderId);

  if (!pendingMutation?.status) {
    return {
      lateNoOp: true,
      conflict: false,
      finalStatus: resolution.serverStatus ?? null,
      needsRefresh: false,
      trace: null
    };
  }

  const statusPending = pendingMutation.status;
  const expectedStatus = statusPending.expectedStatus;
  const previousStatus = statusPending.previousStatus;
  const mutationId = pendingMutation.mutationId;
  const result = resolvePendingStatusFromState(pendingMutation, resolution);
  const externalStatus = statusPending.externalStatus ?? null;

  clearStatusKindInPlace(registry, orderId);

  const trace: TraceFields = {
    expectedStatus,
    previousStatus,
    externalStatus,
    mutationId
  };

  return {
    lateNoOp: false,
    conflict: result.conflict,
    needsRefresh: result.needsRefresh,
    finalStatus: result.finalStatus ?? resolution.serverStatus ?? null,
    trace
  };
}

/** Pre-fix crash path: clear then read pending.status.expectedStatus. */
function resolveWithBuggyPostClearTrace(
  registry: Map<string, PendingOrderMutationState>,
  orderId: string,
  resolution: PendingOrderMutationResolution
) {
  const pendingMutation = registry.get(orderId);

  if (!pendingMutation?.status) {
    return;
  }

  resolvePendingStatusFromState(pendingMutation, resolution);
  clearStatusKindInPlace(registry, orderId);

  // This is the exact crash site from use-admin-orders-realtime.ts before the fix.
  return pendingMutation.status!.expectedStatus;
}

function main() {
  const orderId = "order-qa-1";

  // 1) Bug reproduction: in-place clear then .expectedStatus throws
  {
    const registry = new Map<string, PendingOrderMutationState>();
    registry.set(orderId, createPending(orderId, "ready", "preparing"));

    assert.throws(
      () =>
        resolveWithBuggyPostClearTrace(registry, orderId, {
          succeeded: true,
          serverStatus: "ready"
        }),
      (error: unknown) =>
        error instanceof TypeError &&
        String(error.message).includes("expectedStatus")
    );
  }

  // 2) Fixed path: first resolution succeeds, trace uses snapshot, registry cleaned
  {
    const registry = new Map<string, PendingOrderMutationState>();
    registry.set(orderId, createPending(orderId, "ready", "preparing"));

    const first = resolvePendingStatusOnce(registry, orderId, {
      succeeded: true,
      serverStatus: "ready"
    });

    assert.equal(first.lateNoOp, false);
    assert.equal(first.finalStatus, "ready");
    assert.equal(first.trace?.expectedStatus, "ready");
    assert.equal(first.trace?.previousStatus, "preparing");
    assert.equal(registry.has(orderId), false);
  }

  // 3) Late / double confirmation: second resolve is safe no-op (idempotent)
  {
    const registry = new Map<string, PendingOrderMutationState>();
    registry.set(orderId, createPending(orderId, "ready", "preparing"));

    resolvePendingStatusOnce(registry, orderId, {
      succeeded: true,
      serverStatus: "ready"
    });

    const late = resolvePendingStatusOnce(registry, orderId, {
      succeeded: true,
      serverStatus: "ready"
    });

    assert.equal(late.lateNoOp, true);
    assert.equal(late.trace, null);
    assert.equal(late.finalStatus, "ready");
    assert.equal(registry.has(orderId), false);
  }

  // 4) Realtime-first then server-success: missing entry after first clear is late no-op
  {
    const registry = new Map<string, PendingOrderMutationState>();
    registry.set(orderId, createPending(orderId, "preparing", "pending"));

    const realtimeConfirm = resolvePendingStatusOnce(registry, orderId, {
      succeeded: true,
      serverStatus: "preparing"
    });
    assert.equal(realtimeConfirm.lateNoOp, false);
    assert.equal(realtimeConfirm.finalStatus, "preparing");

    const serverSuccessLater = resolvePendingStatusOnce(registry, orderId, {
      succeeded: true,
      serverStatus: "preparing"
    });
    assert.equal(serverSuccessLater.lateNoOp, true);
    assert.doesNotThrow(() => {
      void serverSuccessLater.finalStatus;
    });
  }

  // 5) Failure rollback path also snapshots before clear
  {
    const registry = new Map<string, PendingOrderMutationState>();
    registry.set(orderId, createPending(orderId, "ready", "preparing"));

    const failed = resolvePendingStatusOnce(registry, orderId, {
      succeeded: false
    });

    assert.equal(failed.lateNoOp, false);
    assert.equal(failed.finalStatus, "preparing");
    assert.equal(failed.trace?.expectedStatus, "ready");
    assert.equal(registry.has(orderId), false);
  }

  console.log("pending-status-mutation-finalization.verify.ts: PASS");
}

main();
