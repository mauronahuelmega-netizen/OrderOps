"use server";

import { getActionErrorMessage, logActionFailure } from "@/lib/admin/action-errors";
import { requireAdminPermission } from "@/lib/admin/context";
import { createOrderEvent } from "@/lib/orders/events.server";
import {
  presentOrderTimelineEvent,
  type AdminOrderTimelineEvent
} from "@/lib/orders/events.shared";
import type { OrderMutationErrorCode } from "@/lib/store-sessions/types";
import { assertActiveStoreSessionForOrderMutation } from "@/lib/store-sessions/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type OrderStatus = "pending" | "preparing" | "ready" | "completed" | "cancelled";
type AssignmentAction = "claim" | "release";

type ActionState = {
  error?: string;
  code?: OrderMutationErrorCode;
  success?: boolean;
  changed?: boolean;
  message?: string;
  event?: AdminOrderTimelineEvent | null;
  order?: {
    id: string;
    status?: OrderStatus;
    assigned_to?: string | null;
    assigned_at?: string | null;
  };
};

const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "preparing",
  "ready",
  "completed",
  "cancelled"
];
const ASSIGNMENT_ACTIONS: AssignmentAction[] = ["claim", "release"];

type TransitionOrderStatusResult = {
  changed: boolean;
  previous_status: OrderStatus;
  status: OrderStatus;
  restocked_items: number;
};

function parseTransitionOrderStatusResult(value: unknown): TransitionOrderStatusResult | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const previousStatus = record.previous_status;
  const nextStatus = record.status;

  if (
    typeof record.changed !== "boolean" ||
    typeof previousStatus !== "string" ||
    typeof nextStatus !== "string" ||
    !ORDER_STATUSES.includes(previousStatus as OrderStatus) ||
    !ORDER_STATUSES.includes(nextStatus as OrderStatus)
  ) {
    return null;
  }

  return {
    changed: record.changed,
    previous_status: previousStatus as OrderStatus,
    status: nextStatus as OrderStatus,
    restocked_items:
      typeof record.restocked_items === "number" && Number.isFinite(record.restocked_items)
        ? record.restocked_items
        : 0
  };
}

function logSupabaseActionError(
  scope: "status" | "assignment",
  action: string,
  context: Record<string, unknown>,
  error: unknown
) {
  const supabaseError =
    error && typeof error === "object"
      ? {
          message:
            "message" in error && typeof error.message === "string"
              ? error.message
              : undefined,
          name: "name" in error && typeof error.name === "string" ? error.name : undefined,
          code: "code" in error ? error.code : undefined,
          details: "details" in error ? error.details : undefined,
          hint: "hint" in error ? error.hint : undefined,
          status: "status" in error ? error.status : undefined
        }
      : undefined;

  console.error(`[order-mutation:${scope}:error]`, {
    action,
    ...context,
    message: error instanceof Error ? error.message : String(error),
    name: error instanceof Error ? error.name : undefined,
    code:
      typeof error === "object" && error !== null && "code" in error ? error.code : undefined,
    ...(supabaseError
      ? {
          supabase: {
            details: supabaseError.details,
            hint: supabaseError.hint,
            status: supabaseError.status
          }
        }
      : {})
  });
}

