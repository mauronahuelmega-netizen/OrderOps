"use server";

import { revalidatePath } from "next/cache";
import { getActionErrorMessage, logActionFailure } from "@/lib/admin/action-errors";
import { requireAdminPermission } from "@/lib/admin/context";
import { revalidatePublicCatalogCache } from "@/lib/catalog/public-cache-tags";
import { getAdminProductById, type AdminProduct } from "@/lib/products/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ActionState = {
  error?: string;
  success?: boolean;
};

type GetAdminProductActionResult = {
  product: AdminProduct | null;
  error?: string;
};

export async function getAdminProductByIdAction(
  productId: string
): Promise<GetAdminProductActionResult> {
  if (!productId) {
    return {
      product: null,
      error: "Falta identificar el producto."
    };
  }

  try {
    const adminContext = await requireAdminPermission("manageProducts");
    const product = await getAdminProductById(adminContext.businessId, productId);

    if (!product) {
      return {
        product: null,
        error: "No encontramos el producto o ya no pertenece a tu negocio."
      };
    }

    return { product };
  } catch (error) {
    logActionFailure("products.getById", error, { productId });
    return {
      product: null,
      error: getActionErrorMessage(error, "No pudimos cargar el producto.")
    };
  }
}

export async function createProductAction(
  _prevState: ActionState,
  formData: FormData
) {
  const name = getTrimmedString(formData.get("name"));
  const price = getPriceValue(formData.get("price"));
  const description = getOptionalTrimmedString(formData.get("description"));
  const categoryId = getTrimmedString(formData.get("category_id"));
  const imageUrl = getOptionalTrimmedString(formData.get("image_url"));
  const sku = formData.get("sku")?.toString().trim() || null;
  const stockStr = formData.get("stock")?.toString();
  const stock = stockStr ? parseInt(stockStr, 10) : 0;
  const trackStock = formData.get("track_stock") === "on";

  if (!name) {
    return { error: "Ingresa un nombre para el producto." };
  }

  if (price === null) {
    return { error: "Ingresa un precio valido." };
  }

  if (!categoryId) {
    return { error: "Selecciona una categoria." };
  }

  if (!Number.isFinite(stock) || stock < 0) {
    return { error: "Ingresa un stock valido." };
  }

  try {
    const adminContext = await requireAdminPermission("manageProducts");
    const supabase = await createSupabaseServerClient();

    const categoryValidationError = await validateCategoryOwnership({
      supabase,
      businessId: adminContext.businessId,
      categoryId
    });

    if (categoryValidationError) {
      return { error: categoryValidationError };
    }

    const resolvedSku = await resolveProductSkuForCreate({
      supabase,
      businessId: adminContext.businessId,
      categoryId,
      manualSku: sku
    });

    if (resolvedSku.error) {
      return { error: resolvedSku.error };
    }

    const { error } = await supabase.from("products").insert({
      business_id: adminContext.businessId,
      name,
      price,
      category_id: categoryId,
      description,
      image_url: imageUrl,
      is_available: true,
      sku: resolvedSku.sku,
      stock,
      track_stock: trackStock
    });

    if (error) {
      throw new Error("No pudimos crear el producto.");
    }

    revalidatePath("/admin/products");
    revalidatePublicCatalogCache({
      businessId: adminContext.businessId,
      slug: adminContext.businessSlug,
      scope: "catalog"
    });
    return { success: true };
  } catch (error) {
    logActionFailure("products.create", error, { categoryId });
    return { error: getActionErrorMessage(error, "No pudimos crear el producto.") };
  }
}

export async function setProductAvailabilityAction(
  productId: string,
  isAvailable: boolean
): Promise<ActionState> {
  if (!productId) {
    return { error: "Falta identificar el producto." };
  }

  try {
    const adminContext = await requireAdminPermission("manageProducts");
    const supabase = await createSupabaseServerClient();

    const { data: currentProduct, error: currentProductError } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .eq("business_id", adminContext.businessId)
      .maybeSingle();

    if (currentProductError) {
      throw new Error("No pudimos cargar el producto.");
    }

    if (!currentProduct) {
      return { error: "Este producto ya no existe o pertenece a otro negocio." };
    }

    const { error } = await supabase
      .from("products")
      .update({ is_available: isAvailable })
      .eq("id", productId)
      .eq("business_id", adminContext.businessId);

    if (error) {
      throw new Error("No pudimos actualizar la disponibilidad del producto.");
    }

    revalidatePath("/admin/products");
    revalidatePublicCatalogCache({
      businessId: adminContext.businessId,
      slug: adminContext.businessSlug,
      scope: "catalog"
    });
    return { success: true };
  } catch (error) {
    logActionFailure("products.setAvailability", error, { productId, isAvailable });
    return {
      error: getActionErrorMessage(error, "No pudimos actualizar la disponibilidad del producto.")
    };
  }
}

