import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type CommercialSession = {
  ok?: boolean;
  kind?: string;
  roles?: string[];
};

/**
 * Destination after /admin/login for authenticated users.
 * Business admins → dashboard; platform commercial roles → commercial area.
 */
export async function resolvePostLoginPath(
  supabase: SupabaseClient<Database, "public">,
  userId: string
): Promise<string> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("business_id")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.business_id) {
    return "/admin/dashboard";
  }

  const { data } = await supabase.rpc("commercial_session");
  const session = (data ?? null) as CommercialSession | null;
  const roles = Array.isArray(session?.roles) ? session.roles : [];
  const internal =
    session?.ok === true && session.kind === "internal" && roles.length > 0;

  if (!internal) {
    return "/admin/login?error=invalid_credentials";
  }

  if (roles.includes("superadmin")) {
    return "/super-admin";
  }

  const financeOnly =
    roles.includes("finance") && !roles.includes("commercial") && !roles.includes("superadmin");
  if (financeOnly) {
    return "/commercial/billing";
  }

  if (roles.includes("commercial") || roles.includes("finance")) {
    return "/commercial/opportunities";
  }

  return "/admin/login?error=invalid_credentials";
}
