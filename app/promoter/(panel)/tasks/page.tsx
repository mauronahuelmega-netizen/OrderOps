import Link from "next/link";
import { savePromoterTask, updatePromoterTask } from "@/app/promoter/actions";
import { PendingButton } from "@/components/promoter/pending-button";
import { requirePromoterPrincipal } from "@/lib/commercial/promoters/require-promoter-principal";
import { groupOpenTasks } from "@/lib/commercial/promoters/portfolio-summary";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "@/components/promoter/promoter-panel.module.css";

type Task = {
  id?: string;
  title?: string;
  status?: string;
  due_at?: string | null;
  opportunity_id?: string;
};
type Overview = { ok?: boolean; tasks?: Task[]; opportunities?: { id?: string }[] };

function localInput(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default async function PromoterTasksPage({
  searchParams
}: {
  searchParams: Promise<{ estado?: string; notice?: string; q?: string }>;
}) {
  const session = await requirePromoterPrincipal();
  const params = await searchParams;
  const cancelled = params.estado === "canceladas";
  const query = (params.q ?? "").trim().toLocaleLowerCase("es");
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("promoter_overview");
  const overview = (data ?? null) as Overview | null;
  const overviewReady = overview?.ok === true;
  const tasks = overviewReady ? (overview.tasks ?? []) : [];
  const visible = tasks.filter((task) => {
    if (query && !(task.title ?? "").toLocaleLowerCase("es").includes(query)) return false;
    return cancelled ? task.status === "cancelled" : task.status === "open";
  });
  const grouped = cancelled ? null : groupOpenTasks(visible, new Date());
  const notice = params.notice === "saved"
    ? "La tarea quedó confirmada."
    : params.notice === "error"
      ? "La tarea no se confirmó."
      : null;

  return (
    <section className={styles.card}>
      <h1>Tareas</h1>
      <p className={styles.muted}>La tarea guarda título, fecha y hora. No tiene un campo de nota.</p>
      {notice ? <p role="status">{notice}</p> : null}
      <form className={styles.filters} method="get">
        <label>
          Título
          <input name="q" defaultValue={params.q ?? ""} />
        </label>
        <label>
          Agenda
          <select name="estado" defaultValue={cancelled ? "canceladas" : "activas"}>
            <option value="activas">Activas</option>
            <option value="canceladas">Canceladas</option>
          </select>
        </label>
        <button type="submit">Filtrar</button>
      </form>
      {!overviewReady ? <p className={styles.muted} role="alert">No se pudieron cargar las tareas.</p> : null}
      {overviewReady && visible.length === 0 ? <p className={styles.muted}>No hay tareas en esta vista.</p> : null}
      {grouped ? (
        <>
          <TaskGroup title="Hoy" tasks={grouped.today} canOperate={session.can_operate === true} />
          <TaskGroup title="Próximas" tasks={grouped.upcoming} canOperate={session.can_operate === true} />
          <TaskGroup title="Vencidas" tasks={grouped.overdue} canOperate={session.can_operate === true} />
        </>
      ) : (
        <ul className={styles.list}>
          {visible.map((task) => (
            <li key={task.id}>{task.title}</li>
          ))}
        </ul>
      )}
      <h2>Nueva tarea</h2>
      <form action={savePromoterTask} className={styles.form}>
        <label>
          Oportunidad
          <select name="opportunityId" defaultValue={overview?.opportunities?.[0]?.id} disabled={!session.can_operate}>
            {(overview?.opportunities ?? []).map((opportunity) => (
              <option key={opportunity.id} value={opportunity.id}>{opportunity.id}</option>
            ))}
          </select>
        </label>
        <input name="title" placeholder="Título" disabled={!session.can_operate} />
        <input name="dueAt" type="datetime-local" disabled={!session.can_operate} />
        <PendingButton disabled={!session.can_operate}>Crear tarea</PendingButton>
      </form>
      <p><Link href="/promoter/opportunities">Ver oportunidades</Link></p>
    </section>
  );
}

function TaskGroup({ title, tasks, canOperate }: { title: string; tasks: Task[]; canOperate: boolean }) {
  return (
    <section>
      <h2>{title}</h2>
      {tasks.length === 0 ? <p className={styles.muted}>Sin tareas.</p> : null}
      <ul className={styles.list}>
        {tasks.map((task) => (
          <li key={task.id} className={styles.row}>
            <strong>{task.title}</strong>
            <p className={styles.muted}>{task.due_at ?? "Sin fecha"}</p>
            {task.opportunity_id ? <Link href={`/promoter/opportunities/${task.opportunity_id}`}>Abrir oportunidad</Link> : null}
            <form action={updatePromoterTask} className={styles.form}>
              <input type="hidden" name="taskId" value={task.id} />
              <input type="hidden" name="opportunityId" value={task.opportunity_id} />
              <input type="hidden" name="title" value={task.title ?? ""} />
              <input type="hidden" name="status" value="done" />
              <input type="hidden" name="dueAt" value={task.due_at ?? ""} />
              <PendingButton disabled={!canOperate} pendingLabel="Confirmando…">Completar</PendingButton>
            </form>
            <form action={updatePromoterTask} className={styles.form}>
              <input type="hidden" name="taskId" value={task.id} />
              <input type="hidden" name="opportunityId" value={task.opportunity_id} />
              <input type="hidden" name="title" value={task.title ?? ""} />
              <input type="hidden" name="status" value="cancelled" />
              <input type="hidden" name="dueAt" value={task.due_at ?? ""} />
              <PendingButton disabled={!canOperate} pendingLabel="Confirmando…">Cancelar</PendingButton>
            </form>
            <form action={updatePromoterTask} className={styles.form}>
              <input type="hidden" name="taskId" value={task.id} />
              <input type="hidden" name="opportunityId" value={task.opportunity_id} />
              <input type="hidden" name="title" value={task.title ?? ""} />
              <input type="hidden" name="status" value="open" />
              <input name="dueAt" type="datetime-local" defaultValue={localInput(task.due_at)} disabled={!canOperate} />
              <PendingButton disabled={!canOperate} pendingLabel="Confirmando…">Reprogramar</PendingButton>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}
