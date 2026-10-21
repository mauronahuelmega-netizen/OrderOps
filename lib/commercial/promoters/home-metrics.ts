import { groupOpenTasks, type TaskLike } from "@/lib/commercial/promoters/portfolio-summary";

const CLOSED_STAGES = new Set(["won", "lost"]);

export function greetingName(legalName: string | null | undefined) {
  const name = legalName?.trim();
  return name ? name : null;
}

export function greetingPrefixByHour(hour: number) {
  if (hour >= 5 && hour < 13) return "Buen día";
  if (hour >= 13 && hour < 20) return "Buenas tardes";
  return "Buenas noches";
}

export function greetingText(legalName: string | null | undefined, now: Date) {
  const prefix = greetingPrefixByHour(now.getHours());
  const name = greetingName(legalName);
  return name ? `${prefix}, ${name}` : prefix;
}

export function openOpportunityCount(opportunities: Array<{ stage?: string }>) {
  return opportunities.filter((opportunity) => opportunity.stage && !CLOSED_STAGES.has(opportunity.stage)).length;
}

export function pendingTaskCounts<T extends TaskLike>(tasks: T[], now: Date) {
  const groups = groupOpenTasks(tasks, now);
  return {
    groups,
    pending: groups.today.length + groups.upcoming.length + groups.overdue.length,
    overdue: groups.overdue.length
  };
}
