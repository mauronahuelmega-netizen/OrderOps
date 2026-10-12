"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPermission } from "@/lib/admin/context";
import type { OnboardingGrantView } from "@/lib/commercial/onboarding/read-model";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ActionState = {
  error?: string;
  success?: string;
};

async function loadRequests() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("business_onboarding_requests");
  if (error) return { error: "No pudimos consultar las solicitudes." } as const;
  const result = (data ?? null) as { ok?: boolean; requests?: OnboardingGrantView[] } | null;
  if (!result?.ok) return { error: "No pudimos consultar las solicitudes." } as const;
  return { requests: result.requests ?? [] } as const;
}

export async function decideOnboardingAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdminPermission("manageProducts");
  const grantId = String(formData.get("grant_id") ?? "").trim();
  const decision = String(formData.get("decision") ?? "");
  if (decision !== "approve" && decision !== "reject" && decision !== "revoke") {
    return { error: "La decisión no es válida." };
  }
  const loaded = await loadRequests();
  if ("error" in loaded && loaded.error) return { error: loaded.error };
  const grant = loaded.requests?.find((item) => item.grant_id === grantId);
  if (!grant) return { error: "Esa solicitud no pertenece a tu negocio." };

  const supabase = await createSupabaseServerClient();
  if (decision === "revoke") {
    if (!grant.can_revoke) return { error: "Esa autorización no se puede revocar." };
    const { data, error } = await supabase.rpc("revoke_onboarding_grant", {
      p_grant_id: grantId,
      p_reason: "revocada desde el panel"
    });
    const result = data as { ok?: boolean } | null;
    if (error || !result?.ok) return { error: "No pudimos revocar la autorización." };
    revalidatePath("/admin/onboarding");
    return { success: "Autorización revocada." };
  }

  if (!grant.can_decide) return { error: "Esa solicitud ya no está pendiente." };
  const { data, error } = await supabase.rpc("respond_onboarding_grant", {
    p_grant_id: grantId,
    p_decision: decision,
    p_ends_at: null,
    p_exception_reason: null
  });
  const result = data as { ok?: boolean } | null;
  if (error || !result?.ok) return { error: "No pudimos registrar la decisión." };
  revalidatePath("/admin/onboarding");
  return { success: decision === "approve" ? "Asistencia aprobada por 30 días." : "Solicitud rechazada." };
}
