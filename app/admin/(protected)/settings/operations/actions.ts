"use server";

import { revalidatePath } from "next/cache";
import { getActionErrorMessage, logActionFailure } from "@/lib/admin/action-errors";
import { requireAdminPermission } from "@/lib/admin/context";
import { revalidatePublicCatalogCache } from "@/lib/catalog/public-cache-tags";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ActionState = {
  error?: string;
  success?: boolean;
};

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

function parsePositiveInteger(raw: FormDataEntryValue | null, fieldLabel: string): number | { error: string } {
  if (typeof raw !== "string" || raw.trim() === "") {
    return { error: `${fieldLabel} es obligatorio.` };
  }

  const value = Number.parseInt(raw, 10);

  if (!Number.isFinite(value) || value < 0) {
    return { error: `${fieldLabel} debe ser un número entero mayor o igual a 0.` };
  }

  return value;
}

function parseInactiveWorkingDays(formData: FormData): number[] | { error: string } {
  const rawValues = formData.getAll("inactive_working_days");
  const days: number[] = [];

  for (const entry of rawValues) {
    if (typeof entry !== "string") {
      continue;
    }

    const day = Number.parseInt(entry, 10);

    if (!Number.isInteger(day) || day < 0 || day > 6) {
      return { error: "Los días inactivos deben ser valores entre 0 (Domingo) y 6 (Sábado)." };
    }

    if (!days.includes(day)) {
      days.push(day);
    }
  }

  days.sort((a, b) => a - b);
  return days;
}

function normalizeCutoffTime(raw: FormDataEntryValue | null): string | { error: string } {
  if (typeof raw !== "string" || raw.trim() === "") {
    return { error: "La hora de corte es obligatoria." };
  }

  const trimmed = raw.trim();

  if (!TIME_PATTERN.test(trimmed)) {
    return { error: "Ingresa una hora de corte válida (HH:MM)." };
  }

  return trimmed.length === 5 ? `${trimmed}:00` : trimmed;
}

export async function updateScheduledSettings(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const minLeadTime = parsePositiveInteger(
    formData.get("scheduled_min_lead_time_hours"),
    "Las horas mínimas de anticipación"
  );
  if (typeof minLeadTime === "object") {
    return minLeadTime;
  }

  const maxDays = parsePositiveInteger(
    formData.get("scheduled_max_days_in_advance"),
    "Los días máximos de anticipación"
  );
  if (typeof maxDays === "object") {
    return maxDays;
  }

  if (maxDays < 1) {
    return { error: "Los días máximos de anticipación deben ser al menos 1." };
  }

  const cutoffTime = normalizeCutoffTime(formData.get("scheduled_cutoff_time"));
  if (typeof cutoffTime === "object") {
    return cutoffTime;
  }

  const inactiveDays = parseInactiveWorkingDays(formData);
  if (typeof inactiveDays === "object" && "error" in inactiveDays) {
    return inactiveDays;
  }

  try {
    const adminContext = await requireAdminPermission("managePublicSettings");
    const supabase = await createSupabaseServerClient();

    const { data: currentSettings, error: loadError } = await supabase
      .from("business_settings")
      .select("scheduled_mode_active")
      .eq("business_id", adminContext.businessId)
      .maybeSingle();

    if (loadError) {
      throw loadError;
    }

    if (!currentSettings?.scheduled_mode_active) {
      return { error: "El modo programado no está activo para este negocio." };
    }

    const { error: updateError } = await supabase
      .from("business_settings")
      .update({
        scheduled_min_lead_time_hours: minLeadTime,
        scheduled_max_days_in_advance: maxDays,
        scheduled_cutoff_time: cutoffTime,
        inactive_working_days: inactiveDays
      })
      .eq("business_id", adminContext.businessId);

    if (updateError) {
      throw updateError;
    }

    revalidatePath("/admin/settings/operations");
    revalidatePublicCatalogCache({
      businessId: adminContext.businessId,
      slug: adminContext.businessSlug,
      scope: "business"
    });

    return { success: true };
  } catch (error) {
    logActionFailure("operations.updateScheduledSettings", error);
    return {
      error: getActionErrorMessage(error, "No pudimos guardar las reglas programadas.")
    };
  }
}