export async function updateProductAction(
  _prevState: ActionState,
  formData: FormData
) {
  const productId = getTrimmedString(formData.get("product_id"));
  const name = getTrimmedString(formData.get("name"));
  const price = getPriceValue(formData.get("price"));
  const description = getOptionalTrimmedString(formData.get("description"));
  const categoryId = getTrimmedString(formData.get("category_id"));
  const imageUrl = getOptionalTrimmedString(formData.get("image_url"));
  const isAvailable = formData.get("is_available") === "on";
  const trackStock = formData.get("track_stock") === "on";
  const sku = formData.get("sku")?.toString().trim() || null;
  const stockStr = formData.get("stock")?.toString();
  const stock = stockStr ? parseInt(stockStr, 10) : 0;

  if (!productId) {
    return { error: "Falta identificar el producto." };
  }

  if (!name) {
    return { error: "Ingresa un nombre para el producto." };
  }

  if (price === null) {
    return { error: "Ingresa un precio valido." };
  }

  if (!categoryId) {
    return { error: "Selecciona una categoria." };
  }

  if (!Number.isFinite(stock) || stock < 0) {
    return { error: "Ingresa un stock valido." };
  }

  try {
    const adminContext = await requireAdminPermission("manageProducts");
    const supabase = await createSupabaseServerClient();

    const categoryValidationError = await validateCategoryOwnership({
      supabase,
      businessId: adminContext.businessId,
      categoryId
    });

    if (categoryValidationError) {
      return { error: categoryValidationError };
    }

    const { data: currentProduct, error: currentProductError } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .eq("business_id", adminContext.businessId)
      .maybeSingle();

    if (currentProductError) {
      throw new Error("No pudimos cargar el producto.");
    }

    if (!currentProduct) {
      return { error: "Este producto ya no existe o pertenece a otro negocio." };
    }

    const updatePayload: {
      name: string;
      price: number;
      description: string | null;
      category_id: string;
      is_available: boolean;
      sku: string | null;
      stock: number;
      track_stock: boolean;
      image_url?: string;
    } = {
      name,
      price,
      description,
      category_id: categoryId,
      is_available: isAvailable,
      sku,
      stock,
      track_stock: trackStock
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
      throw new Error("No pudimos actualizar el producto.");
    }

    revalidatePath("/admin/products");
    revalidatePublicCatalogCache({
      businessId: adminContext.businessId,
      slug: adminContext.businessSlug,
      scope: "catalog"
    });
    return { success: true };
  } catch (error) {
    logActionFailure("products.update", error, { productId, categoryId });
    return { error: getActionErrorMessage(error, "No pudimos actualizar el producto.") };
  }
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

function buildSkuPrefixFromCategoryName(categoryName: string) {
  const normalized = categoryName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();

  if (!normalized) {
    return "CAT";
  }

  return normalized.slice(0, 3);
}

async function resolveProductSkuForCreate(input: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  businessId: string;
  categoryId: string;
  manualSku: string | null;
}) {
  if (input.manualSku) {
    return { sku: input.manualSku };
  }

  const { data: category, error: categoryError } = await input.supabase
    .from("categories")
    .select("name")
    .eq("id", input.categoryId)
    .eq("business_id", input.businessId)
    .single();

  if (categoryError || !category?.name) {
    logActionFailure("products.generateSku.categoryLookup", categoryError, {
      businessId: input.businessId,
      categoryId: input.categoryId
    });
    return { sku: null, error: "No pudimos obtener la categoria para generar el SKU." };
  }

  const prefix = buildSkuPrefixFromCategoryName(category.name);

  const { count, error: countError } = await input.supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("business_id", input.businessId)
    .eq("category_id", input.categoryId);

  if (countError) {
    logActionFailure("products.generateSku.countLookup", countError, {
      businessId: input.businessId,
      categoryId: input.categoryId
    });
    return { sku: null, error: "No pudimos generar el SKU automaticamente." };
  }

  const nextNumber = (count ?? 0) + 1;
  const paddedNumber = String(nextNumber).padStart(3, "0");

  return { sku: `${prefix}-${paddedNumber}` };
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
    logActionFailure("products.validateCategoryOwnership", error, {
      businessId: input.businessId,
      categoryId: input.categoryId
    });
    return "No pudimos validar la categoria seleccionada.";
  }

  if (!data) {
    return "La categoria seleccionada no pertenece a tu negocio.";
  }

  return null;
}
