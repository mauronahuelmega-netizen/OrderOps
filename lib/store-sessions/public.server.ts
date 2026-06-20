import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";

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

export async function isBusinessAcceptingPublicOrders(businessId: string): Promise<boolean> {
  const supabase = createSupabaseServiceClient();
  const { data: activeSession, error: sessionError } = await supabase
    .from("store_sessions")
    .select("id")
    .eq("business_id", businessId)
    .eq("status", "open")
    .is("closed_at", null)
    .maybeSingle();

  if (sessionError) {
    if (isMissingStoreSessionsTableError(sessionError)) {
      const { data: settings } = await supabase
        .from("business_settings")
        .select("on_demand_mode_active")
        .eq("business_id", businessId)
        .maybeSingle();

      return settings?.on_demand_mode_active ?? false;
    }

    console.error("[store-sessions:public] active session lookup failed", {
      businessId,
      code: sessionError.code,
      message: sessionError.message
    });

    return false;
  }

  return Boolean(activeSession);
}
