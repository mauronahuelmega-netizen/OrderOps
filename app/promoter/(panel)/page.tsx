import Link from "next/link";
import { requirePromoterPrincipal } from "@/lib/commercial/promoters/require-promoter-principal";
import {
  buildPortfolio,
  groupOpenTasks,
  labelClaimStatus,
  labelOpportunityStage,
  labelPromoterStatus,
  labelSettlementStatus,
  summarizeSettlementStatuses
} from "@/lib/commercial/promoters/portfolio-summary";
import { formatArsFromCents } from "@/lib/commercial/money";
import { loadSettlementWorkspace } from "@/lib/commercial/settlements/load-workspace";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "@/components/promoter/promoter-panel.module.css";

type Overview = {
  ok?: boolean;
  businesses?: Array<{ id?: string; display_name?: string }>;
  opportunities?: Array<{ id?: string; stage?: string; business_id?: string }>;
  claims?: Array<{ id?: string; status?: string; business_id?: string }>;
  tasks?: Array<{ id?: string; title?: string; status?: string; due_at?: string | null }>;
};

export default async function PromoterHomePage() {
  const session = await requirePromoterPrincipal();
  const supabase = await createSupabaseServerClient();
  const [{ data }, loaded] = await Promise.all([
    supabase.rpc("promoter_overview"),
    loadSettlementWorkspace(supabase)
  ]);
  const overview = (data ?? null) as Overview | null;
  const overviewReady = overview?.ok === true;
  const portfolio = overviewReady
    ? buildPortfolio({
        businesses: overview.businesses ?? [],
        opportunities: overview.opportunities ?? [],
        claims: overview.claims ?? []
      })
    : [];
  const tasks = overviewReady ? groupOpenTasks(overview.tasks ?? [], new Date()) : null;
  const settlements = loaded.ok ? summarizeSettlementStatuses(loaded.workspace.settlements) : [];
  const openTaskCount = tasks ? tasks.today.length + tasks.upcoming.length + tasks.overdue.length : 0;
  const steps = [
    { label: "Tu código de promotor está disponible", done: Boolean(session.public_code) },
    { label: "Hay al menos un comercio en la cartera", done: portfolio.length > 0 },
    { label: "Hay al menos una oportunidad", done: (overview?.opportunities?.length ?? 0) > 0 },
    { label: "Hay una tarea abierta", done: openTaskCount > 0 }
  ];

  return (
    <section className={styles.card}>
      <h1>Inicio</h1>
      <p>Estado: {labelPromoterStatus(session.status)}</p>
      <p className={styles.muted}>
        {session.can_operate
          ? "Esta cuenta puede operar su cartera comercial."
          : "Esta cuenta no opera comercialmente hasta estar activa."}
      </p>

      <h2>Primeros pasos</h2>
      <p className={styles.muted}>
        El avance sale del estado real de la cuenta. El cierre de esta guía todavía no se guarda.
      </p>
      <ul>
        {steps.map((step) => (
          <li key={step.label}>{step.done ? "Listo" : "Pendiente"} · {step.label}</li>
        ))}
      </ul>
      <p>
        <Link href="/promoter/profile">Perfil</Link>
        {" · "}
        <Link href="/promoter/resources">Recursos</Link>
        {" · "}
        <Link href="/promoter/businesses">Cartera</Link>
      </p>

      <h2>Cartera</h2>
      {!overviewReady ? <p className={styles.muted} role="alert">No se pudo cargar la cartera.</p> : null}
      {overviewReady && portfolio.length === 0 ? <p className={styles.muted}>No hay comercios en la cartera.</p> : null}
      {portfolio.map((business) => (
        <article key={business.id} className={styles.row}>
          <strong>{business.displayName}</strong>
          <p className={styles.muted}>
            Oportunidades: {business.stages.length > 0 ? business.stages.map(labelOpportunityStage).join(", ") : "sin oportunidad visible"}
          </p>
          <p className={styles.muted}>
            Reclamaciones: {business.claimStatuses.length > 0 ? business.claimStatuses.map(labelClaimStatus).join(", ") : "sin reclamación visible"}
          </p>
        </article>
      ))}

      <h2>Tareas abiertas</h2>
      {!tasks ? <p className={styles.muted} role="alert">No se pudieron cargar las tareas.</p> : null}
      {tasks ? (
        <p className={styles.muted}>
          Hoy {tasks.today.length} · Próximas {tasks.upcoming.length} · Vencidas {tasks.overdue.length}
        </p>
      ) : null}
      <p><Link href="/promoter/tasks">Ver tareas</Link></p>

      <h2>Liquidaciones</h2>
      <p className={styles.muted}>
        Las comisiones individuales no se listan en esta lectura. Los estados de abajo son los de las liquidaciones visibles para esta cuenta.
      </p>
      {!loaded.ok ? <p className={styles.muted} role="alert">No se pudieron cargar las liquidaciones.</p> : null}
      {loaded.ok && settlements.length === 0 ? <p className={styles.muted}>No hay liquidaciones.</p> : null}
      {settlements.map((settlement) => (
        <p key={settlement.status} className={styles.muted}>
          {labelSettlementStatus(settlement.status)} · {settlement.count} · {formatArsFromCents(settlement.totalCents)}
        </p>
      ))}
      <p><Link href="/promoter/settlements">Ver ingresos</Link></p>
    </section>
  );
}
