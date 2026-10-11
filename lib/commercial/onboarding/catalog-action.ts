import "server-only";

import { getAdminContext } from "@/lib/admin/context";
import { hasAdminPermission } from "@/lib/admin/permissions";
import { promoterCatalogDecision } from "@/lib/commercial/onboarding/catalog-guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const promoterCatalogRejectedMessage =
  "No se puede guardar: la operación incluye precio, stock, disponibilidad o SKU.";

export type PromoterCatalogGate =
  | { kind: "admin" }
  | { kind: "promoter" }
  | { kind: "deny"; error: string }
  | { kind: "continue" };

export async function promoterCatalogGate(fields: readonly string[]): Promise<PromoterCatalogGate> {
  const admin = await getAdminContext();
  if (admin && hasAdminPermission(admin.profile.role, "manageProducts")) {
    return { kind: "admin" };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return { kind: "continue" };
  }

  const { data } = await supabase.rpc("promoter_session");
  const session = data as { ok?: boolean } | null;
  if (session?.ok !== true) {
    return { kind: "continue" };
  }

  if (promoterCatalogDecision(fields) === "reject") {
    return { kind: "deny", error: promoterCatalogRejectedMessage };
  }

  return { kind: "promoter" };
}
