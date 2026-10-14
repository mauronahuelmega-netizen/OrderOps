"use server";

import { redirect } from "next/navigation";
import { requireCommercialArea } from "@/lib/commercial/auth/require-commercial-principal";
import { arsInputToCents } from "@/lib/commercial/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RpcResult = {
  ok?: boolean;
  commercial_error_code?: string;
};

function noticeFrom(result: RpcResult | null): string {
  if (result?.ok === true) return "ok";
  return result?.commercial_error_code ?? "error";
}

async function finish(result: RpcResult | null) {
  redirect(`/commercial/settlements?notice=${encodeURIComponent(noticeFrom(result))}`);
}

export async function prepareSettlement(formData: FormData) {
  await requireCommercialArea();
  const promoterId = String(formData.get("promoterId") ?? "").trim();
  const periodKey = String(formData.get("periodKey") ?? "").trim();
  const rawAdjustments = String(formData.get("adjustmentIds") ?? "").trim();
  const adjustmentIds = rawAdjustments === "" ? null : rawAdjustments.split(",").map((value) => value.trim()).filter((value) => value !== "");
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("prepare_settlement", {
    p_promoter_id: promoterId,
    p_period_key: periodKey,
    p_adjustment_ids: adjustmentIds
  });
  await finish((data ?? null) as RpcResult | null);
}

export async function approveSettlement(formData: FormData) {
  await requireCommercialArea();
  const settlementId = String(formData.get("settlementId") ?? "");
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("approve_settlement", { p_settlement_id: settlementId });
  await finish((data ?? null) as RpcResult | null);
}

export async function replaceSettlement(formData: FormData) {
  await requireCommercialArea();
  const settlementId = String(formData.get("settlementId") ?? "");
  const reason = String(formData.get("reason") ?? "");
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("replace_settlement", {
    p_settlement_id: settlementId,
    p_reason: reason
  });
  await finish((data ?? null) as RpcResult | null);
}

export async function reviewInvoice(formData: FormData) {
  await requireCommercialArea();
  const invoiceId = String(formData.get("invoiceId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const reason = String(formData.get("reason") ?? "");
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("review_invoice", {
    p_invoice_id: invoiceId,
    p_decision: decision,
    p_reason: reason === "" ? null : reason
  });
  await finish((data ?? null) as RpcResult | null);
}

export async function recordPayment(formData: FormData) {
  await requireCommercialArea();
  const settlementId = String(formData.get("settlementId") ?? "");
  const idempotencyKey = String(formData.get("idempotencyKey") ?? "").trim();
  const amount = arsInputToCents(String(formData.get("amount") ?? ""));
  const status = String(formData.get("status") ?? "");
  const reference = String(formData.get("reference") ?? "");
  if (amount === null) {
    redirect("/commercial/settlements?notice=validation");
  }
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("record_settlement_payment", {
    p_settlement_id: settlementId,
    p_idempotency_key: idempotencyKey,
    p_amount_cents: amount,
    p_status: status,
    p_bank_reference: reference === "" ? null : reference,
    p_receipt_path: null
  });
  await finish((data ?? null) as RpcResult | null);
}
