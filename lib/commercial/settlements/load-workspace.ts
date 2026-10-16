import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type SettlementWorkspaceRow = {
  id: string;
  promoter_id: string;
  period_key: string;
  status: string;
  total_cents: number;
  due_on: string;
  prepared_by: string;
  approved_by: string | null;
  replaces_settlement_id: string | null;
  invalidation_reason: string | null;
  reconciliation_reason: string | null;
};

export type SettlementItemRow = {
  id: string;
  settlement_id: string;
  label: string;
  amount_cents: number;
  lineage: string;
};

export type SettlementInvoiceRow = {
  id: string;
  settlement_id: string;
  status: string;
  amount_cents: number;
  rejection_reason: string | null;
};

export type SettlementPaymentRow = {
  id: string;
  settlement_id: string;
  status: string;
  amount_cents: number;
  idempotency_key: string;
};

export type SettlementWorkspace = {
  settlements: SettlementWorkspaceRow[];
  items: SettlementItemRow[];
  invoices: SettlementInvoiceRow[];
  payments: SettlementPaymentRow[];
};

type WorkspacePayload = {
  ok?: boolean;
  commercial_error_code?: string;
  settlements?: SettlementWorkspaceRow[];
  items?: SettlementItemRow[];
  invoices?: SettlementInvoiceRow[];
  payments?: SettlementPaymentRow[];
};

export type SettlementWorkspaceResult =
  | { ok: true; workspace: SettlementWorkspace }
  | { ok: false; code: string };

export async function loadSettlementWorkspace(
  supabase: SupabaseClient<Database>
): Promise<SettlementWorkspaceResult> {
  const { data, error } = await supabase.rpc("list_settlement_workspace");
  const payload = (data ?? null) as WorkspacePayload | null;
  if (error || payload?.ok !== true) {
    return { ok: false, code: payload?.commercial_error_code ?? "error" };
  }
  return {
    ok: true,
    workspace: {
      settlements: payload.settlements ?? [],
      items: payload.items ?? [],
      invoices: payload.invoices ?? [],
      payments: payload.payments ?? []
    }
  };
}
