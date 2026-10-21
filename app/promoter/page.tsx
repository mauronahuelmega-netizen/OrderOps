import { requirePromoterPrincipal } from "@/lib/commercial/promoters/require-promoter-principal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "@/components/promoter/promoter-panel.module.css";

type Overview = {
  businesses?: unknown[];
  opportunities?: unknown[];
  claims?: unknown[];
  tasks?: unknown[];
};

export default async function PromoterHomePage() {
  await requirePromoterPrincipal();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("promoter_overview");
  const overview = (data ?? {}) as Overview;
  return (
    <section className={styles.card}>
      <h1>Inicio</h1>
      <p>Comercios: {overview.businesses?.length ?? 0}</p>
      <p>Oportunidades: {overview.opportunities?.length ?? 0}</p>
      <p>Reclamaciones: {overview.claims?.length ?? 0}</p>
      <p>Tareas: {overview.tasks?.length ?? 0}</p>
      <p className={styles.muted}>Onboarding: disponible en una fase posterior.</p>
      <p className={styles.muted}>Comisiones: disponible en una fase posterior.</p>
      <p className={styles.muted}>Liquidaciones: disponible en una fase posterior.</p>
    </section>
  );
}
