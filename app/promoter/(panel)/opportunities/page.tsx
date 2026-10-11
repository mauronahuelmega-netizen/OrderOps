import { addPromoterNote, movePromoterOpportunity, requestPromoterClaim } from "@/app/promoter/actions";
import { requirePromoterPrincipal } from "@/lib/commercial/promoters/require-promoter-principal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "@/components/promoter/promoter-panel.module.css";

type Opportunity = { id?: string; stage?: string; business_id?: string };
type Overview = { opportunities?: Opportunity[] };

export default async function PromoterOpportunitiesPage() {
  const session = await requirePromoterPrincipal();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("promoter_overview");
  const opportunities = ((data ?? {}) as Overview).opportunities ?? [];
  return (
    <section className={styles.card}>
      <h1>Oportunidades</h1>
      {opportunities.map((opportunity) => (
        <article key={opportunity.id}>
          <p>
            {opportunity.stage} · {opportunity.id}
          </p>
          <form action={addPromoterNote} className={styles.form}>
            <input type="hidden" name="opportunityId" value={opportunity.id} />
            <textarea name="body" placeholder="Nota" disabled={!session.can_operate} />
            <button type="submit" disabled={!session.can_operate}>
              Guardar nota
            </button>
          </form>
          <form action={movePromoterOpportunity} className={styles.form}>
            <input type="hidden" name="opportunityId" value={opportunity.id} />
            <select name="toStage" disabled={!session.can_operate}>
              <option value="contacting">Contactar</option>
              <option value="qualified">Calificada</option>
              <option value="demo_scheduled">Demo agendada</option>
              <option value="demo_done">Demo hecha</option>
              <option value="follow_up">Seguimiento</option>
              <option value="lost">Perdida</option>
            </select>
            <input name="reason" placeholder="Motivo si se pierde" disabled={!session.can_operate} />
            <button type="submit" disabled={!session.can_operate}>
              Cambiar etapa
            </button>
          </form>
          <form action={requestPromoterClaim}>
            <input type="hidden" name="opportunityId" value={opportunity.id} />
            <input type="hidden" name="businessId" value={opportunity.business_id} />
            <button type="submit" disabled={!session.can_operate}>
              Pedir reclamación
            </button>
          </form>
        </article>
      ))}
    </section>
  );
}
