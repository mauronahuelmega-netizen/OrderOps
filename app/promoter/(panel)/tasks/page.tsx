import { savePromoterTask } from "@/app/promoter/actions";
import { requirePromoterPrincipal } from "@/lib/commercial/promoters/require-promoter-principal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "@/components/promoter/promoter-panel.module.css";

type Task = { id?: string; title?: string; status?: string; due_at?: string | null };
type Overview = { tasks?: Task[]; opportunities?: { id?: string }[] };

export default async function PromoterTasksPage() {
  const session = await requirePromoterPrincipal();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("promoter_overview");
  const overview = (data ?? {}) as Overview;
  const now = Date.now();
  const tasks = overview.tasks ?? [];
  const today = tasks.filter((task) => task.due_at && new Date(task.due_at).toDateString() === new Date(now).toDateString());
  const overdue = tasks.filter((task) => task.due_at && new Date(task.due_at).getTime() < now && task.status === "open");
  const upcoming = tasks.filter((task) => task.due_at && new Date(task.due_at).getTime() > now);
  return (
    <section className={styles.card}>
      <h1>Tareas</h1>
      <h2>Hoy</h2>
      <ul>{today.map((task) => <li key={task.id}>{task.title}</li>)}</ul>
      <h2>Próximas</h2>
      <ul>{upcoming.map((task) => <li key={task.id}>{task.title}</li>)}</ul>
      <h2>Vencidas</h2>
      <ul>{overdue.map((task) => <li key={task.id}>{task.title}</li>)}</ul>
      <form action={savePromoterTask} className={styles.form}>
        <input name="opportunityId" placeholder="Oportunidad" defaultValue={overview.opportunities?.[0]?.id} disabled={!session.can_operate} />
        <input name="title" placeholder="Título" disabled={!session.can_operate} />
        <input name="dueAt" type="datetime-local" disabled={!session.can_operate} />
        <button type="submit" disabled={!session.can_operate}>
          Crear tarea
        </button>
      </form>
    </section>
  );
}
