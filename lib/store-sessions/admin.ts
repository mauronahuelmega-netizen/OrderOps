import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { StoreSession } from "@/lib/orders/analytics";
import {
  ORDER_CREATION_GUARD_MESSAGES,
  ORDER_MUTATION_GUARD_MESSAGES,
  type ActiveSessionCreationGuardResult,
  type ActiveSessionMutationGuardResult,
  type OrderMutationGuardOrder
} from "@/lib/store-sessions/types";

export type {
  ActiveSessionCreationGuardResult,
  ActiveSessionMutationGuardResult,
  OrderCreationErrorCode,
  OrderMutationErrorCode,
  OrderMutationGuardOrder
} from "@/lib/store-sessions/types";

export {
  ORDER_CREATION_GUARD_MESSAGES,
  ORDER_MUTATION_GUARD_MESSAGES,
  SESSION_MUTATION_BLOCKED_CODES
} from "@/lib/store-sessions/types";

function isOrderWithinActiveSession(order: OrderMutationGuardOrder, session: StoreSession) {
  if (order.store_session_id) {
    return order.store_session_id === session.id;
  }

  const orderCreatedAt = new Date(order.created_at).getTime();
  const sessionOpenedAt = new Date(session.openedAt).getTime();

  if (Number.isNaN(orderCreatedAt) || Number.isNaN(sessionOpenedAt)) {
    return false;
  }

  return orderCreatedAt >= sessionOpenedAt;
}

async function resolveOpenActiveStoreSession(businessId: string): Promise<StoreSession | null> {
  const activeSession = await getActiveStoreSession(businessId);

  if (!activeSession || activeSession.status !== "open" || activeSession.closedAt != null) {
    return null;
  }

  return activeSession;
}

export async function assertActiveStoreSessionForOrderCreation(input: {
  businessId: string;
}): Promise<ActiveSessionCreationGuardResult> {
  try {
    const session = await resolveOpenActiveStoreSession(input.businessId);

    if (!session) {
      return {
        ok: false,
        reason: "NO_ACTIVE_SESSION",
        message: ORDER_CREATION_GUARD_MESSAGES.NO_ACTIVE_SESSION
      };
    }

    return { ok: true, session };
  } catch (error) {
    console.error("[store-sessions] assertActiveStoreSessionForOrderCreation failed", {
      businessId: input.businessId,
      error
    });

    return {
      ok: false,
      reason: "UNKNOWN",
      message: "No pudimos validar la sesi\u00f3n activa."
    };
  }
}

export async function assertActiveStoreSessionForOrderMutation(input: {
  businessId: string;
  order: OrderMutationGuardOrder;
}): Promise<ActiveSessionMutationGuardResult> {
  if (input.order.business_id && input.order.business_id !== input.businessId) {
    return {
      ok: false,
      reason: "UNAUTHORIZED",
      message: ORDER_MUTATION_GUARD_MESSAGES.UNAUTHORIZED
    };
  }

  const activeSession = await resolveOpenActiveStoreSession(input.businessId);

  if (!activeSession) {
    console.error("[store-session-guard:error]", {
      action: "assertActiveStoreSessionForOrderMutation",
      orderId: input.order.id,
      code: "NO_ACTIVE_SESSION",
      message: ORDER_MUTATION_GUARD_MESSAGES.NO_ACTIVE_SESSION
    });
    return {
      ok: false,
      reason: "NO_ACTIVE_SESSION",
      message: ORDER_MUTATION_GUARD_MESSAGES.NO_ACTIVE_SESSION
    };
  }

  if (!isOrderWithinActiveSession(input.order, activeSession)) {
    console.error("[store-session-guard:error]", {
      action: "assertActiveStoreSessionForOrderMutation",
      orderId: input.order.id,
      code: "ORDER_OUTSIDE_ACTIVE_SESSION",
      message: ORDER_MUTATION_GUARD_MESSAGES.ORDER_OUTSIDE_ACTIVE_SESSION
    });
    return {
      ok: false,
      reason: "ORDER_OUTSIDE_ACTIVE_SESSION",
      message: ORDER_MUTATION_GUARD_MESSAGES.ORDER_OUTSIDE_ACTIVE_SESSION
    };
  }

  return { ok: true, session: activeSession };
}

