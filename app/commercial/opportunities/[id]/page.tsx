import { notFound } from "next/navigation";
import { completeCommercialTask, moveOpportunityStage } from "@/app/commercial/opportunities/actions";
import { requireCommercialPrincipal } from "@/lib/commercial/auth/require-commercial-principal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "@/components/commercial/opportunity-board.module.css";

type ContactRow = { id: string; full_name: string; role_label: string | null };
type InteractionRow = { id: string; kind: string; origin: string; occurred_at: string };
type TaskRow = { id: string; title: string; status: string; due_at: string | null };
type OpportunityDetail = {
  id: string;
  stage: string;
  display_name: string;
  contacts: ContactRow[];
  interactions: InteractionRow[];
  tasks: TaskRow[];
};

const nextStages = ["contacting", "qualified", "demo_scheduled", "demo_done", "follow_up", "lost"] as const;

function taskBucket(task: TaskRow, now: Date): "today" | "upcoming" | "overdue" | "other" {
  if (task.status !== "open" || !task.due_at) return "other";
  const due = new Date(task.due_at);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  if (due < start) return "overdue";
  if (due > end) return "upcoming";
  return "today";
}

export default async function CommercialOpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  await requireCommercialPrincipal();
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("opportunity_detail", { p_opportunity_id: id });
  const opportunity = ((data ?? {}) as { opportunity?: OpportunityDetail | null }).opportunity;
  if (!opportunity) notFound();

  const now = new Date();
  const groups = {
    today: opportunity.tasks.filter((task) => taskBucket(task, now) === "today"),
    upcoming: opportunity.tasks.filter((task) => taskBucket(task, now) === "upcoming"),
    overdue: opportunity.tasks.filter((task) => taskBucket(task, now) === "overdue")
  };

  return (
    <main className={styles.page}>
      <section className={styles.detail}>
        <h1>{opportunity.display_name}</h1>
        <p className={styles.meta}>{opportunity.stage}</p>
        <section className={styles.panel}>
          <h2>Contactos</h2>
          {opportunity.contacts.map((contact) => (
            <p key={contact.id}>{contact.full_name}{contact.role_label ? ` · ${contact.role_label}` : ""}</p>
          ))}
        </section>
        <section className={styles.panel}>
          <h2>Interacciones</h2>
          {opportunity.interactions.map((interaction) => (
            <p key={interaction.id}>
              {interaction.kind} <span className={styles.origin}>origen {interaction.origin}</span>
            </p>
          ))}
        </section>
        <section className={styles.groups}>
          {(["today", "upcoming", "overdue"] as const).map((bucket) => (
            <section key={bucket} className={styles.panel}>
              <h2>{bucket === "today" ? "Hoy" : bucket === "upcoming" ? "Próximas" : "Vencidas"}</h2>
              {groups[bucket].map((task) => (
                <form key={task.id} action={completeCommercialTask}>
                  <input type="hidden" name="opportunityId" value={opportunity.id} />
                  <input type="hidden" name="taskId" value={task.id} />
                  <input type="hidden" name="title" value={task.title} />
                  <span>{task.title}</span>
                  <button type="submit">Completar</button>
                </form>
              ))}
            </section>
          ))}
        </section>
        <form className={styles.actions} action={moveOpportunityStage}>
          <input type="hidden" name="opportunityId" value={opportunity.id} />
          <input name="reason" placeholder="Motivo si se pierde" />
          {nextStages.map((stage) => (
            <button key={stage} type="submit" name="toStage" value={stage}>{stage}</button>
          ))}
        </form>
      </section>
    </main>
  );
}
