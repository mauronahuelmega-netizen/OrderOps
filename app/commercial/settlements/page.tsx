import { requireCommercialPrincipal } from "@/lib/commercial/auth/require-commercial-principal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "@/components/commercial/opportunity-board.module.css";

type SettlementRow = {
  id: string;
  period_key: string;
  status: string;
  total_cents: number;
  due_on: string;
};

export default async function CommercialSettlementsPage() {
  await requireCommercialPrincipal();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .schema("commercial")
    .from("promoter_settlements")
    .select("id, period_key, status, total_cents, due_on")
    .order("period_key", { ascending: false });
  const settlements = (data ?? []) as SettlementRow[];

  return (
    <main className={styles.page}>
      <section className={styles.list}>
        <h1>Liquidaciones</h1>
        {settlements.length === 0 ? <p className={styles.meta}>No hay liquidaciones.</p> : null}
        {settlements.map((settlement) => (
          <article key={settlement.id} className={styles.card}>
            <strong>{settlement.period_key}</strong>
            <p className={styles.meta}>
              {settlement.status} · {settlement.total_cents} centavos · vence {settlement.due_on}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
