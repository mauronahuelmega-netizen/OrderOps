"use server";

import { revalidatePath } from "next/cache";
import { requirePromoterPrincipal } from "@/lib/commercial/promoters/require-promoter-principal";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  if (!session.can_operate) return;
  const supabase = await createSupabaseServerClient();
  await supabase.rpc("promoter_add_note", {
    p_opportunity_id: String(formData.get("opportunityId") ?? ""),
    p_body: String(formData.get("body") ?? "")
  });
  revalidatePath("/promoter/opportunities");
}

export async function savePromoterTask(formData: FormData) {
  const session = await requirePromoterPrincipal();
  if (!session.can_operate) return;
  const supabase = await createSupabaseServerClient();
  const due = String(formData.get("dueAt") ?? "");
  await supabase.rpc("promoter_upsert_task", {
    p_opportunity_id: String(formData.get("opportunityId") ?? ""),
    p_task_id: null,
    p_title: String(formData.get("title") ?? ""),
    p_status: "open",
    p_due_at: due.length > 0 ? due : null
  });
  revalidatePath("/promoter/tasks");
}

export async function movePromoterOpportunity(formData: FormData) {
  const session = await requirePromoterPrincipal();
  if (!session.can_operate) return;
  const supabase = await createSupabaseServerClient();
  await supabase.rpc("promoter_transition_opportunity", {
    p_opportunity_id: String(formData.get("opportunityId") ?? ""),
    p_to_stage: String(formData.get("toStage") ?? ""),
    p_reason: String(formData.get("reason") ?? "")
  });
  revalidatePath("/promoter/opportunities");
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
