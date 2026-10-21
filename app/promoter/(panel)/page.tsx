import Link from "next/link";
import { ArrowUpRight, CalendarDays, ListTodo, Store, Target } from "lucide-react";
import { HomeGreeting } from "@/components/promoter/home-greeting";
import { WelcomeGuide } from "@/components/promoter/welcome-guide";
import { requirePromoterPrincipal } from "@/lib/commercial/promoters/require-promoter-principal";
import { buildPortfolio } from "@/lib/commercial/promoters/portfolio-summary";
import { greetingName, openOpportunityCount, pendingTaskCounts } from "@/lib/commercial/promoters/home-metrics";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "./home.module.css";

type Task = {
  id?: string;
  title?: string;
  status?: string;
  due_at?: string | null;
  opportunity_id?: string;
};

type Overview = {
  ok?: boolean;
  businesses?: Array<{ id?: string; display_name?: string }>;
  opportunities?: Array<{ id?: string; stage?: string; business_id?: string }>;
  claims?: Array<{ status?: string; business_id?: string }>;
  tasks?: Task[];
};

const TASK_TIME_ZONE = "America/Argentina/Buenos_Aires";

function formatHomeDate(now: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: TASK_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(now);
}

function formatTaskWhen(value: string | null | undefined) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: TASK_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export default async function PromoterHomePage() {
  const session = await requirePromoterPrincipal();
  const supabase = await createSupabaseServerClient();
  const [{ data }, preferenceResult] = await Promise.all([
    supabase.rpc("promoter_overview"),
    supabase.rpc("read_own_welcome_preference")
  ]);
  const overview = (data ?? null) as Overview | null;
  const preference = (preferenceResult.data ?? null) as { ok?: boolean; welcome_dismissed_at?: string | null } | null;
  const preferenceReady = preferenceResult.error == null && preference?.ok === true;
  const overviewReady = overview?.ok === true;
  const now = new Date();
  const portfolio = overviewReady
    ? buildPortfolio({
        businesses: overview.businesses ?? [],
        opportunities: overview.opportunities ?? [],
        claims: overview.claims ?? []
      })
    : [];
  const tasks = overviewReady ? pendingTaskCounts(overview.tasks ?? [], now) : null;
  const openOpportunities = overviewReady ? openOpportunityCount(overview.opportunities ?? []) : null;
  const names = new Map((overview?.businesses ?? []).map((business) => [business.id, business.display_name?.trim() || "Comercio sin nombre"]));
  const opportunityBusiness = new Map(
    (overview?.opportunities ?? []).map((opportunity) => [opportunity.id, names.get(opportunity.business_id) ?? "Comercio sin nombre"])
  );
  const name = greetingName(session.legal_name);
  const hasOverdueTasks = Boolean(tasks && tasks.overdue > 0);
  const steps = [
    { label: "Tu código de promotor está disponible", done: Boolean(session.public_code) },
    { label: "Hay al menos un comercio en la cartera", done: portfolio.length > 0 },
    { label: "Hay al menos una oportunidad", done: overviewReady && (overview.opportunities?.length ?? 0) > 0 },
    { label: "Hay una tarea abierta", done: tasks !== null && tasks.pending > 0 }
  ];

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <p className={styles.date}>
          <CalendarDays className={styles.icon} aria-hidden="true" />
          <time dateTime={now.toISOString()}>{formatHomeDate(now)}</time>
        </p>
        <HomeGreeting
          name={name}
          className={styles.greetingPending}
          readyClassName={styles.greetingReady}
        />
        <p className={styles.lead}>Este es el resumen de tu actividad comercial</p>
      </header>

      <section className={styles.section} aria-label="Resumen comercial">
        {!overviewReady ? <p role="alert">No se pudo cargar el resumen comercial.</p> : null}
        <div className={styles.metrics}>
          <Link className={styles.card} href="/promoter/businesses">
            <div className={styles.metricTop}>
              <span className={styles.metricTitle}>Comercios en cartera</span>
              <span className={`${styles.metricBadge} ${styles.badgeViolet}`} aria-hidden="true">
                <Store className={styles.icon} />
              </span>
            </div>
            <strong>{overviewReady ? portfolio.length : "—"}</strong>
            <span className={`${styles.lead} ${styles.metricLeadOptional}`}>
              {overviewReady && portfolio.length === 1 ? "Comercio asociado a tu actividad comercial" : "Comercios asociados a tu actividad comercial"}
            </span>
          </Link>
          <Link className={styles.card} href="/promoter/opportunities">
            <div className={styles.metricTop}>
              <span className={styles.metricTitle}>Oportunidades abiertas</span>
              <span className={`${styles.metricBadge} ${styles.badgeBlue}`} aria-hidden="true">
                <Target className={styles.icon} />
              </span>
            </div>
            <strong>{openOpportunities ?? "—"}</strong>
            <span className={`${styles.lead} ${styles.metricLeadOptional}`}>
              {openOpportunities === 1 ? "Oportunidad que todavía requiere seguimiento comercial" : "Oportunidades que todavía requieren seguimiento comercial"}
            </span>
          </Link>
          <Link className={`${styles.card} ${styles.cardTasks}`} href="/promoter/tasks">
            <div className={styles.metricTop}>
              <span className={styles.metricTitle}>Tareas pendientes</span>
              <span
                className={`${styles.metricBadge} ${hasOverdueTasks ? styles.badgeAmber : styles.badgeNeutral}`}
                aria-hidden="true"
              >
                <ListTodo className={styles.icon} />
              </span>
            </div>
            <strong>{tasks ? tasks.pending : "—"}</strong>
            <span className={styles.lead}>
              {tasks ? `${tasks.overdue} ${tasks.overdue === 1 ? "vencida" : "vencidas"}, dentro de ese total` : "La lectura de tareas no está disponible"}
            </span>
          </Link>
        </div>
      </section>

      <section className={`${styles.section} ${styles.prioritiesSection}`}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionTitleGroup}>
            <h2>Prioridades</h2>
            <p>Tus tareas y próximos seguimientos</p>
          </div>
          <Link className={styles.agenda} href="/promoter/tasks">
            Ver la agenda
            <ArrowUpRight className={styles.icon} aria-hidden="true" />
          </Link>
        </div>
        {!tasks ? <p role="alert">No se pudieron cargar las prioridades.</p> : null}
        {tasks ? (
          <div className={styles.priorities}>
            <div className={styles.priorityMain}>
              <PriorityBlock
                title="Tareas vencidas"
                empty="No hay tareas vencidas."
                tasks={tasks.groups.overdue}
                opportunityBusiness={opportunityBusiness}
                emphasis={tasks.groups.overdue.length > 0}
              />
            </div>
            <div className={styles.priorityStack}>
              <PriorityBlock
                title="Tareas de hoy"
                empty="No hay tareas para hoy."
                tasks={tasks.groups.today}
                opportunityBusiness={opportunityBusiness}
              />
              <PriorityBlock
                title="Próximos seguimientos"
                empty="No hay seguimientos próximos."
                tasks={tasks.groups.upcoming}
                opportunityBusiness={opportunityBusiness}
              />
            </div>
          </div>
        ) : null}
      </section>

      <section className={styles.section} aria-label="Accesos rápidos">
        <nav className={styles.links} aria-label="Accesos rápidos">
          <Link className={styles.linkCard} href="/promoter/tasks">
            <span className={styles.navItemMain}>
              <span className={`${styles.navIconWrap} ${styles.navIconBlue}`} aria-hidden="true">
                <ListTodo className={styles.icon} />
              </span>
              <span className={styles.navLabel}>Tareas</span>
            </span>
            <ArrowUpRight className={styles.affordance} aria-hidden="true" />
          </Link>
          <Link className={styles.linkCard} href="/promoter/businesses">
            <span className={styles.navItemMain}>
              <span className={`${styles.navIconWrap} ${styles.navIconViolet}`} aria-hidden="true">
                <Store className={styles.icon} />
              </span>
              <span className={styles.navLabel}>Mis comercios</span>
            </span>
            <ArrowUpRight className={styles.affordance} aria-hidden="true" />
          </Link>
          <Link className={styles.linkCard} href="/promoter/opportunities">
            <span className={styles.navItemMain}>
              <span className={`${styles.navIconWrap} ${styles.navIconBlue}`} aria-hidden="true">
                <Target className={styles.icon} />
              </span>
              <span className={styles.navLabel}>Oportunidades</span>
            </span>
            <ArrowUpRight className={styles.affordance} aria-hidden="true" />
          </Link>
        </nav>
      </section>

      <WelcomeGuide
        readOk={preferenceReady}
        dismissedAt={preferenceReady ? preference?.welcome_dismissed_at ?? null : null}
        steps={steps}
      />
    </section>
  );
}

