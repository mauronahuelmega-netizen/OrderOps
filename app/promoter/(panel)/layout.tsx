import type { ReactNode } from "react";
import Link from "next/link";
import { promoterLogoutAction } from "@/app/promoter/login/actions";
import { requirePromoterPrincipal } from "@/lib/commercial/promoters/require-promoter-principal";
import styles from "@/components/promoter/promoter-panel.module.css";

export default async function PromoterPanelLayout({ children }: { children: ReactNode }) {
  const session = await requirePromoterPrincipal();
  return (
    <div className={styles.shell}>
      <header>
        <p>{session.legal_name}</p>
        <p className={styles.muted}>{session.status}</p>
        <nav className={styles.nav} aria-label="Portal de promotores">
          <Link href="/promoter">Inicio</Link>
          <Link href="/promoter/businesses">Comercios</Link>
          <Link href="/promoter/onboarding">Asistencia</Link>
          <Link href="/promoter/opportunities">Oportunidades</Link>
          <Link href="/promoter/claims">Reclamaciones</Link>
          <Link href="/promoter/tasks">Tareas</Link>
          <Link href="/promoter/profile">Perfil</Link>
        </nav>
        <form action={promoterLogoutAction}>
          <button type="submit">Cerrar sesión</button>
        </form>
      </header>
      {children}
    </div>
  );
}
