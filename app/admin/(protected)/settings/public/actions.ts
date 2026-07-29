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

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

export async function updatePublicBusinessSettingsAction(
  _prevState: ActionState,
  formData: FormData
) {
  const description = getOptionalTrimmedString(formData.get("description"));
  const primaryColor = getOptionalTrimmedString(formData.get("primary_color"));
  const incomingLogoUrl = getOptionalTrimmedString(formData.get("logo_url"));
  const incomingCoverImageUrl = getOptionalTrimmedString(formData.get("cover_image_url"));
  const instagramUrl = getOptionalTrimmedString(formData.get("instagram_url"));

  if (primaryColor && !HEX_COLOR_PATTERN.test(primaryColor)) {
    return { error: "Ingresa un color en formato #RRGGBB." };
  }

  try {
    const adminContext = await requireAdminPermission("managePublicSettings");
    const supabase = await createSupabaseServerClient();

    const { data: currentBusiness, error: currentBusinessError } = await supabase
      .from("businesses")
      .select("id, logo_url, cover_image_url")
      .eq("id", adminContext.businessId)
      .maybeSingle();

    if (currentBusinessError) {
      throw new Error("No pudimos cargar la configuracion actual del negocio.");
    }

    if (!currentBusiness) {
      return { error: "No encontramos el negocio que queres actualizar." };
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
      throw new Error("No pudimos guardar los cambios.");
    }

    const { data: confirmedBusiness, error: confirmError } = await supabase
      .from("businesses")
      .select("id, logo_url, cover_image_url, description, primary_color, instagram_url")
      .eq("id", adminContext.businessId)
      .maybeSingle();

    if (confirmError || !confirmedBusiness) {
      throw new Error("No pudimos confirmar los cambios del negocio.");
    }

    if (incomingLogoUrl && !matchesStoredValue(confirmedBusiness.logo_url, incomingLogoUrl)) {
      return { error: "No pudimos guardar el logo. Intenta de nuevo." };
    }

    if (
      incomingCoverImageUrl &&
      !matchesStoredValue(confirmedBusiness.cover_image_url, incomingCoverImageUrl)
    ) {
      return { error: "No pudimos guardar la portada del negocio." };
    }

    revalidatePath("/admin/settings/public");
    revalidatePath("/admin/settings/public/landing");
    revalidatePath("/admin/settings/public/catalogo");
    revalidatePublicCatalogCache({
      businessId: adminContext.businessId,
      slug: adminContext.businessSlug,
      scope: "business"
    });

    return { success: true };
  } catch (error) {
    logActionFailure("settings.public.updateBusiness", error);
    return {
      error: getActionErrorMessage(error, "No pudimos guardar los cambios. Intenta de nuevo.")
    };
  }
}

export async function updateCatalogHeroSettingsAction(
  _prevState: ActionState,
  formData: FormData
) {
  const catalogHeroHeadline = getOptionalTrimmedString(formData.get("catalog_hero_headline"));
  const catalogHeroBadge = getOptionalTrimmedString(formData.get("catalog_hero_badge"));
  const catalogHeroMicrocopy = getOptionalTrimmedString(formData.get("catalog_hero_microcopy"));

  try {
    const adminContext = await requireAdminPermission("managePublicSettings");
    const supabase = await createSupabaseServerClient();

    const { error: updateError } = await supabase
      .from("businesses")
      .update({
        catalog_hero_headline: catalogHeroHeadline,
        catalog_hero_badge: catalogHeroBadge,
        catalog_hero_microcopy: catalogHeroMicrocopy
      })
      .eq("id", adminContext.businessId);

    if (updateError) {
      throw new Error("No pudimos guardar los cambios.");
    }

    revalidatePath("/admin/settings/public");
    revalidatePath("/admin/settings/public/catalogo");
    revalidatePublicCatalogCache({
      businessId: adminContext.businessId,
      slug: adminContext.businessSlug,
      scope: "business"
    });

    return { success: true };
  } catch (error) {
    logActionFailure("settings.public.updateCatalogHero", error);
    return {
      error: getActionErrorMessage(error, "No pudimos guardar los cambios. Intenta de nuevo.")
    };
  }
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
