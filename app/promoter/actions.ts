"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePromoterPrincipal } from "@/lib/commercial/promoters/require-promoter-principal";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const TASK_STATUSES = new Set(["open", "done", "cancelled"]);

async function confirmed(data: unknown) {
  return Boolean(data && typeof data === "object" && (data as { ok?: boolean }).ok === true);
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
    p_due_at: due.length > 0 ? due : null
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
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("promoter_upsert_task", {
    p_opportunity_id: String(formData.get("opportunityId") ?? ""),
    p_task_id: taskId,
    p_title: String(formData.get("title") ?? ""),
    p_status: status,
    p_due_at: due.length > 0 ? due : null
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
