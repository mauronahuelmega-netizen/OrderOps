import Link from "next/link";
import styles from "./commercial-area-nav.module.css";

export function CommercialAreaNav({ roles }: { roles: string[] }) {
  const canReadBoard = roles.includes("commercial") || roles.includes("superadmin");
  const canOpenSettlements = canReadBoard || roles.includes("finance");
  const canOperateBilling = roles.includes("finance");

  return (
    <nav className={styles.bar} aria-label="Gestión Comercial">
      <Link href="/commercial" className={styles.brand}>
        Gestión Comercial
      </Link>
      {canReadBoard ? <Link href="/commercial/opportunities">Oportunidades</Link> : null}
      {canOpenSettlements ? <Link href="/commercial/settlements">Liquidaciones</Link> : null}
      {canOperateBilling ? <Link href="/commercial/billing">Cobranzas</Link> : null}
    </nav>
  );
}
