"use server";

import { revalidatePath } from "next/cache";
import { getActionErrorMessage, logActionFailure } from "@/lib/admin/action-errors";
import { requireAdminPermission } from "@/lib/admin/context";
import {
  CATEGORY_ORDER_GENERIC_ERROR_COPY,
  CATEGORY_ORDER_STALE_COPY,
  validateOrderedCategoryIds
} from "@/lib/categories/category-order-draft";
import { revalidatePublicCatalogCache } from "@/lib/catalog/public-cache-tags";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ActionState = {
  error?: string;
  success?: boolean;
  categoryId?: string;
};

export type SaveCategoryDisplayOrderResult = {
  error?: string;
  success?: boolean;
  stale?: boolean;
};

function mapCategoryOrderRpcError(message: string): SaveCategoryDisplayOrderResult {
  const normalized = message.toUpperCase();

  if (normalized.includes("CATEGORY_ORDER_STALE_SET")) {
    return { error: CATEGORY_ORDER_STALE_COPY, stale: true };
  }

  if (
    normalized.includes("CATEGORY_ORDER_INVALID_SET") ||
    normalized.includes("CATEGORY_ORDER_UNAUTHORIZED") ||
    normalized.includes("CATEGORY_ORDER_FORBIDDEN")
  ) {
    return { error: CATEGORY_ORDER_GENERIC_ERROR_COPY };
  }

  return { error: CATEGORY_ORDER_GENERIC_ERROR_COPY };
}

export async function createCategoryAction(
  _prevState: ActionState,
  formData: FormData
) {
  const nameValue = formData.get("name");
  const name = typeof nameValue === "string" ? nameValue.trim() : "";

  if (!name) {
    return { error: "Ingresa un nombre para la categoria." };
  }

  const adminContext = await requireAdminPermission("manageProducts");
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("categories")
      .insert({
        business_id: adminContext.businessId,
        name
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error("No pudimos crear la categoria.");
    }

    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    revalidatePublicCatalogCache({
      businessId: adminContext.businessId,
      slug: adminContext.businessSlug,
      scope: "catalog"
    });
    return { success: true, categoryId: data.id };
  } catch (error) {
    logActionFailure("categories.create", error);
    return { error: getActionErrorMessage(error, "No pudimos crear la categoria.") };
  }
}

export async function updateCategoryAction(
  _prevState: ActionState,
  formData: FormData
) {
  const categoryIdValue = formData.get("category_id");
  const nameValue = formData.get("name");

  const categoryId = typeof categoryIdValue === "string" ? categoryIdValue.trim() : "";
  const name = typeof nameValue === "string" ? nameValue.trim() : "";

  if (!categoryId) {
    return { error: "Falta identificar la categoria." };
  }

  if (!name) {
    return { error: "Ingresa un nombre para la categoria." };
  }

  const adminContext = await requireAdminPermission("manageProducts");
  try {
    const supabase = await createSupabaseServerClient();

    const { data: currentCategory, error: currentCategoryError } = await supabase
      .from("categories")
      .select("id")
      .eq("id", categoryId)
      .eq("business_id", adminContext.businessId)
      .maybeSingle();

    if (currentCategoryError) {
      throw new Error("No pudimos cargar la categoria.");
    }

    if (!currentCategory) {
      return { error: "Esta categoria ya no existe o pertenece a otro negocio." };
    }

    const { error } = await supabase
      .from("categories")
      .update({ name })
      .eq("id", categoryId)
      .eq("business_id", adminContext.businessId);

    if (error) {
      throw new Error("No pudimos actualizar la categoria.");
    }

    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    revalidatePublicCatalogCache({
      businessId: adminContext.businessId,
      slug: adminContext.businessSlug,
      scope: "catalog"
    });
    return { success: true };
  } catch (error) {
    logActionFailure("categories.update", error, { categoryId });
    return { error: getActionErrorMessage(error, "No pudimos actualizar la categoria.") };
  }
}

/**
 * Atomic category display-order Save.
 * Client sends orderedCategoryIds only — never business_id or numeric positions.
 * Canonical writer: public.save_category_display_order(uuid[]).
 */
export async function saveCategoryDisplayOrderAction(input: {
  orderedCategoryIds: string[];
}): Promise<SaveCategoryDisplayOrderResult> {
  const validated = validateOrderedCategoryIds(input.orderedCategoryIds);
  if (!validated.ok) {
    return { error: validated.error };
  }

  const adminContext = await requireAdminPermission("manageProducts");

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("save_category_display_order", {
      p_ordered_category_ids: validated.ids
    });

    if (error) {
      const mapped = mapCategoryOrderRpcError(error.message ?? "");
      logActionFailure("categories.saveDisplayOrder", error, {
        count: validated.ids.length
      });
      return mapped;
    }

    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    revalidatePublicCatalogCache({
      businessId: adminContext.businessId,
      slug: adminContext.businessSlug,
      scope: "catalog"
    });

    return { success: true };
  } catch (error) {
    logActionFailure("categories.saveDisplayOrder", error, {
      count: validated.ids.length
    });
    return {
      error: getActionErrorMessage(error, CATEGORY_ORDER_GENERIC_ERROR_COPY)
    };
  }
}
