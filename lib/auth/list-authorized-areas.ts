import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  areasFromAccessFacts,
  type AuthorizedArea
} from "@/lib/auth/authorized-areas";
import type { Database } from "@/types/database";

type CommercialSession = {
  ok?: boolean;
  kind?: string;
  roles?: string[];
};

type PromoterSession = {
  ok?: boolean;
};

/**
 * Resolve authorized areas for a user using real server-side session sources.
 * Does not call require* guards (no redirect / forbidden side effects).
 */
export async function listAuthorizedAreas(
  supabase: SupabaseClient<Database, "public">,
  userId: string
): Promise<AuthorizedArea[]> {
  const [{ data: profile }, commercialResult, promoterResult] = await Promise.all([
    supabase.from("profiles").select("business_id, role").eq("id", userId).maybeSingle(),
    supabase.rpc("commercial_session"),
    supabase.rpc("promoter_session")
  ]);

  const commercialSession = (commercialResult.data ?? null) as CommercialSession | null;
  const commercialRoles =
    commercialSession?.ok === true &&
    commercialSession.kind === "internal" &&
    Array.isArray(commercialSession.roles)
      ? commercialSession.roles
      : [];

  const promoterSession = (promoterResult.data ?? null) as PromoterSession | null;

  return areasFromAccessFacts({
    hasBusinessAdmin: Boolean(profile?.business_id),
    isProfileSuperAdmin: profile?.role === "super_admin",
    commercialRoles,
    isPromoter: promoterSession?.ok === true
  });
}
