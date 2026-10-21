export type PortfolioBusiness = {
  id: string;
  displayName: string;
  stages: string[];
  claimStatuses: string[];
};

export type TaskLike = {
  status?: string;
  due_at?: string | null;
};

export type TaskBucket = "today" | "upcoming" | "overdue" | "other";

export type SettlementStatusTotal = {
  status: string;
  count: number;
  totalCents: number;
};

const STAGE_LABELS: Record<string, string> = {
  new: "Nueva",
  contacting: "Contactar",
  qualified: "Calificada",
  demo_scheduled: "Demo agendada",
  demo_done: "Demo hecha",
  follow_up: "Seguimiento",
  won: "Ganada",
  lost: "Perdida"
};

const CLAIM_LABELS: Record<string, string> = {
  provisional: "Provisional",
  expired: "Vencida",
  rejected: "Rechazada",
  confirmed: "Confirmada",
  superseded: "Reemplazada"
};

const SETTLEMENT_LABELS: Record<string, string> = {
  draft: "Borrador",
  approved: "Aprobada",
  invoiced: "Facturada",
  payable: "Pagable",
  partially_paid: "Pago parcial",
  paid: "Pagada",
  void: "Anulada",
  invalidated: "Invalidada",
  reconciliation_required: "Conciliación manual"
};

const PROMOTER_STATUS_LABELS: Record<string, string> = {
  registered: "Registrado",
  pending_verification: "Pendiente de verificación",
  active: "Activo",
  suspended: "Suspendido",
  separated: "Desvinculado"
};

const SETTLEMENT_ORDER = [
  "draft",
  "approved",
  "invoiced",
  "payable",
  "partially_paid",
  "paid",
  "void",
  "invalidated",
  "reconciliation_required"
];

function knownLabel(table: Record<string, string>, value: string | undefined): string {
  if (!value) return "Sin dato";
  return table[value] ?? value;
}

export function labelOpportunityStage(stage: string | undefined): string {
  return knownLabel(STAGE_LABELS, stage);
}

export function labelClaimStatus(status: string | undefined): string {
  return knownLabel(CLAIM_LABELS, status);
}

export function labelSettlementStatus(status: string | undefined): string {
  return knownLabel(SETTLEMENT_LABELS, status);
}

export function labelPromoterStatus(status: string | undefined): string {
  return knownLabel(PROMOTER_STATUS_LABELS, status);
}

function ensureBusiness(rows: Map<string, PortfolioBusiness>, id: string): PortfolioBusiness {
  const existing = rows.get(id);
  if (existing) return existing;
  const created: PortfolioBusiness = {
    id,
    displayName: "Comercio sin nombre",
    stages: [],
    claimStatuses: []
  };
  rows.set(id, created);
  return created;
}

export function buildPortfolio(input: {
  businesses: Array<{ id?: string; display_name?: string }>;
  opportunities: Array<{ stage?: string; business_id?: string }>;
  claims: Array<{ status?: string; business_id?: string }>;
}): PortfolioBusiness[] {
  const rows = new Map<string, PortfolioBusiness>();

  for (const business of input.businesses) {
    if (!business.id) continue;
    const row = ensureBusiness(rows, business.id);
    const name = business.display_name?.trim();
    if (name) row.displayName = name;
  }

  for (const opportunity of input.opportunities) {
    if (!opportunity.business_id || !opportunity.stage) continue;
    const row = ensureBusiness(rows, opportunity.business_id);
    if (!row.stages.includes(opportunity.stage)) row.stages.push(opportunity.stage);
  }

  for (const claim of input.claims) {
    if (!claim.business_id || !claim.status) continue;
    const row = ensureBusiness(rows, claim.business_id);
    if (!row.claimStatuses.includes(claim.status)) row.claimStatuses.push(claim.status);
  }

  return [...rows.values()];
}

export function taskBucket(task: TaskLike, now: Date): TaskBucket {
  if (task.status !== "open" || !task.due_at) return "other";
  const due = new Date(task.due_at);
  if (Number.isNaN(due.getTime())) return "other";
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  if (due < start) return "overdue";
  if (due > end) return "upcoming";
  return "today";
}

export function groupOpenTasks<T extends TaskLike>(tasks: T[], now: Date): {
  today: T[];
  upcoming: T[];
  overdue: T[];
} {
  const groups: { today: T[]; upcoming: T[]; overdue: T[] } = { today: [], upcoming: [], overdue: [] };
  for (const task of tasks) {
    const bucket = taskBucket(task, now);
    if (bucket === "today" || bucket === "upcoming" || bucket === "overdue") groups[bucket].push(task);
  }
  return groups;
}

export function summarizeSettlementStatuses(
  settlements: Array<{ status?: string; total_cents?: number }>
): SettlementStatusTotal[] {
  const totals = new Map<string, SettlementStatusTotal>();
  for (const settlement of settlements) {
    const status = settlement.status || "unknown";
    const cents = typeof settlement.total_cents === "number" && Number.isFinite(settlement.total_cents)
      ? settlement.total_cents
      : 0;
    const current = totals.get(status) ?? { status, count: 0, totalCents: 0 };
    current.count += 1;
    current.totalCents += cents;
    totals.set(status, current);
  }

  return [...totals.values()].sort((left, right) => {
    const leftOrder = SETTLEMENT_ORDER.indexOf(left.status);
    const rightOrder = SETTLEMENT_ORDER.indexOf(right.status);
    return (leftOrder === -1 ? SETTLEMENT_ORDER.length : leftOrder) - (rightOrder === -1 ? SETTLEMENT_ORDER.length : rightOrder);
  });
}
