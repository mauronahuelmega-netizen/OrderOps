"use server";

import { revalidatePath } from "next/cache";
import { requireCommercialPrincipal } from "@/lib/commercial/auth/require-commercial-principal";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function moveOpportunityStage(formData: FormData) {
  await requireCommercialPrincipal();
  const opportunityId = String(formData.get("opportunityId") ?? "");
  const toStage = String(formData.get("toStage") ?? "");
  const reason = String(formData.get("reason") ?? "");
  const supabase = await createSupabaseServerClient();
  await supabase.rpc("transition_opportunity", {
    p_opportunity_id: opportunityId,
    p_to_stage: toStage,
    p_reason: reason
  });
  revalidatePath(`/commercial/opportunities/${opportunityId}`);
}

export async function completeCommercialTask(formData: FormData) {
  await requireCommercialPrincipal();
  const opportunityId = String(formData.get("opportunityId") ?? "");
  const taskId = String(formData.get("taskId") ?? "");
  const title = String(formData.get("title") ?? "");
  const supabase = await createSupabaseServerClient();
  await supabase.rpc("upsert_task", {
    p_opportunity_id: opportunityId,
    p_task_id: taskId,
    p_title: title,
    p_status: "done",
    p_due_at: null,
    p_priority: "normal",
    p_cancel_reason: null
  });
  revalidatePath(`/commercial/opportunities/${opportunityId}`);
}
