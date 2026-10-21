import type { ReactNode } from "react";
import { requireCommercialPrincipal } from "@/lib/commercial/auth/require-commercial-principal";

export default async function CommercialLayout({ children }: { children: ReactNode }) {
  await requireCommercialPrincipal();
  return children;
}
