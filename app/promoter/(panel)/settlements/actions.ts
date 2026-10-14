"use server";

import { redirect } from "next/navigation";
import { requirePromoterPrincipal } from "@/lib/commercial/promoters/require-promoter-principal";
import { arsInputToCents } from "@/lib/commercial/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function submitOwnInvoice(formData: FormData) {
  await requirePromoterPrincipal();
  const settlementId = String(formData.get("settlementId") ?? "").trim();
  const amount = arsInputToCents(String(formData.get("amount") ?? ""));
  const fileName = String(formData.get("fileName") ?? "").trim();
  if (amount === null || !/^[A-Za-z0-9._-]+$/.test(fileName)) {
    redirect("/promoter/settlements?notice=validation");
  }
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("submit_invoice", {
    p_settlement_id: settlementId,
    p_amount_cents: amount,
    p_document_path: `invoices/${settlementId}/${fileName}`
  });
  const result = (data ?? null) as { ok?: boolean; commercial_error_code?: string } | null;
  const notice = result?.ok === true ? "ok" : (result?.commercial_error_code ?? "error");
  redirect(`/promoter/settlements?notice=${encodeURIComponent(notice)}`);
}
