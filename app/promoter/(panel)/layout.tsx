import type { ReactNode } from "react";
import { PromoterShell } from "@/components/promoter/promoter-shell";
import { labelPromoterStatus } from "@/lib/commercial/promoters/portfolio-summary";
import { requirePromoterPrincipal } from "@/lib/commercial/promoters/require-promoter-principal";

export default async function PromoterPanelLayout({ children }: { children: ReactNode }) {
  const session = await requirePromoterPrincipal();
  return (
    <PromoterShell
      legalName={session.legal_name ?? "Promotor"}
      statusLabel={labelPromoterStatus(session.status)}
      separated={session.status === "separated"}
    >
      {children}
    </PromoterShell>
  );
}
