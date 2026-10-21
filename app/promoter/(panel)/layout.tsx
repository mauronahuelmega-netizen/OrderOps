import { Suspense, type ReactNode } from "react";
import { PromoterShell } from "@/components/promoter/promoter-shell";
import styles from "@/components/promoter/promoter-panel.module.css";
import { labelPromoterStatus } from "@/lib/commercial/promoters/portfolio-summary";
import { requirePromoterPrincipal } from "@/lib/commercial/promoters/require-promoter-principal";

export default async function PromoterPanelLayout({ children }: { children: ReactNode }) {
  const session = await requirePromoterPrincipal();
  return (
    <Suspense fallback={<div className={styles.frame} />}>
      <PromoterShell
        accountKey={session.promoter_id ?? ""}
        legalName={session.legal_name ?? "Promotor"}
        statusLabel={labelPromoterStatus(session.status)}
        separated={session.status === "separated"}
        readOnly={session.status !== "separated" && session.can_operate !== true}
      >
        {children}
      </PromoterShell>
    </Suspense>
  );
}
