"use server";

import { revalidatePath } from "next/cache";
import { requireAdminContext } from "@/lib/admin/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ActionState = {
  error?: string;
  success?: boolean;
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

  const adminContext = await requireAdminContext();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("categories").insert({
    business_id: adminContext.businessId,
    name
  });

  if (error) {
    return { error: error.message || "No pudimos crear la categoria." };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  return { success: true };
}

export async function updateCategoryAction(
  _prevState: ActionState,
  formData: FormData
) {
  const categoryIdValue = formData.get("category_id");
  const nameValue = formData.get("name");

  const categoryId = typeof categoryIdValue === "string" ? categoryIdValue : "";
  const name = typeof nameValue === "string" ? nameValue.trim() : "";

  if (!categoryId) {
    return { error: "Falta identificar la categoria." };
  }

  if (!name) {
    return { error: "Ingresa un nombre para la categoria." };
  }

  await requireAdminContext();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("categories")
    .update({ name })
    .eq("id", categoryId);

  if (error) {
    return { error: error.message || "No pudimos actualizar la categoria." };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  return { success: true };
}
