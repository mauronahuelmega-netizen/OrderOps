import type { ReactNode } from "react";
import { requireCommercialArea } from "@/lib/commercial/auth/require-commercial-principal";

export default async function CommercialLayout({ children }: { children: ReactNode }) {
  await requireCommercialArea();
  return children;
}
