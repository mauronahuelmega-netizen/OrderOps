"use server";

import { revalidatePath } from "next/cache";
import { getActionErrorMessage, logActionFailure } from "@/lib/admin/action-errors";
import { getAdminContext, requireAdminPermission } from "@/lib/admin/context";
import {
  closeStoreSession,
  getActiveStoreSession,
  getLastClosedStoreSession,
  openStoreSession,
  reconcileOnDemandModeActiveFromSessions
} from "@/lib/store-sessions/admin";
import type { StoreSession } from "@/lib/orders/analytics";

type ToggleBusinessStatusResult = {
  error?: string;
  onDemandModeActive?: boolean;
  success?: boolean;
};

type StoreSessionActionResult = {
  error?: string;
  session?: StoreSession | null;
  success?: boolean;
};

type StoreSessionHydrationActionResult = {
  ok: boolean;
  reason?: "unauthorized" | "error";
  session: StoreSession | null;
  lastClosedSession: StoreSession | null;
};

function revalidateStoreSessionPaths(businessSlug: string | null) {
  revalidatePath("/admin/dashboard");

  if (!businessSlug) {
    return;
  }

  revalidatePath(`/b/${businessSlug}`, "layout");
  revalidatePath(`/b/${businessSlug}/catalogo`);
  revalidatePath(`/b/${businessSlug}/checkout`);
}

export async function toggleBusinessStatus(
  active: boolean
): Promise<ToggleBusinessStatusResult> {
  try {
    const adminContext = await requireAdminPermission("managePublicSettings");

    let onDemandModeActive = false;

    if (active) {
      await openStoreSession({
        businessId: adminContext.businessId,
        actorUserId: adminContext.user.id
      });
      onDemandModeActive = true;
    } else {
      const activeSession = await getActiveStoreSession(adminContext.businessId);

      if (activeSession) {
        await closeStoreSession({
          businessId: adminContext.businessId,
          sessionId: activeSession.id,
          actorUserId: adminContext.user.id
        });
      }

      const sync = await reconcileOnDemandModeActiveFromSessions(adminContext.businessId);
      onDemandModeActive = sync.active;
    }

    revalidateStoreSessionPaths(adminContext.businessSlug);

    return {
      success: true,
      onDemandModeActive
    };
  } catch (error) {
    logActionFailure("dashboard.toggleBusinessStatus", error, { active });
    return {
      error: getActionErrorMessage(
        error,
        active
          ? "No pudimos abrir el negocio para recibir pedidos."
          : "No pudimos cerrar el negocio para nuevos pedidos."
      )
    };
  }
}

export async function getActiveStoreSessionHydrationAction(): Promise<StoreSessionHydrationActionResult> {
  try {
    const adminContext = await getAdminContext();

    if (!adminContext) {
      return {
        ok: false,
        reason: "unauthorized",
        session: null,
        lastClosedSession: null
      };
    }

    const [session, lastClosedSession] = await Promise.all([
      getActiveStoreSession(adminContext.businessId),
      getLastClosedStoreSession(adminContext.businessId)
    ]);

    return {
      ok: true,
      session,
      lastClosedSession
    };
  } catch (error) {
    logActionFailure("dashboard.getActiveStoreSessionHydration", error);
    return {
      ok: false,
      reason: "error",
      session: null,
      lastClosedSession: null
    };
  }
}

export async function getActiveStoreSessionAction(): Promise<StoreSessionActionResult> {
  try {
    const adminContext = await getAdminContext();

    if (!adminContext) {
      return {
        error: "No pudimos cargar la sesion activa.",
        session: null
      };
    }

    const session = await getActiveStoreSession(adminContext.businessId);

    return { success: true, session };
  } catch (error) {
    logActionFailure("dashboard.getActiveStoreSession", error);
    return {
      error: getActionErrorMessage(error, "No pudimos cargar la sesion activa."),
      session: null
    };
  }
}

export async function openStoreSessionAction(): Promise<StoreSessionActionResult> {
  try {
    const adminContext = await requireAdminPermission("managePublicSettings");
    const session = await openStoreSession({
      businessId: adminContext.businessId,
      actorUserId: adminContext.user.id
    });

    revalidateStoreSessionPaths(adminContext.businessSlug);
    return { success: true, session };
  } catch (error) {
    logActionFailure("dashboard.openStoreSession", error);
    return {
      error: getActionErrorMessage(error, "No pudimos abrir la sesion del negocio.")
    };
  }
}

export async function closeStoreSessionAction(
  sessionId: string
): Promise<StoreSessionActionResult> {
  if (!sessionId) {
    return { error: "Falta identificar la sesion activa." };
  }

  try {
    const adminContext = await requireAdminPermission("managePublicSettings");
    const session = await closeStoreSession({
      businessId: adminContext.businessId,
      sessionId,
      actorUserId: adminContext.user.id
    });

    revalidateStoreSessionPaths(adminContext.businessSlug);
    return { success: true, session };
  } catch (error) {
    logActionFailure("dashboard.closeStoreSession", error, { sessionId });
    return {
      error: getActionErrorMessage(error, "No pudimos cerrar la sesion del negocio.")
    };
  }
}
