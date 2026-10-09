import Link from "next/link";
import { requireCommercialPrincipal } from "@/lib/commercial/auth/require-commercial-principal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "@/components/commercial/opportunity-board.module.css";

type OpportunityCard = {
  id: string;
  stage: string;
  display_name: string;
};

export default async function CommercialOpportunitiesPage() {
  await requireCommercialPrincipal();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("list_open_opportunities");
  const payload = (data ?? {}) as { opportunities?: OpportunityCard[] };
  const opportunities = Array.isArray(payload.opportunities) ? payload.opportunities : [];

  return (
    <main className={styles.page}>
      <section className={styles.list}>
        <h1>Oportunidades</h1>
        {opportunities.length === 0 ? <p className={styles.meta}>No hay oportunidades abiertas.</p> : null}
        {opportunities.map((opportunity) => (
          <article key={opportunity.id} className={styles.card}>
            <Link href={`/commercial/opportunities/${opportunity.id}`}>
              <strong>{opportunity.display_name}</strong>
              <p className={styles.meta}>{opportunity.stage}</p>
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
