"use server";

import { redirect } from "next/navigation";
import { requireCommercialArea } from "@/lib/commercial/auth/require-commercial-principal";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RpcResult = {
  ok?: boolean;
  commercial_error_code?: string;
};

function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

async function finish(result: RpcResult | null) {
  const notice = result?.ok === true ? "ok" : result?.commercial_error_code ?? "error";
  redirect(`/commercial/billing?notice=${encodeURIComponent(notice)}`);
}

export async function imputeReceipt(formData: FormData) {
  await requireCommercialArea();
  const periodOn = text(formData, "periodOn");
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("finance_impute_receipt", {
    p_receipt_id: text(formData, "receiptId"),
    p_terms_id: text(formData, "termsId"),
    p_period_on: periodOn === "" ? null : periodOn,
    p_note: text(formData, "note")
  });
  await finish((data ?? null) as RpcResult | null);
}

export async function closeReceipt(formData: FormData) {
  await requireCommercialArea();
  const reference = text(formData, "reference");
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("finance_close_receipt", {
    p_receipt_id: text(formData, "receiptId"),
    p_kind: text(formData, "kind"),
    p_note: text(formData, "note"),
    p_reference: reference === "" ? null : reference
  });
  await finish((data ?? null) as RpcResult | null);
}

export async function reopenObligation(formData: FormData) {
  await requireCommercialArea();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("finance_reopen_obligation", {
    p_obligation_id: text(formData, "obligationId"),
    p_note: text(formData, "note")
  });
  await finish((data ?? null) as RpcResult | null);
}

export async function retryWebhook(formData: FormData) {
  await requireCommercialArea();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("finance_retry_webhook", { p_inbox_id: text(formData, "inboxId") });
  await finish((data ?? null) as RpcResult | null);
}

export async function recordServiceStart(formData: FormData) {
  await requireCommercialArea();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("record_founder_service_start", {
    p_terms_id: text(formData, "termsId"),
    p_started_on: text(formData, "startedOn")
  });
  await finish((data ?? null) as RpcResult | null);
}

export async function voidFiscalDocument(formData: FormData) {
  await requireCommercialArea();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("finance_void_fiscal_document", {
    p_document_id: text(formData, "documentId"),
    p_reason: text(formData, "reason")
  });
  await finish((data ?? null) as RpcResult | null);
}