function isMissingStoreSessionsTableError(error: { code?: string; message?: string } | null) {
  if (!error) {
    return false;
  }

  const normalizedMessage = (error.message ?? "").toLowerCase();

  return (
    error.code === "PGRST205" ||
    normalizedMessage.includes("could not find the table 'public.store_sessions'") ||
    normalizedMessage.includes("relation \"store_sessions\" does not exist") ||
    normalizedMessage.includes("schema cache")
  );
}

function mapStoreSessionRow(row: {
  id: string;
  business_id: string;
  opened_at: string;
  closed_at: string | null;
  status: "open" | "closed";
}) {
  const session: StoreSession = {
    id: row.id,
    storeId: row.business_id,
    openedAt: row.opened_at,
    closedAt: row.closed_at,
    status: row.status
  };

  return session;
}

export async function getActiveStoreSession(businessId: string): Promise<StoreSession | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("store_sessions")
    .select("id, business_id, opened_at, closed_at, status")
    .eq("business_id", businessId)
    .eq("status", "open")
    .is("closed_at", null)
    .order("opened_at", { ascending: false })
    .maybeSingle();

  if (error) {
    if (isMissingStoreSessionsTableError(error)) {
      console.warn("[store-sessions] fallback to business window: store_sessions table missing", {
        businessId,
        code: error.code,
        message: error.message
      });
      return null;
    }

    console.error("[store-session-guard:error]", {
      action: "getActiveStoreSession",
      code: error.code,
      message: error.message,
      details: "details" in error ? error.details : undefined,
      hint: "hint" in error ? error.hint : undefined,
      status: "status" in error ? error.status : undefined
    });
    throw new Error(`Failed to load active store session: ${error.message}`);
  }

  return data ? mapStoreSessionRow(data) : null;
}

export async function getLastClosedStoreSession(businessId: string): Promise<StoreSession | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("store_sessions")
    .select("id, business_id, opened_at, closed_at, status")
    .eq("business_id", businessId)
    .eq("status", "closed")
    .not("closed_at", "is", null)
    .order("closed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isMissingStoreSessionsTableError(error)) {
      console.warn("[store-sessions] fallback without last closed session: store_sessions table missing", {
        businessId,
        code: error.code,
        message: error.message
      });
      return null;
    }

    throw new Error(`Failed to load last closed store session: ${error.message}`);
  }

  return data ? mapStoreSessionRow(data) : null;
}

export type OnDemandModeSyncResult = {
  active: boolean;
  hasOpenStoreSession: boolean;
};

async function countOpenStoreSessions(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  businessId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("store_sessions")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("status", "open")
    .is("closed_at", null);

  if (error) {
    if (isMissingStoreSessionsTableError(error)) {
      throw new Error("La migracion de sesiones todavia no esta aplicada.");
    }

    console.error("[store-sessions] countOpenStoreSessions failed", {
      businessId,
      code: error.code,
      message: error.message
    });
    throw new Error("No pudimos validar las sesiones abiertas del negocio.");
  }

  return count ?? 0;
}

async function writeOnDemandModeActive(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  businessId: string,
  active: boolean
) {
  const { data, error } = await supabase
    .from("business_settings")
    .update({ on_demand_mode_active: active, updated_at: new Date().toISOString() })
    .eq("business_id", businessId)
    .select("business_id, on_demand_mode_active")
    .maybeSingle();

  if (error || !data) {
    console.error("[store-sessions] writeOnDemandModeActive failed", {
      businessId,
      active,
      error
    });
    throw new Error(
      active
        ? "No pudimos activar el modo On-Demand del negocio."
        : "No pudimos desactivar el modo On-Demand del negocio."
    );
  }

  if (data.on_demand_mode_active !== active) {
    throw new Error(
      active
        ? "No pudimos activar el modo On-Demand del negocio."
        : "No pudimos desactivar el modo On-Demand del negocio."
    );
  }
}

/**
 * Derives business_settings.on_demand_mode_active from whether any
 * store_sessions row is currently open. Idempotent; safe after open/close.
 */