function PriorityBlock({
  title,
  empty,
  tasks,
  opportunityBusiness,
  emphasis = false
}: {
  title: string;
  empty: string;
  tasks: Task[];
  opportunityBusiness: Map<string | undefined, string>;
  emphasis?: boolean;
}) {
  const isEmpty = tasks.length === 0;
  const blockClass = [
    styles.block,
    isEmpty ? styles.blockEmpty : undefined,
    emphasis && !isEmpty ? styles.overdue : undefined
  ].filter(Boolean).join(" ");

  return (
    <article className={blockClass}>
      <div className={styles.blockHead}>
        <h3>{title}</h3>
      </div>
      {isEmpty ? <p className={styles.emptyText}>{empty}</p> : null}
      {!isEmpty ? (
        <ul className={styles.taskList}>
          {tasks.map((task) => {
            const businessName = opportunityBusiness.get(task.opportunity_id) ?? "Comercio sin nombre";
            const whenText = formatTaskWhen(task.due_at);
            return (
              <li key={task.id}>
                <Link className={styles.task} href="/promoter/tasks">
                  <div className={styles.taskPrimary}>
                    <strong>{task.title}</strong>
                    <span className={styles.taskBusiness}>{businessName}</span>
                  </div>
                  <span className={styles.taskWhen}>{whenText}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </article>
  );
}
