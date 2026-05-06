"use server";

import { revalidatePath } from "next/cache";
import { requireAdminContext } from "@/lib/admin/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ActionState = {
  error?: string;
  success?: boolean;
};

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

export async function updatePublicBusinessSettingsAction(
  _prevState: ActionState,
  formData: FormData
) {
  const adminContext = await requireAdminContext();
  const supabase = await createSupabaseServerClient();

  const description = getOptionalTrimmedString(formData.get("description"));
  const primaryColor = getOptionalTrimmedString(formData.get("primary_color"));
  const incomingLogoUrl = getOptionalTrimmedString(formData.get("logo_url"));
  const incomingCoverImageUrl = getOptionalTrimmedString(formData.get("cover_image_url"));
  const instagramUrl = getOptionalTrimmedString(formData.get("instagram_url"));

  if (primaryColor && !HEX_COLOR_PATTERN.test(primaryColor)) {
    return { error: "Ingresá un color en formato #RRGGBB." };
  }

  const { data: currentBusiness, error: currentBusinessError } = await supabase
    .from("businesses")
    .select("id, logo_url, cover_image_url")
    .eq("id", adminContext.businessId)
    .maybeSingle();

  if (currentBusinessError) {
    return {
      error:
        currentBusinessError.message ||
        "No pudimos cargar la configuración actual del negocio."
    };
  }

  if (!currentBusiness) {
    return { error: "No encontramos el negocio que querés actualizar." };
  }

  const nextLogoUrl = incomingLogoUrl ?? currentBusiness.logo_url;
  const nextCoverImageUrl = incomingCoverImageUrl ?? currentBusiness.cover_image_url;

  const { error: updateError } = await supabase
    .from("businesses")
    .update({
      description,
      primary_color: primaryColor,
      logo_url: nextLogoUrl,
      cover_image_url: nextCoverImageUrl,
      instagram_url: instagramUrl
    })
    .eq("id", adminContext.businessId);

  if (updateError) {
    return { error: updateError.message || "No pudimos guardar los cambios. Intentá de nuevo." };
  }

  const { data: confirmedBusiness, error: confirmError } = await supabase
    .from("businesses")
    .select("id, logo_url, cover_image_url, description, primary_color, instagram_url")
    .eq("id", adminContext.businessId)
    .maybeSingle();

  if (confirmError) {
    return {
      error: confirmError.message || "No pudimos confirmar los cambios del negocio."
    };
  }

  if (!confirmedBusiness) {
    return { error: "No pudimos confirmar los cambios del negocio." };
  }

  if (incomingLogoUrl && !matchesStoredValue(confirmedBusiness.logo_url, incomingLogoUrl)) {
    return { error: "No pudimos guardar los cambios. Intentá de nuevo." };
  }

  if (
    incomingCoverImageUrl &&
    !matchesStoredValue(confirmedBusiness.cover_image_url, incomingCoverImageUrl)
  ) {
    return { error: "No pudimos guardar la portada del negocio." };
  }

  revalidatePath("/admin/settings/public");

  if (adminContext.businessSlug) {
    revalidatePath(`/b/${adminContext.businessSlug}`);
    revalidatePath(`/b/${adminContext.businessSlug}/catalogo`);
  }

  return { success: true };
}

function getOptionalTrimmedString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : null;
}

function matchesStoredValue(storedValue: string | null, incomingValue: string) {
  return (storedValue ?? "").trim() === incomingValue.trim();
}
