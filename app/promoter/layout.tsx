import type { ReactNode } from "react";
import Link from "next/link";
import { requirePromoterPrincipal } from "@/lib/commercial/promoters/require-promoter-principal";
import styles from "@/components/promoter/promoter-panel.module.css";

export default async function PromoterLayout({ children }: { children: ReactNode }) {
  const session = await requirePromoterPrincipal();
  return (
    <div className={styles.shell}>
      <header>
        <p>{session.legal_name}</p>
        <p className={styles.muted}>{session.status}</p>
        <nav className={styles.nav}>
          <Link href="/promoter">Inicio</Link>
          <Link href="/promoter/businesses">Comercios</Link>
          <Link href="/promoter/opportunities">Oportunidades</Link>
          <Link href="/promoter/claims">Reclamaciones</Link>
          <Link href="/promoter/tasks">Tareas</Link>
          <Link href="/promoter/profile">Perfil</Link>
        </nav>
      </header>
      {children}
    </div>
  );
}
