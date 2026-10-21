export type ServiceAccessState =
  | "invalid"
  | "exempt"
  | "no_terms"
  | "review_required"
  | "pending_activation"
  | "active"
  | "grace"
  | "suspended";

export type ServiceAccess = {
  state: ServiceAccessState;
  allows_orders: boolean;
  setup_price_cents?: number;
  monthly_price_cents?: number;
  start_pending?: boolean;
  service_started_on?: string | null;
  current_period_on?: string | null;
  current_covered?: boolean;
  next_period_on?: string | null;
  next_covered?: boolean;
  renewal_window_opens_on?: string | null;
  grace_ends_at?: string | null;
};

export type BillingCollection = {
  status: "posted" | "reversed";
  gross_cents: number;
  nominal: boolean;
  posted_at: string | null;
  reversed_at: string | null;
};

export type BillingHistoryEntry = {
  obligation_id: string;
  kind: "setup" | "subscription";
  period_on: string | null;
  list_price_cents: number;
  status: string;
  collections: BillingCollection[];
};

export type BillingReceipt = {
  id: string;
  observed_at: string | null;
  gross_amount_cents: number | null;
  currency: string | null;
  status: string;
};

export type BillingFiscalDocument = {
  id: string;
  kind: "invoice" | "credit_note" | "receipt";
  document_number: string;
  issued_on: string;
  amount_cents: number;
  currency: string;
};

export type BillingSummary =
  | { kind: "error"; code: string }
  | { kind: "restricted"; allowsOrders: boolean }
  | {
      kind: "full";
      access: ServiceAccess;
      paymentDestination: { cvu: string; alias: string } | null;
      receipts: BillingReceipt[];
      history: BillingHistoryEntry[];
      fiscalDocuments: BillingFiscalDocument[];
    };

type RawSummary = {
  ok?: boolean;
  commercial_error_code?: string;
  restricted?: boolean;
  allows_orders?: boolean;
  access?: ServiceAccess;
  payment_destination?: { cvu: string; alias: string } | null;
  receipts?: BillingReceipt[];
  history?: BillingHistoryEntry[];
  fiscal_documents?: BillingFiscalDocument[];
};

export function parseBillingSummary(data: unknown): BillingSummary {
  const raw = (data ?? null) as RawSummary | null;
  if (!raw || raw.ok !== true) {
    return { kind: "error", code: raw?.commercial_error_code ?? "error" };
  }
  if (raw.restricted === true) {
    return { kind: "restricted", allowsOrders: raw.allows_orders === true };
  }
  if (!raw.access) {
    return { kind: "error", code: "error" };
  }
  return {
    kind: "full",
    access: raw.access,
    paymentDestination: raw.payment_destination ?? null,
    receipts: raw.receipts ?? [],
    history: raw.history ?? [],
    fiscalDocuments: raw.fiscal_documents ?? []
  };
}

export type BillingNoticeKind =
  | "suspended"
  | "grace"
  | "activation_pending"
  | "review"
  | "t_minus_3"
  | "t_minus_10"
  | "service_start_pending"
  | "payment_received"
  | "reversal";

export type BillingNotice = {
  kind: BillingNoticeKind;
  tone: "critical" | "warning" | "info" | "success";
  date?: string | null;
};

const DAY_MS = 86_400_000;
const PAYMENT_NOTICE_DAYS = 7;
const REVERSAL_NOTICE_DAYS = 30;

export function buenosAiresDate(at: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(at);
}

function daysBetween(fromDay: string, toDay: string): number {
  return Math.round((Date.parse(`${toDay}T00:00:00Z`) - Date.parse(`${fromDay}T00:00:00Z`)) / DAY_MS);
}

function withinDays(iso: string | null, now: Date, days: number): boolean {
  if (!iso) return false;
  const at = Date.parse(iso);
  return Number.isFinite(at) && at <= now.getTime() && now.getTime() - at <= days * DAY_MS;
}

export function computeBillingNotices(
  access: ServiceAccess,
  history: BillingHistoryEntry[],
  now: Date
): BillingNotice[] {
  const notices: BillingNotice[] = [];
  const today = buenosAiresDate(now);

  switch (access.state) {
    case "suspended":
      notices.push({ kind: "suspended", tone: "critical" });
      break;
    case "grace":
      notices.push({ kind: "grace", tone: "warning", date: access.grace_ends_at ?? null });
      break;
    case "pending_activation":
      notices.push({ kind: "activation_pending", tone: "warning" });
      break;
    case "no_terms":
    case "review_required":
    case "invalid":
      notices.push({ kind: "review", tone: "warning" });
      break;
    case "active":
      if (access.start_pending) {
        notices.push({ kind: "service_start_pending", tone: "info" });
      } else if (access.next_period_on && access.next_covered === false) {
        const days = daysBetween(today, access.next_period_on);
        if (days >= 0 && days <= 3) {
          notices.push({ kind: "t_minus_3", tone: "warning", date: access.next_period_on });
        } else if (days > 3 && days <= 10) {
          notices.push({ kind: "t_minus_10", tone: "info", date: access.next_period_on });
        }
      }
      break;
    case "exempt":
      break;
  }

  const collections = history.flatMap((entry) => entry.collections);
  const reversed = collections.filter((collection) => withinDays(collection.reversed_at, now, REVERSAL_NOTICE_DAYS));
  if (reversed.length > 0) {
    notices.push({ kind: "reversal", tone: "warning" });
  }
  const paid = collections.filter(
    (collection) =>
      collection.status === "posted" && collection.nominal && withinDays(collection.posted_at, now, PAYMENT_NOTICE_DAYS)
  );
  // A past payment must not read as "all good" while the current period is still unpaid.
  if (paid.length > 0 && access.state !== "suspended" && access.state !== "grace") {
    notices.push({ kind: "payment_received", tone: "success" });
  }
  return notices;
}

export function billingEnvironment(env: Readonly<Record<string, string | undefined>>): "sandbox" | "production" {
  return env.COMMERCIAL_TALO_ENVIRONMENT?.trim() === "production" ? "production" : "sandbox";
}
