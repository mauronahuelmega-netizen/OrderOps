import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { listAuthorizedAreas } from "@/lib/auth/list-authorized-areas";
import { loginPathWith } from "@/lib/auth/login-path";
import { resolveLoginDestination } from "@/lib/auth/resolve-login-destination";
import type { Database } from "@/types/database";

/**
 * Destination after login for authenticated users.
 * Delegates to universal area resolution (admin, promoter, commercial, finance, superadmin).
 */
export async function resolvePostLoginPath(
  supabase: SupabaseClient<Database, "public">,
  userId: string,
  next?: string | null
): Promise<string> {
  const areas = await listAuthorizedAreas(supabase, userId);
  const destination = resolveLoginDestination({ areas, next });

  if (destination.kind === "redirect") {
    return destination.href;
  }

  if (destination.kind === "choose") {
    return loginPathWith({ choose: true, next: next ?? null });
  }

  return loginPathWith({ error: "no_access" });
}
