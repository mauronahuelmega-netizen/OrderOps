"use server";

import { revalidatePath } from "next/cache";
import { requirePromoterPrincipal } from "@/lib/commercial/promoters/require-promoter-principal";
import type { Json } from "@/types/database";
import type { OnboardingBusinessView, OnboardingProductView } from "@/lib/commercial/onboarding/read-model";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ActionState = {
  error?: string;
  success?: string;
};

type ReadResult = {
  ok?: boolean;
  commercial_error_code?: string;
  businesses?: OnboardingBusinessView[];
  products?: OnboardingProductView[];
};

async function loadBusinesses() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("promoter_onboarding_businesses");
  if (error) return { error: "No pudimos consultar los comercios." } as const;
  const result = (data ?? null) as ReadResult | null;
  if (!result?.ok) return { error: "No pudimos consultar los comercios." } as const;
  return { businesses: result.businesses ?? [] } as const;
}

export async function requestOnboardingAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requirePromoterPrincipal();
  if (session.can_operate !== true || !session.promoter_id) {
    return { error: "Tu cuenta no puede solicitar asistencia." };
  }
  const businessId = String(formData.get("business_id") ?? "").trim();
  const loaded = await loadBusinesses();
  if ("error" in loaded && loaded.error) return { error: loaded.error };
  const business = loaded.businesses?.find((item) => item.business_id === businessId);
  if (!business) return { error: "Ese comercio no está disponible para tu cuenta." };
  if (business.grants.some((grant) => grant.display_status === "pending_client" || grant.can_edit)) {
    return { error: "Ya hay una solicitud pendiente o una autorización vigente." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("request_onboarding_grant", {
    p_promoter_id: session.promoter_id,
    p_business_id: businessId,
    p_opportunity_id: null
  });
  const result = data as { ok?: boolean } | null;
  if (error || !result?.ok) return { error: "No pudimos enviar la solicitud." };
  revalidatePath("/promoter/onboarding");
  return { success: "Solicitud enviada. Queda pendiente de aprobación." };
}

export async function savePromoterCatalogAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requirePromoterPrincipal();
  if (session.can_operate !== true) return { error: "Tu cuenta no puede editar el catálogo." };
  const businessId = String(formData.get("business_id") ?? "").trim();
  const productId = String(formData.get("product_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!name) return { error: "Ingresá un nombre." };

  const loaded = await loadBusinesses();
  if ("error" in loaded && loaded.error) return { error: loaded.error };
  const business = loaded.businesses?.find((item) => item.business_id === businessId);
  if (!business?.can_edit) return { error: "No hay una autorización vigente para editar este comercio." };

  const supabase = await createSupabaseServerClient();
  const { data: catalogData, error: catalogError } = await supabase.rpc("promoter_onboarding_products", {
    p_business_id: businessId
  });
  const catalog = (catalogData ?? null) as ReadResult | null;
  if (catalogError || !catalog?.ok || !catalog.products?.some((product) => product.product_id === productId)) {
    return { error: "Ese producto no está disponible para esta autorización." };
  }

  const payload: Json = {
    kind: "product_update",
    product_id: productId,
    name,
    description
  };
  const { data, error } = await supabase.rpc("promoter_apply_catalog", { p_payload: payload });
  const result = data as { ok?: boolean; commercial_error_code?: string } | null;
  if (error || !result?.ok) {
    if (result?.commercial_error_code === "grant_field_forbidden") {
      return { error: "No se puede guardar: la operación incluye un campo prohibido." };
    }
    if (result?.commercial_error_code === "grant_expired" || result?.commercial_error_code === "grant_missing") {
      return { error: "La autorización ya no permite editar." };
    }
    return { error: "No pudimos guardar el contenido." };
  }
  revalidatePath(`/promoter/onboarding/${businessId}`);
  return { success: "Contenido guardado." };
}
