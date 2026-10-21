import Link from "next/link";
import { notFound } from "next/navigation";
import { addPromoterNote, movePromoterOpportunity, requestPromoterClaim } from "@/app/promoter/actions";
import { PendingButton } from "@/components/promoter/pending-button";
import { requirePromoterPrincipal } from "@/lib/commercial/promoters/require-promoter-principal";
import { labelOpportunityStage } from "@/lib/commercial/promoters/portfolio-summary";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "@/components/promoter/promoter-panel.module.css";

type Opportunity = { id?: string; stage?: string; business_id?: string };
type Task = { id?: string; title?: string; status?: string; due_at?: string | null; opportunity_id?: string };
type Overview = {
  ok?: boolean;
  businesses?: Array<{ id?: string; display_name?: string }>;
  opportunities?: Opportunity[];
  tasks?: Task[];
};

const NOTICES: Record<string, string> = {
  noted: "La nota quedó guardada.",
  saved: "El cambio quedó confirmado.",
  error: "La operación no se confirmó."
};

export default async function PromoterOpportunityPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const session = await requirePromoterPrincipal();
  const { id } = await params;
  const notice = (await searchParams).notice;
  const supabase = await createSupabaseServerClient();
  const [{ data }, notesResult] = await Promise.all([
    supabase.rpc("promoter_overview"),
    supabase.rpc("list_own_opportunity_notes", { p_opportunity_id: id })
  ]);
  const overview = (data ?? null) as Overview | null;
  if (overview?.ok !== true) {
    return <section className={styles.card}><p className={styles.muted} role="alert">No se pudo cargar la oportunidad.</p></section>;
  }
  const notes = (notesResult.data ?? null) as { ok?: boolean; notes?: Array<{ id?: string; body?: string; occurred_at?: string }> } | null;
  const notesReady = notesResult.error == null && notes?.ok === true;
  const opportunity = (overview.opportunities ?? []).find((item) => item.id === id);
  if (!opportunity) notFound();
  const name = (overview.businesses ?? []).find((business) => business.id === opportunity.business_id)?.display_name ?? "Comercio sin nombre";
  const tasks = (overview.tasks ?? []).filter((task) => task.opportunity_id === id);

  return (
    <section className={styles.card}>
      <p><Link href="/promoter/opportunities">Volver a oportunidades</Link></p>
      <h1>{name}</h1>
      <p>Etapa: {labelOpportunityStage(opportunity.stage)}</p>
      {notice && NOTICES[notice] ? <p role="status">{NOTICES[notice]}</p> : null}
      <h2>Tareas relacionadas</h2>
      {tasks.length === 0 ? <p className={styles.muted}>No hay tareas vinculadas en esta lectura.</p> : null}
      <ul className={styles.list}>
        {tasks.map((task) => (
          <li key={task.id}>{task.title} · {task.status}</li>
        ))}
      </ul>
      <h2>Notas</h2>
      {!notesReady ? <p className={styles.muted} role="alert">No se pudieron cargar las notas.</p> : null}
      {notesReady && (notes?.notes ?? []).length === 0 ? <p className={styles.muted}>No hay notas en esta oportunidad.</p> : null}
      {notesReady ? (
        <ul className={styles.list}>
          {(notes?.notes ?? []).map((note) => (
            <li key={note.id}>{note.body}</li>
          ))}
        </ul>
      ) : null}
      {notesReady ? (
        <form action={addPromoterNote} className={styles.form}>
          <input type="hidden" name="opportunityId" value={id} />
          <textarea name="body" placeholder="Nota" disabled={!session.can_operate} />
          <PendingButton disabled={!session.can_operate}>Guardar nota</PendingButton>
        </form>
      ) : null}
      <h2>Etapa</h2>
      <form action={movePromoterOpportunity} className={styles.form}>
        <input type="hidden" name="opportunityId" value={id} />
        <select name="toStage" disabled={!session.can_operate} defaultValue="contacting">
          <option value="contacting">Contactar</option>
          <option value="qualified">Calificada</option>
          <option value="demo_scheduled">Demo agendada</option>
          <option value="demo_done">Demo hecha</option>
          <option value="follow_up">Seguimiento</option>
          <option value="lost">Perdida</option>
        </select>
        <input name="reason" placeholder="Motivo si se pierde" disabled={!session.can_operate} />
        <PendingButton disabled={!session.can_operate}>Cambiar etapa</PendingButton>
      </form>
      <form action={requestPromoterClaim}>
        <input type="hidden" name="opportunityId" value={id} />
        <input type="hidden" name="businessId" value={opportunity.business_id} />
        <PendingButton disabled={!session.can_operate}>Pedir reclamación</PendingButton>
      </form>
    </section>
  );
}