export async function updateOrderStatusAction(
  _prevState: ActionState,
  formData: FormData
) {
  const orderId = getTrimmedString(formData.get("order_id"));
  const status = getTrimmedString(formData.get("status"));

  if (!orderId) {
    return { error: "Falta identificar el pedido." };
  }

  if (!ORDER_STATUSES.includes(status as OrderStatus)) {
    return { error: "Estado invalido." };
  }

  try {
    const adminContext = await requireAdminPermission("updateOrders");
    const supabase = await createSupabaseServerClient();

    const { data: currentOrder, error: currentOrderError } = await supabase
      .from("orders")
      .select("id, created_at, status, assigned_to, assigned_at")
      .eq("id", orderId)
      .eq("business_id", adminContext.businessId)
      .maybeSingle();

    if (currentOrderError) {
      logSupabaseActionError("status", "updateOrderStatusAction.loadOrder", { orderId }, currentOrderError);
      throw new Error("No pudimos cargar el pedido.");
    }

    if (!currentOrder) {
      return { error: "Este pedido ya no existe o pertenece a otro negocio.", code: "ORDER_NOT_FOUND" };
    }

    const mutationGuard = await assertActiveStoreSessionForOrderMutation({
      businessId: adminContext.businessId,
      order: {
        id: currentOrder.id,
        created_at: currentOrder.created_at,
        business_id: adminContext.businessId
      }
    });

    if (!mutationGuard.ok) {
      console.error("[order-mutation:status:guard]", {
        action: "updateOrderStatusAction",
        orderId,
        nextStatus: status,
        code: mutationGuard.reason,
        message: mutationGuard.message
      });
      return { error: mutationGuard.message, code: mutationGuard.reason };
    }

    if (currentOrder.status === status) {
      return {
        success: true,
        changed: false,
        message: "No hubo cambios para guardar.",
        order: {
          id: currentOrder.id,
          status: currentOrder.status as OrderStatus,
          assigned_to: currentOrder.assigned_to ?? null,
          assigned_at: currentOrder.assigned_at ?? null
        }
      };
    }

    const { data: transitionData, error: transitionError } = await supabase.rpc(
      "transition_order_status",
      {
        p_order_id: orderId,
        p_target_status: status
      }
    );

    if (transitionError) {
      logSupabaseActionError("status", "updateOrderStatusAction.transition", {
        orderId,
        nextStatus: status
      }, transitionError);

      const rpcMessage =
        typeof transitionError.message === "string" ? transitionError.message : "";

      if (rpcMessage.includes("RESTOCK_CONFLICT")) {
        return {
          error:
            "No se pudo actualizar el estado porque el stock ya fue ajustado. Volvé a cargar e intentá nuevamente."
        };
      }

      if (rpcMessage.includes("ORDER_NOT_FOUND") || rpcMessage.includes("ORDER_BUSINESS_MISMATCH")) {
        return {
          error: "Este pedido ya no existe o pertenece a otro negocio.",
          code: "ORDER_NOT_FOUND"
        };
      }

      if (rpcMessage.includes("INVALID_ORDER_STATUS")) {
        return { error: "Estado invalido." };
      }

      throw new Error("No pudimos actualizar el pedido.");
    }

    const transitionResult = parseTransitionOrderStatusResult(transitionData);

    if (!transitionResult) {
      console.error("[order-mutation:status:empty-transition]", {
        action: "updateOrderStatusAction",
        orderId,
        nextStatus: status,
        message: "RPC returned unexpected payload",
        payload: transitionData
      });
      return { error: "No pudimos actualizar el pedido." };
    }

    if (!transitionResult.changed) {
      return {
        success: true,
        changed: false,
        message: "No hubo cambios para guardar.",
        order: {
          id: currentOrder.id,
          status: transitionResult.status,
          assigned_to: currentOrder.assigned_to ?? null,
          assigned_at: currentOrder.assigned_at ?? null
        }
      };
    }

    const { data: updatedOrder, error: reloadError } = await supabase
      .from("orders")
      .select("id, status, assigned_to, assigned_at")
      .eq("id", orderId)
      .eq("business_id", adminContext.businessId)
      .maybeSingle();

    if (reloadError) {
      logSupabaseActionError("status", "updateOrderStatusAction.reload", {
        orderId,
        nextStatus: status
      }, reloadError);
    }

    let event: AdminOrderTimelineEvent | null = null;

    try {
      const eventRow = await createOrderEvent({
        businessId: adminContext.businessId,
        orderId,
        actorProfileId: adminContext.user.id,
        eventType: "status_changed",
        payload: {
          from_status: transitionResult.previous_status,
          to_status: transitionResult.status
        }
      });

      event = eventRow
        ? presentOrderTimelineEvent(eventRow, adminContext.user.email ?? null)
        : null;
    } catch (eventError) {
      logActionFailure("orders.updateStatus.event", eventError, {
        businessId: adminContext.businessId,
        orderId,
        fromStatus: transitionResult.previous_status,
        toStatus: transitionResult.status
      });
    }

    return {
      success: true,
      changed: true,
      event,
      order: {
        id: updatedOrder?.id ?? currentOrder.id,
        status: (updatedOrder?.status as OrderStatus | undefined) ?? transitionResult.status,
        assigned_to: updatedOrder?.assigned_to ?? currentOrder.assigned_to ?? null,
        assigned_at: updatedOrder?.assigned_at ?? currentOrder.assigned_at ?? null
      }
    };
  } catch (error) {
    logSupabaseActionError("status", "updateOrderStatusAction", { orderId, nextStatus: status }, error);
    logActionFailure("orders.updateStatus", error, { orderId, status });
    return { error: getActionErrorMessage(error, "No pudimos actualizar el pedido.") };
  }
}

