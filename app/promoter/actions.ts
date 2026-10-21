"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePromoterPrincipal } from "@/lib/commercial/promoters/require-promoter-principal";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const TASK_STATUSES = new Set(["open", "done", "cancelled"]);

async function confirmed(data: unknown) {
  return Boolean(data && typeof data === "object" && (data as { ok?: boolean }).ok === true);
}

function dueInstant(value: string) {
  if (value.length === 0) return null;
  const zoned = /[zZ]|[+-]\d{2}:\d{2}$/.test(value) ? value : `${value}:00-03:00`;
  const date = new Date(zoned);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export async function setWelcomeDismissed(dismissed: boolean) {
  await requirePromoterPrincipal();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("set_own_welcome_dismissed", { p_dismissed: dismissed });
  if (error || !(await confirmed(data))) return { ok: false };
  revalidatePath("/promoter");
  return { ok: true };
}

export async function registerPromoterBusiness(formData: FormData) {
  const session = await requirePromoterPrincipal();
  if (!session.can_operate) return;
  const supabase = await createSupabaseServerClient();
  await supabase.rpc("register_promoter_business", {
    p_trade_name: String(formData.get("tradeName") ?? ""),
    p_whatsapp: String(formData.get("whatsapp") ?? ""),
    p_trade_category: String(formData.get("tradeCategory") ?? "")
  });
  revalidatePath("/promoter");
}

export async function addPromoterNote(formData: FormData) {
  const session = await requirePromoterPrincipal();
  const opportunityId = String(formData.get("opportunityId") ?? "");
  if (!session.can_operate) redirect(`/promoter/opportunities/${opportunityId}?notice=error`);
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("promoter_add_note", {
    p_opportunity_id: opportunityId,
    p_body: String(formData.get("body") ?? "")
  });
  const ok = await confirmed(data);
  if (ok) revalidatePath("/promoter/opportunities");
  redirect(`/promoter/opportunities/${opportunityId}?notice=${ok ? "noted" : "error"}`);
}

export async function savePromoterTask(formData: FormData) {
  const session = await requirePromoterPrincipal();
  if (!session.can_operate) return;
  const supabase = await createSupabaseServerClient();
  const due = String(formData.get("dueAt") ?? "");
  const { data } = await supabase.rpc("promoter_upsert_task", {
    p_opportunity_id: String(formData.get("opportunityId") ?? ""),
    p_task_id: null,
    p_title: String(formData.get("title") ?? ""),
    p_status: "open",
    p_due_at: dueInstant(due),
    p_cancel_reason: null
  });
  if (await confirmed(data)) revalidatePath("/promoter/tasks");
  redirect(`/promoter/tasks?notice=${(await confirmed(data)) ? "saved" : "error"}`);
}

export async function updatePromoterTask(formData: FormData) {
  const session = await requirePromoterPrincipal();
  if (!session.can_operate) return;
  const status = String(formData.get("status") ?? "");
  if (!TASK_STATUSES.has(status)) redirect("/promoter/tasks?notice=error");
  const taskId = String(formData.get("taskId") ?? "");
  const due = String(formData.get("dueAt") ?? "");
  const reason = String(formData.get("cancelReason") ?? "").trim();
  if (status === "cancelled" && reason.length === 0) redirect("/promoter/tasks?notice=error");
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("promoter_upsert_task", {
    p_opportunity_id: String(formData.get("opportunityId") ?? ""),
    p_task_id: taskId,
    p_title: String(formData.get("title") ?? ""),
    p_status: status,
    p_due_at: dueInstant(due),
    p_cancel_reason: status === "cancelled" ? reason : null
  });
  if (await confirmed(data)) revalidatePath("/promoter/tasks");
  redirect(`/promoter/tasks?notice=${(await confirmed(data)) ? "saved" : "error"}`);
}

export async function movePromoterOpportunity(formData: FormData) {
  const session = await requirePromoterPrincipal();
  const opportunityId = String(formData.get("opportunityId") ?? "");
  if (!session.can_operate) redirect(`/promoter/opportunities/${opportunityId}?notice=error`);
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("promoter_transition_opportunity", {
    p_opportunity_id: opportunityId,
    p_to_stage: String(formData.get("toStage") ?? ""),
    p_reason: String(formData.get("reason") ?? "")
  });
  const ok = await confirmed(data);
  if (ok) revalidatePath("/promoter/opportunities");
  redirect(`/promoter/opportunities/${opportunityId}?notice=${ok ? "saved" : "error"}`);
}

export async function requestPromoterClaim(formData: FormData) {
  const session = await requirePromoterPrincipal();
  if (!session.can_operate) return;
  const supabase = await createSupabaseServerClient();
  await supabase.rpc("create_claim", {
    p_commercial_business_id: String(formData.get("businessId") ?? ""),
    p_opportunity_id: String(formData.get("opportunityId") ?? "") || null
  });
  revalidatePath("/promoter/claims");
}
