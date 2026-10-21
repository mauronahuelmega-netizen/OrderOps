import { redirect } from "next/navigation";
import { requireCommercialArea } from "@/lib/commercial/auth/require-commercial-principal";

/**
 * Shared Gestión Comercial entry. Same shell for commercial and finance roles;
 * first module follows effective permissions (board before finance-only home).
 */
export default async function CommercialIndexPage() {
  const session = await requireCommercialArea();
  const roles = session.roles ?? [];
  const canReadBoard = roles.includes("commercial") || roles.includes("superadmin");
  redirect(canReadBoard ? "/commercial/opportunities" : "/commercial/settlements");
}