export async function reconcileOnDemandModeActiveFromSessions(
  businessId: string
): Promise<OnDemandModeSyncResult> {
  const supabase = await createSupabaseServerClient();
  const openCount = await countOpenStoreSessions(supabase, businessId);
  const active = openCount > 0;

  await writeOnDemandModeActive(supabase, businessId, active);

  return {
    active,
    hasOpenStoreSession: active
  };
}

export async function openStoreSession(input: {
  businessId: string;
  actorUserId: string;
}): Promise<StoreSession> {
  const supabase = await createSupabaseServerClient();
  const existingSession = await getActiveStoreSession(input.businessId);

  if (existingSession) {
    const sync = await reconcileOnDemandModeActiveFromSessions(input.businessId);

    if (!sync.active) {
      throw new Error("No pudimos activar el modo On-Demand del negocio.");
    }

    return existingSession;
  }

  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("store_sessions")
    .insert({
      business_id: input.businessId,
      opened_at: nowIso,
      opened_by: input.actorUserId,
      status: "open",
      updated_at: nowIso
    })
    .select("id, business_id, opened_at, closed_at, status")
    .maybeSingle();

  if (isMissingStoreSessionsTableError(error)) {
    throw new Error("La migracion de sesiones todavia no esta aplicada.");
  }

  if (error || !data) {
    throw new Error("No pudimos abrir la sesion del negocio.");
  }

  try {
    const sync = await reconcileOnDemandModeActiveFromSessions(input.businessId);

    if (!sync.active) {
      throw new Error("No pudimos activar el modo On-Demand del negocio.");
    }
  } catch (syncError) {
    console.error("[store-sessions] openStoreSession sync failed after insert", {
      businessId: input.businessId,
      sessionId: data.id,
      syncError
    });

    const rollbackNow = new Date().toISOString();
    const { error: rollbackError } = await supabase
      .from("store_sessions")
      .update({
        closed_at: rollbackNow,
        closed_by: input.actorUserId,
        status: "closed",
        updated_at: rollbackNow
      })
      .eq("id", data.id)
      .eq("business_id", input.businessId)
      .eq("status", "open");

    if (rollbackError) {
      console.error("[store-sessions] openStoreSession rollback failed", {
        businessId: input.businessId,
        sessionId: data.id,
        rollbackError
      });
    }

    throw syncError instanceof Error
      ? syncError
      : new Error("No pudimos activar el modo On-Demand del negocio.");
  }

  return mapStoreSessionRow(data);
}

export async function closeStoreSession(input: {
  businessId: string;
  sessionId: string;
  actorUserId: string;
}): Promise<StoreSession | null> {
  const supabase = await createSupabaseServerClient();
  const { data: currentSession, error: currentSessionError } = await supabase
    .from("store_sessions")
    .select("id, business_id, opened_at, closed_at, status")
    .eq("id", input.sessionId)
    .eq("business_id", input.businessId)
    .maybeSingle();

  if (currentSessionError) {
    if (isMissingStoreSessionsTableError(currentSessionError)) {
      throw new Error("La migracion de sesiones todavia no esta aplicada.");
    }

    throw new Error("No pudimos cargar la sesion activa.");
  }

  if (!currentSession) {
    throw new Error("La sesion ya no existe o pertenece a otro negocio.");
  }

  if (currentSession.status !== "open" || currentSession.closed_at) {
    await reconcileOnDemandModeActiveFromSessions(input.businessId);
    return mapStoreSessionRow(currentSession);
  }

  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("store_sessions")
    .update({
      closed_at: nowIso,
      closed_by: input.actorUserId,
      status: "closed",
      updated_at: nowIso
    })
    .eq("id", input.sessionId)
    .eq("business_id", input.businessId)
    .eq("status", "open")
    .is("closed_at", null)
    .select("id, business_id, opened_at, closed_at, status")
    .maybeSingle();

  if (isMissingStoreSessionsTableError(error)) {
    throw new Error("La migracion de sesiones todavia no esta aplicada.");
  }

  if (error) {
    throw new Error("No pudimos cerrar la sesion del negocio.");
  }

  const sync = await reconcileOnDemandModeActiveFromSessions(input.businessId);

  if (sync.hasOpenStoreSession) {
    console.warn("[store-sessions] closeStoreSession left other open sessions active", {
      businessId: input.businessId,
      closedSessionId: input.sessionId
    });
  }

  return data ? mapStoreSessionRow(data) : null;
}
