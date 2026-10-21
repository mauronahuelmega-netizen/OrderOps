import type { ReactNode } from "react";
import { CommercialAreaNav } from "@/components/commercial/commercial-area-nav";
import { requireCommercialArea } from "@/lib/commercial/auth/require-commercial-principal";

export default async function CommercialLayout({ children }: { children: ReactNode }) {
  const session = await requireCommercialArea();
  return (
    <>
      <CommercialAreaNav roles={session.roles ?? []} />
      {children}
    </>
  );
}
