import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { computeOrderAcceptanceActive } from "@/lib/store-sessions/acceptance";

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

/**
 * Public order acceptance aligned with create_order:
 * requires on_demand_mode_active=true, and an open store session when the
 * sessions table is available. Prevents UI false-positives when sessions are
 * open but the column RPC checks is still false.
 */
export async function isBusinessAcceptingPublicOrders(businessId: string): Promise<boolean> {
  const supabase = createSupabaseServiceClient();

  const { data: settings, error: settingsError } = await supabase
    .from("business_settings")
    .select("on_demand_mode_active")
    .eq("business_id", businessId)
    .maybeSingle();

  if (settingsError) {
    console.error("[store-sessions:public] settings lookup failed", {
      businessId,
      code: settingsError.code,
      message: settingsError.message
    });
    return false;
  }

  const onDemandModeActive = settings?.on_demand_mode_active ?? false;

  if (!onDemandModeActive) {
    return false;
  }

  const { data: activeSession, error: sessionError } = await supabase
    .from("store_sessions")
    .select("id")
    .eq("business_id", businessId)
    .eq("status", "open")
    .is("closed_at", null)
    .maybeSingle();

  if (sessionError) {
    if (isMissingStoreSessionsTableError(sessionError)) {
      return computeOrderAcceptanceActive({
        onDemandModeActive,
        hasOpenStoreSession: null
      });
    }

    console.error("[store-sessions:public] active session lookup failed", {
      businessId,
      code: sessionError.code,
      message: sessionError.message
    });

    return false;
  }

  return computeOrderAcceptanceActive({
    onDemandModeActive,
    hasOpenStoreSession: Boolean(activeSession)
  });
}
