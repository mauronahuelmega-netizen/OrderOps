import Link from "next/link";
import { requirePromoterPrincipal } from "@/lib/commercial/promoters/require-promoter-principal";
import { labelOpportunityStage } from "@/lib/commercial/promoters/portfolio-summary";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "@/components/promoter/promoter-panel.module.css";

type Opportunity = { id?: string; stage?: string; business_id?: string };
type Overview = {
  ok?: boolean;
  businesses?: Array<{ id?: string; display_name?: string }>;
  opportunities?: Opportunity[];
};

const STAGES = ["new", "contacting", "qualified", "demo_scheduled", "demo_done", "follow_up", "lost"] as const;

export default async function PromoterOpportunitiesPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; etapa?: string }>;
}) {
  await requirePromoterPrincipal();
  const params = await searchParams;
  const query = (params.q ?? "").trim().toLocaleLowerCase("es");
  const stage = params.etapa ?? "";
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("promoter_overview");
  const overview = (data ?? null) as Overview | null;
  const overviewReady = overview?.ok === true;
  const names = new Map((overview?.businesses ?? []).map((business) => [business.id, business.display_name]));
  const opportunities = (overviewReady ? (overview.opportunities ?? []) : []).filter((opportunity) => {
    const name = (names.get(opportunity.business_id ?? "") ?? "").toLocaleLowerCase("es");
    if (query && !name.includes(query)) return false;
    if (stage && opportunity.stage !== stage) return false;
    return true;
  });

  return (
    <section className={styles.card}>
      <h1>Oportunidades</h1>
      <form className={styles.filters} method="get">
        <label>
          Nombre
          <input name="q" defaultValue={params.q ?? ""} />
        </label>
        <label>
          Etapa
          <select name="etapa" defaultValue={stage}>
            <option value="">Todas</option>
            {STAGES.map((item) => (
              <option key={item} value={item}>{labelOpportunityStage(item)}</option>
            ))}
          </select>
        </label>
        <button type="submit">Filtrar</button>
      </form>
      {!overviewReady ? <p className={styles.muted} role="alert">No se pudieron cargar las oportunidades.</p> : null}
      {overviewReady && opportunities.length === 0 ? <p className={styles.muted}>No hay oportunidades para esta búsqueda.</p> : null}
      <ul className={styles.list}>
        {opportunities.map((opportunity) => (
          <li key={opportunity.id} className={styles.row}>
            <strong>{names.get(opportunity.business_id ?? "") ?? "Comercio sin nombre"}</strong>
            <p className={styles.muted}>{labelOpportunityStage(opportunity.stage)}</p>
            {opportunity.id ? <Link href={`/promoter/opportunities/${opportunity.id}`}>Abrir ficha</Link> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
