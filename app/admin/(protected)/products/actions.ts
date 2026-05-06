"use server";

import { revalidatePath } from "next/cache";
import { requireAdminContext } from "@/lib/admin/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ActionState = {
  error?: string;
  success?: boolean;
};

export async function createProductAction(
  _prevState: ActionState,
  formData: FormData
) {
  const adminContext = await requireAdminContext();
  const supabase = await createSupabaseServerClient();

  const name = getTrimmedString(formData.get("name"));
  const price = getPriceValue(formData.get("price"));
  const description = getOptionalTrimmedString(formData.get("description"));
  const categoryId = getTrimmedString(formData.get("category_id"));
  const imageUrl = getOptionalTrimmedString(formData.get("image_url"));

  if (!name) {
    return { error: "IngresÃ¡ un nombre para el producto." };
  }

  if (price === null) {
    return { error: "IngresÃ¡ un precio vÃ¡lido." };
  }

  if (!categoryId) {
    return { error: "SeleccionÃ¡ una categorÃ­a." };
  }

  const categoryValidationError = await validateCategoryOwnership({
    supabase,
    businessId: adminContext.businessId,
    categoryId
  });

  if (categoryValidationError) {
    return { error: categoryValidationError };
  }

  const { error } = await supabase.from("products").insert({
    business_id: adminContext.businessId,
    name,
    price,
    category_id: categoryId,
    description,
    image_url: imageUrl,
    is_available: true
  });

  if (error) {
    return { error: error.message || "No pudimos crear el producto." };
  }

  revalidatePath("/admin/products");
  return { success: true };
}

export async function updateProductAction(
  _prevState: ActionState,
  formData: FormData
) {
  const adminContext = await requireAdminContext();
  const supabase = await createSupabaseServerClient();

  const productId = getTrimmedString(formData.get("product_id"));
  const name = getTrimmedString(formData.get("name"));
  const price = getPriceValue(formData.get("price"));
  const description = getOptionalTrimmedString(formData.get("description"));
  const categoryId = getTrimmedString(formData.get("category_id"));
  const imageUrl = getOptionalTrimmedString(formData.get("image_url"));
  const isAvailable = formData.get("is_available") === "on";

  if (!productId) {
    return { error: "Falta identificar el producto." };
  }

  if (!name) {
    return { error: "IngresÃ¡ un nombre para el producto." };
  }

  if (price === null) {
    return { error: "IngresÃ¡ un precio vÃ¡lido." };
  }

  if (!categoryId) {
    return { error: "SeleccionÃ¡ una categorÃ­a." };
  }

  const categoryValidationError = await validateCategoryOwnership({
    supabase,
    businessId: adminContext.businessId,
    categoryId
  });

  if (categoryValidationError) {
    return { error: categoryValidationError };
  }

  const updatePayload: {
    name: string;
    price: number;
    description: string | null;
    category_id: string;
    is_available: boolean;
    image_url?: string;
  } = {
    name,
    price,
    description,
    category_id: categoryId,
    is_available: isAvailable
  };

  if (typeof imageUrl === "string") {
    updatePayload.image_url = imageUrl;
  }

  const { error } = await supabase
    .from("products")
    .update(updatePayload)
    .eq("id", productId)
    .eq("business_id", adminContext.businessId);

  if (error) {
    return { error: error.message || "No pudimos actualizar el producto." };
  }

  revalidatePath("/admin/products");
  return { success: true };
}

function getTrimmedString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalTrimmedString(value: FormDataEntryValue | null) {
  const trimmedValue = getTrimmedString(value);
  return trimmedValue ? trimmedValue : null;
}

function getPriceValue(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return null;
  }

  return parsedValue;
}

async function validateCategoryOwnership(input: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  businessId: string;
  categoryId: string;
}) {
  const { data, error } = await input.supabase
    .from("categories")
    .select("id")
    .eq("id", input.categoryId)
    .eq("business_id", input.businessId)
    .maybeSingle();

  if (error) {
    return error.message || "No pudimos validar la categorÃ­a seleccionada.";
  }

  if (!data) {
    return "La categorÃ­a seleccionada no pertenece a tu negocio.";
  }

  return null;
}
