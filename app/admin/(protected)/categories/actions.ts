"use server";

import { revalidatePath } from "next/cache";
import { getActionErrorMessage, logActionFailure } from "@/lib/admin/action-errors";
import { requireAdminPermission } from "@/lib/admin/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ActionState = {
  error?: string;
  success?: boolean;
  categoryId?: string;
};

export async function createCategoryAction(
  _prevState: ActionState,
  formData: FormData
) {
  const nameValue = formData.get("name");
  const name = typeof nameValue === "string" ? nameValue.trim() : "";

  if (!name) {
    return { error: "Ingresa un nombre para la categoria." };
  }

  try {
    const adminContext = await requireAdminPermission("manageProducts");
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

  try {
    const adminContext = await requireAdminPermission("manageProducts");
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
    return { success: true };
  } catch (error) {
    logActionFailure("categories.update", error, { categoryId });
    return { error: getActionErrorMessage(error, "No pudimos actualizar la categoria.") };
  }
}
