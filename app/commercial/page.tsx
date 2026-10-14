import { redirect } from "next/navigation";
import { requireCommercialArea } from "@/lib/commercial/auth/require-commercial-principal";

export default async function CommercialIndexPage() {
  const session = await requireCommercialArea();
  const roles = session.roles ?? [];
  const financeOnly = roles.includes("finance") && !roles.includes("commercial") && !roles.includes("superadmin");
  redirect(financeOnly ? "/commercial/settlements" : "/commercial/opportunities");
}