export async function updateOrderAssignmentAction(
  _prevState: ActionState,
  formData: FormData
) {
  const orderId = getTrimmedString(formData.get("order_id"));
  const assignmentAction = getTrimmedString(formData.get("assignment_action"));

  if (!orderId) {
    return { error: "Falta identificar el pedido." };
  }

  if (!ASSIGNMENT_ACTIONS.includes(assignmentAction as AssignmentAction)) {
    return { error: "Accion invalida." };
  }

  try {
    const adminContext = await requireAdminPermission("updateOrders");
    const supabase = await createSupabaseServerClient();

    const { data: currentOrder, error: currentOrderError } = await supabase
      .from("orders")
      .select("id, created_at, status, assigned_to, assigned_at")
      .eq("id", orderId)
      .eq("business_id", adminContext.businessId)
      .maybeSingle();

    if (currentOrderError) {
      logSupabaseActionError("assignment", "updateOrderAssignmentAction.loadOrder", {
        orderId,
        assigneeId: assignmentAction === "claim" ? adminContext.user.id : null
      }, currentOrderError);
      throw new Error("No pudimos cargar el pedido.");
    }

    if (!currentOrder) {
      return { error: "Este pedido ya no existe o pertenece a otro negocio.", code: "ORDER_NOT_FOUND" };
    }

    const mutationGuard = await assertActiveStoreSessionForOrderMutation({
      businessId: adminContext.businessId,
      order: {
        id: currentOrder.id,
        created_at: currentOrder.created_at,
        business_id: adminContext.businessId
      }
    });

    if (!mutationGuard.ok) {
      console.error("[order-mutation:assignment:guard]", {
        action: "updateOrderAssignmentAction",
        orderId,
        assignmentAction,
        code: mutationGuard.reason,
        message: mutationGuard.message
      });
      return { error: mutationGuard.message, code: mutationGuard.reason };
    }

    if (assignmentAction === "claim" && currentOrder.assigned_to === adminContext.user.id) {
      return {
        success: true,
        changed: false,
        message: "El pedido ya estaba a tu cargo.",
        order: {
          id: currentOrder.id,
          status: currentOrder.status as OrderStatus,
          assigned_to: currentOrder.assigned_to ?? null,
          assigned_at: currentOrder.assigned_at ?? null
        }
      };
    }

    if (assignmentAction === "release" && !currentOrder.assigned_to) {
      return {
        success: true,
        changed: false,
        message: "El pedido ya estaba sin responsable.",
        order: {
          id: currentOrder.id,
          status: currentOrder.status as OrderStatus,
          assigned_to: null,
          assigned_at: null
        }
      };
    }

    if (
      assignmentAction === "release" &&
      currentOrder.assigned_to &&
      currentOrder.assigned_to !== adminContext.user.id
    ) {
      return { error: "Solo podes liberar un pedido que esta a tu cargo." };
    }

    const nextAssignment =
      assignmentAction === "claim"
        ? {
            assigned_to: adminContext.user.id,
            assigned_at: new Date().toISOString()
          }
        : {
            assigned_to: null,
            assigned_at: null
          };

    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update(nextAssignment)
      .eq("id", orderId)
      .eq("business_id", adminContext.businessId)
      .select("id, status, assigned_to, assigned_at")
      .maybeSingle();

    if (updateError) {
      logSupabaseActionError("assignment", "updateOrderAssignmentAction.update", {
        orderId,
        assigneeId: nextAssignment.assigned_to ?? null
      }, updateError);
      throw new Error("No pudimos actualizar el responsable.");
    }

    if (!updatedOrder) {
      console.error("[order-mutation:assignment:empty-update]", {
        action: "updateOrderAssignmentAction",
        orderId,
        assignmentAction,
        message: "Update returned no row"
      });
      return { error: "Este pedido ya no existe o pertenece a otro negocio." };
    }

    let event: AdminOrderTimelineEvent | null = null;

    try {
      const eventRow = await createOrderEvent({
        businessId: adminContext.businessId,
        orderId,
        actorProfileId: adminContext.user.id,
        eventType: assignmentAction === "claim" ? "assignment_taken" : "assignment_released",
        payload:
          assignmentAction === "claim"
            ? {
                assigned_to: adminContext.user.id,
                previous_assigned_to: currentOrder.assigned_to ?? null
              }
            : {
                released_from: currentOrder.assigned_to ?? null
              }
      });

      event = eventRow
        ? presentOrderTimelineEvent(eventRow, adminContext.user.email ?? null)
        : null;
    } catch (eventError) {
      logActionFailure("orders.updateAssignment.event", eventError, {
        businessId: adminContext.businessId,
        orderId,
        assignmentAction
      });
    }

    return {
      success: true,
      changed: true,
      event,
      order: {
        id: updatedOrder.id,
        status: updatedOrder.status as OrderStatus,
        assigned_to: updatedOrder.assigned_to ?? null,
        assigned_at: updatedOrder.assigned_at ?? null
      }
    };
  } catch (error) {
    logSupabaseActionError("assignment", "updateOrderAssignmentAction", {
      orderId,
      assignmentAction
    }, error);
    logActionFailure("orders.updateAssignment", error, {
      orderId,
      assignmentAction
    });
    return { error: getActionErrorMessage(error, "No pudimos actualizar el responsable.") };
  }
}

function getTrimmedString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}
