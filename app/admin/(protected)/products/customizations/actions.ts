"use server";

import { revalidatePath } from "next/cache";
import { getActionErrorMessage, logActionFailure } from "@/lib/admin/action-errors";
import { requireAdminPermission } from "@/lib/admin/context";
import {
  getProductCustomizationInheritanceForAdmin,
  parseCustomizationAssignmentInput,
  parseCustomizationGroupInput,
  parseCustomizationOptionInput,
  parseOrderedIdsJson,
  parseUpsellGroupInput,
  parseUpsellItemInput,
  type ProductCustomizationInheritance
} from "@/lib/product-customization/admin";
import { buildIncrementalSortOrders } from "@/lib/product-customization/shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ActionState = {
  error?: string;
  success?: boolean;
  message?: string;
  groupId?: string;
  optionId?: string;
  assignmentId?: string;
  upsellGroupId?: string;
  upsellItemId?: string;
};

const CUSTOMIZATIONS_PATH = "/admin/products/customizations";
const PRODUCTS_PATH = "/admin/products";

function revalidateCustomizationPaths() {
  revalidatePath(CUSTOMIZATIONS_PATH);
  revalidatePath(PRODUCTS_PATH);
}

function getId(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getBooleanToggle(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "true" || value === "on" || value === "1";
}

async function assertGroupOwnership(groupId: string, businessId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("customization_groups")
    .select("id")
    .eq("id", groupId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) {
    throw new Error("No pudimos verificar el grupo.");
  }

  if (!data) {
    return { error: "El grupo no existe o no pertenece a tu negocio." } as const;
  }

  return { ok: true as const, supabase };
}

async function assertOptionOwnership(optionId: string, businessId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("customization_options")
    .select("id, group_id")
    .eq("id", optionId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) {
    throw new Error("No pudimos verificar la opción.");
  }

  if (!data) {
    return { error: "La opción no existe o no pertenece a tu negocio." } as const;
  }

  return { ok: true as const, supabase, option: data };
}

export async function createCustomizationGroupAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = parseCustomizationGroupInput(formData);
  if ("error" in parsed) {
    return { error: parsed.error };
  }

  try {
    const adminContext = await requireAdminPermission("manageProducts");
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("customization_groups")
      .insert({
        business_id: adminContext.businessId,
        name: parsed.name,
        description: parsed.description,
        selection_type: parsed.selectionType,
        is_required: parsed.isRequired,
        min_selections: parsed.minSelections,
        max_selections: parsed.maxSelections,
        is_available: parsed.isAvailable,
        sort_order: parsed.sortOrder
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error("No pudimos crear el grupo.");
    }

    revalidateCustomizationPaths();
    return {
      success: true,
      message: "Grupo creado.",
      groupId: data.id
    };
  } catch (error) {
    logActionFailure("customizations.group.create", error);
    return {
      error: getActionErrorMessage(error, "No pudimos crear el grupo.")
    };
  }
}

export async function updateCustomizationGroupAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const groupId = getId(formData, "group_id");
  if (!groupId) {
    return { error: "Falta identificar el grupo." };
  }

  const parsed = parseCustomizationGroupInput(formData);
  if ("error" in parsed) {
    return { error: parsed.error };
  }

  try {
    const adminContext = await requireAdminPermission("manageProducts");
    const ownership = await assertGroupOwnership(groupId, adminContext.businessId);
    if ("error" in ownership) {
      return { error: ownership.error };
    }

    const { error } = await ownership.supabase
      .from("customization_groups")
      .update({
        name: parsed.name,
        description: parsed.description,
        selection_type: parsed.selectionType,
        is_required: parsed.isRequired,
        min_selections: parsed.minSelections,
        max_selections: parsed.maxSelections,
        is_available: parsed.isAvailable,
        sort_order: parsed.sortOrder
      })
      .eq("id", groupId)
      .eq("business_id", adminContext.businessId);

    if (error) {
      throw new Error("No pudimos actualizar el grupo.");
    }

    revalidateCustomizationPaths();
    return { success: true, message: "Grupo actualizado." };
  } catch (error) {
    logActionFailure("customizations.group.update", error, { groupId });
    return {
      error: getActionErrorMessage(error, "No pudimos actualizar el grupo.")
    };
  }
}

export async function toggleCustomizationGroupAvailabilityAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const groupId = getId(formData, "group_id");
  const isAvailable = getBooleanToggle(formData, "is_available");

  if (!groupId) {
    return { error: "Falta identificar el grupo." };
  }

  try {
    const adminContext = await requireAdminPermission("manageProducts");
    const ownership = await assertGroupOwnership(groupId, adminContext.businessId);
    if ("error" in ownership) {
      return { error: ownership.error };
    }

    const { error } = await ownership.supabase
      .from("customization_groups")
      .update({ is_available: isAvailable })
      .eq("id", groupId)
      .eq("business_id", adminContext.businessId);

    if (error) {
      throw new Error("No pudimos actualizar la disponibilidad del grupo.");
    }

    revalidateCustomizationPaths();
    return {
      success: true,
      message: isAvailable ? "Grupo activado." : "Grupo desactivado."
    };
  } catch (error) {
    logActionFailure("customizations.group.toggle", error, { groupId });
    return {
      error: getActionErrorMessage(
        error,
        "No pudimos actualizar la disponibilidad del grupo."
      )
    };
  }
}

export async function createCustomizationOptionAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const groupId = getId(formData, "group_id");
  if (!groupId) {
    return { error: "Falta identificar el grupo." };
  }

  const parsed = parseCustomizationOptionInput(formData);
  if ("error" in parsed) {
    return { error: parsed.error };
  }

  try {
    const adminContext = await requireAdminPermission("manageProducts");
    const ownership = await assertGroupOwnership(groupId, adminContext.businessId);
    if ("error" in ownership) {
      return { error: ownership.error };
    }

    const { data, error } = await ownership.supabase
      .from("customization_options")
      .insert({
        business_id: adminContext.businessId,
        group_id: groupId,
        name: parsed.name,
        description: parsed.description,
        price_delta: parsed.priceDelta,
        is_available: parsed.isAvailable,
        sort_order: parsed.sortOrder
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error("No pudimos crear la opción.");
    }

    revalidateCustomizationPaths();
    return {
      success: true,
      message: "Opción creada.",
      optionId: data.id
    };
  } catch (error) {
    logActionFailure("customizations.option.create", error, { groupId });
    return {
      error: getActionErrorMessage(error, "No pudimos crear la opción.")
    };
  }
}

export async function updateCustomizationOptionAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const optionId = getId(formData, "option_id");
  if (!optionId) {
    return { error: "Falta identificar la opción." };
  }

  const parsed = parseCustomizationOptionInput(formData);
  if ("error" in parsed) {
    return { error: parsed.error };
  }

  try {
    const adminContext = await requireAdminPermission("manageProducts");
    const ownership = await assertOptionOwnership(optionId, adminContext.businessId);
    if ("error" in ownership) {
      return { error: ownership.error };
    }

    const { error } = await ownership.supabase
      .from("customization_options")
      .update({
        name: parsed.name,
        description: parsed.description,
        price_delta: parsed.priceDelta,
        is_available: parsed.isAvailable,
        sort_order: parsed.sortOrder
      })
      .eq("id", optionId)
      .eq("business_id", adminContext.businessId);

    if (error) {
      throw new Error("No pudimos actualizar la opción.");
    }

    revalidateCustomizationPaths();
    return { success: true, message: "Opción actualizada." };
  } catch (error) {
    logActionFailure("customizations.option.update", error, { optionId });
    return {
      error: getActionErrorMessage(error, "No pudimos actualizar la opción.")
    };
  }
}

export async function toggleCustomizationOptionAvailabilityAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const optionId = getId(formData, "option_id");
  const isAvailable = getBooleanToggle(formData, "is_available");

  if (!optionId) {
    return { error: "Falta identificar la opción." };
  }

  try {
    const adminContext = await requireAdminPermission("manageProducts");
    const ownership = await assertOptionOwnership(optionId, adminContext.businessId);
    if ("error" in ownership) {
      return { error: ownership.error };
    }

    const { error } = await ownership.supabase
      .from("customization_options")
      .update({ is_available: isAvailable })
      .eq("id", optionId)
      .eq("business_id", adminContext.businessId);

    if (error) {
      throw new Error("No pudimos actualizar la disponibilidad de la opción.");
    }

    revalidateCustomizationPaths();
    return {
      success: true,
      message: isAvailable ? "Opción activada." : "Opción desactivada."
    };
  } catch (error) {
    logActionFailure("customizations.option.toggle", error, { optionId });
    return {
      error: getActionErrorMessage(
        error,
        "No pudimos actualizar la disponibilidad de la opción."
      )
    };
  }
}

async function assertCategoryOwnership(categoryId: string, businessId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) {
    throw new Error("No pudimos verificar la categoría.");
  }

  if (!data) {
    return { error: "La categoría no existe o no pertenece a tu negocio." } as const;
  }

  return { ok: true as const, supabase };
}

async function assertProductOwnership(productId: string, businessId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, category_id")
    .eq("id", productId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) {
    throw new Error("No pudimos verificar el producto.");
  }

  if (!data) {
    return { error: "El producto no existe o no pertenece a tu negocio." } as const;
  }

  return { ok: true as const, supabase, product: data };
}

async function assertTargetOwnership(
  targetType: "category" | "product",
  targetId: string,
  businessId: string
) {
  if (targetType === "category") {
    return assertCategoryOwnership(targetId, businessId);
  }

  return assertProductOwnership(targetId, businessId);
}

async function assertAssignmentOwnership(assignmentId: string, businessId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("customization_group_assignments")
    .select("id")
    .eq("id", assignmentId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) {
    throw new Error("No pudimos verificar la asignación.");
  }

  if (!data) {
    return { error: "La asignación no existe o no pertenece a tu negocio." } as const;
  }

  return { ok: true as const, supabase };
}

async function assertUpsellGroupOwnership(upsellGroupId: string, businessId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("upsell_groups")
    .select("id, target_type, target_id, is_available")
    .eq("id", upsellGroupId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) {
    throw new Error("No pudimos verificar el grupo de plus.");
  }

  if (!data) {
    return { error: "El grupo de plus no existe o no pertenece a tu negocio." } as const;
  }

  return { ok: true as const, supabase, upsellGroup: data };
}

async function assertUpsellItemOwnership(itemId: string, businessId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("upsell_group_items")
    .select("id, upsell_group_id")
    .eq("id", itemId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) {
    throw new Error("No pudimos verificar el producto sugerido.");
  }

  if (!data) {
    return { error: "El producto sugerido no existe o no pertenece a tu negocio." } as const;
  }

  return { ok: true as const, supabase, item: data };
}

async function assertGroupAppliesToProduct(
  businessId: string,
  productId: string,
  groupId: string
) {
  const inheritance = await getProductCustomizationInheritanceForAdmin(
    businessId,
    productId
  );

  if (!inheritance) {
    return { error: "El producto no existe o no pertenece a tu negocio." } as const;
  }

  const match = inheritance.groups.find((group) => group.groupId === groupId);
  if (!match) {
    return {
      error: "Ese grupo no aplica a este producto (ni por categoría ni por asignación directa)."
    } as const;
  }

  return { ok: true as const, inheritance, match };
}

export async function createCustomizationGroupAssignmentAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = parseCustomizationAssignmentInput(formData);
  if ("error" in parsed) {
    return { error: parsed.error };
  }

  try {
    const adminContext = await requireAdminPermission("manageProducts");
    const groupOwnership = await assertGroupOwnership(
      parsed.groupId,
      adminContext.businessId
    );
    if ("error" in groupOwnership) {
      return { error: groupOwnership.error };
    }

    const targetOwnership = await assertTargetOwnership(
      parsed.targetType,
      parsed.targetId,
      adminContext.businessId
    );
    if ("error" in targetOwnership) {
      return { error: targetOwnership.error };
    }

    const { data: existing, error: existingError } = await groupOwnership.supabase
      .from("customization_group_assignments")
      .select("id")
      .eq("business_id", adminContext.businessId)
      .eq("group_id", parsed.groupId)
      .eq("target_type", parsed.targetType)
      .eq("target_id", parsed.targetId)
      .maybeSingle();

    if (existingError) {
      throw new Error("No pudimos validar asignaciones existentes.");
    }

    if (existing) {
      return { error: "Este grupo ya está asignado a ese destino." };
    }

    const { data, error } = await groupOwnership.supabase
      .from("customization_group_assignments")
      .insert({
        business_id: adminContext.businessId,
        group_id: parsed.groupId,
        target_type: parsed.targetType,
        target_id: parsed.targetId,
        is_enabled: parsed.isEnabled,
        sort_order: parsed.sortOrder
      })
      .select("id")
      .single();

    if (error || !data) {
      if (error?.code === "23505") {
        return { error: "Este grupo ya está asignado a ese destino." };
      }
      throw new Error("No pudimos crear la asignación.");
    }

    revalidateCustomizationPaths();
    return {
      success: true,
      message: "Asignación creada.",
      assignmentId: data.id
    };
  } catch (error) {
    logActionFailure("customizations.assignment.create", error);
    return {
      error: getActionErrorMessage(error, "No pudimos crear la asignación.")
    };
  }
}

export async function updateCustomizationGroupAssignmentAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const assignmentId = getId(formData, "assignment_id");
  if (!assignmentId) {
    return { error: "Falta identificar la asignación." };
  }

  const sortRaw = formData.get("sort_order");
  const sortValue = typeof sortRaw === "string" ? sortRaw.trim() : "";
  if (!sortValue || !/^\d+$/.test(sortValue)) {
    return { error: "El orden debe ser un número entero mayor o igual a 0." };
  }

  const isEnabledRaw = formData.get("is_enabled");
  const hasEnabled = isEnabledRaw !== null;
  const isEnabled = getBooleanToggle(formData, "is_enabled");

  try {
    const adminContext = await requireAdminPermission("manageProducts");
    const ownership = await assertAssignmentOwnership(
      assignmentId,
      adminContext.businessId
    );
    if ("error" in ownership) {
      return { error: ownership.error };
    }

    const payload: { sort_order: number; is_enabled?: boolean } = {
      sort_order: Number.parseInt(sortValue, 10)
    };
    if (hasEnabled) {
      payload.is_enabled = isEnabled;
    }

    const { error } = await ownership.supabase
      .from("customization_group_assignments")
      .update(payload)
      .eq("id", assignmentId)
      .eq("business_id", adminContext.businessId);

    if (error) {
      throw new Error("No pudimos actualizar la asignación.");
    }

    revalidateCustomizationPaths();
    return { success: true, message: "Asignación actualizada." };
  } catch (error) {
    logActionFailure("customizations.assignment.update", error, { assignmentId });
    return {
      error: getActionErrorMessage(error, "No pudimos actualizar la asignación.")
    };
  }
}

export async function toggleCustomizationGroupAssignmentAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const assignmentId = getId(formData, "assignment_id");
  const isEnabled = getBooleanToggle(formData, "is_enabled");

  if (!assignmentId) {
    return { error: "Falta identificar la asignación." };
  }

  try {
    const adminContext = await requireAdminPermission("manageProducts");
    const ownership = await assertAssignmentOwnership(
      assignmentId,
      adminContext.businessId
    );
    if ("error" in ownership) {
      return { error: ownership.error };
    }

    const { error } = await ownership.supabase
      .from("customization_group_assignments")
      .update({ is_enabled: isEnabled })
      .eq("id", assignmentId)
      .eq("business_id", adminContext.businessId);

    if (error) {
      throw new Error("No pudimos actualizar el estado de la asignación.");
    }

    revalidateCustomizationPaths();
    return {
      success: true,
      message: isEnabled ? "Asignación activada." : "Asignación desactivada."
    };
  } catch (error) {
    logActionFailure("customizations.assignment.toggle", error, { assignmentId });
    return {
      error: getActionErrorMessage(
        error,
        "No pudimos actualizar el estado de la asignación."
      )
    };
  }
}

export async function disableProductCustomizationGroupOverrideAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const productId = getId(formData, "product_id");
  const groupId = getId(formData, "group_id");

  if (!productId || !groupId) {
    return { error: "Faltan producto o grupo." };
  }

  try {
    const adminContext = await requireAdminPermission("manageProducts");
    const productOwnership = await assertProductOwnership(
      productId,
      adminContext.businessId
    );
    if ("error" in productOwnership) {
      return { error: productOwnership.error };
    }

    const applies = await assertGroupAppliesToProduct(
      adminContext.businessId,
      productId,
      groupId
    );
    if ("error" in applies) {
      return { error: applies.error };
    }

    const { data: existing, error: existingError } = await productOwnership.supabase
      .from("product_customization_overrides")
      .select("id")
      .eq("business_id", adminContext.businessId)
      .eq("product_id", productId)
      .eq("override_type", "group")
      .eq("group_id", groupId)
      .maybeSingle();

    if (existingError) {
      throw new Error("No pudimos validar overrides existentes.");
    }

    if (existing) {
      const { error } = await productOwnership.supabase
        .from("product_customization_overrides")
        .update({ is_enabled: false })
        .eq("id", existing.id)
        .eq("business_id", adminContext.businessId);

      if (error) {
        throw new Error("No pudimos desactivar el grupo para este producto.");
      }
    } else {
      const { error } = await productOwnership.supabase
        .from("product_customization_overrides")
        .insert({
          business_id: adminContext.businessId,
          product_id: productId,
          override_type: "group",
          group_id: groupId,
          option_id: null,
          is_enabled: false
        });

      if (error) {
        throw new Error("No pudimos desactivar el grupo para este producto.");
      }
    }

    revalidateCustomizationPaths();
    return { success: true, message: "Grupo desactivado para este producto." };
  } catch (error) {
    logActionFailure("customizations.override.group.disable", error, {
      productId,
      groupId
    });
    return {
      error: getActionErrorMessage(
        error,
        "No pudimos desactivar el grupo para este producto."
      )
    };
  }
}

export async function restoreProductCustomizationGroupOverrideAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const productId = getId(formData, "product_id");
  const groupId = getId(formData, "group_id");

  if (!productId || !groupId) {
    return { error: "Faltan producto o grupo." };
  }

  try {
    const adminContext = await requireAdminPermission("manageProducts");
    const productOwnership = await assertProductOwnership(
      productId,
      adminContext.businessId
    );
    if ("error" in productOwnership) {
      return { error: productOwnership.error };
    }

    const { error } = await productOwnership.supabase
      .from("product_customization_overrides")
      .delete()
      .eq("business_id", adminContext.businessId)
      .eq("product_id", productId)
      .eq("override_type", "group")
      .eq("group_id", groupId);

    if (error) {
      throw new Error("No pudimos restaurar la herencia del grupo.");
    }

    revalidateCustomizationPaths();
    return { success: true, message: "Herencia del grupo restaurada." };
  } catch (error) {
    logActionFailure("customizations.override.group.restore", error, {
      productId,
      groupId
    });
    return {
      error: getActionErrorMessage(error, "No pudimos restaurar la herencia del grupo.")
    };
  }
}

export async function disableProductCustomizationOptionOverrideAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const productId = getId(formData, "product_id");
  const groupId = getId(formData, "group_id");
  const optionId = getId(formData, "option_id");

  if (!productId || !groupId || !optionId) {
    return { error: "Faltan producto, grupo u opción." };
  }

  try {
    const adminContext = await requireAdminPermission("manageProducts");
    const productOwnership = await assertProductOwnership(
      productId,
      adminContext.businessId
    );
    if ("error" in productOwnership) {
      return { error: productOwnership.error };
    }

    const applies = await assertGroupAppliesToProduct(
      adminContext.businessId,
      productId,
      groupId
    );
    if ("error" in applies) {
      return { error: applies.error };
    }

    const optionInGroup = applies.match.options.find(
      (option) => option.optionId === optionId
    );
    if (!optionInGroup) {
      return { error: "La opción no pertenece a ese grupo aplicable." };
    }

    const { data: existing, error: existingError } = await productOwnership.supabase
      .from("product_customization_overrides")
      .select("id")
      .eq("business_id", adminContext.businessId)
      .eq("product_id", productId)
      .eq("override_type", "option")
      .eq("option_id", optionId)
      .maybeSingle();

    if (existingError) {
      throw new Error("No pudimos validar overrides existentes.");
    }

    if (existing) {
      const { error } = await productOwnership.supabase
        .from("product_customization_overrides")
        .update({ is_enabled: false, group_id: null })
        .eq("id", existing.id)
        .eq("business_id", adminContext.businessId);

      if (error) {
        throw new Error("No pudimos desactivar la opción para este producto.");
      }
    } else {
      const { error } = await productOwnership.supabase
        .from("product_customization_overrides")
        .insert({
          business_id: adminContext.businessId,
          product_id: productId,
          override_type: "option",
          group_id: null,
          option_id: optionId,
          is_enabled: false
        });

      if (error) {
        throw new Error("No pudimos desactivar la opción para este producto.");
      }
    }

    revalidateCustomizationPaths();
    return { success: true, message: "Opción desactivada para este producto." };
  } catch (error) {
    logActionFailure("customizations.override.option.disable", error, {
      productId,
      optionId
    });
    return {
      error: getActionErrorMessage(
        error,
        "No pudimos desactivar la opción para este producto."
      )
    };
  }
}

export async function restoreProductCustomizationOptionOverrideAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const productId = getId(formData, "product_id");
  const optionId = getId(formData, "option_id");

  if (!productId || !optionId) {
    return { error: "Faltan producto u opción." };
  }

  try {
    const adminContext = await requireAdminPermission("manageProducts");
    const productOwnership = await assertProductOwnership(
      productId,
      adminContext.businessId
    );
    if ("error" in productOwnership) {
      return { error: productOwnership.error };
    }

    const { error } = await productOwnership.supabase
      .from("product_customization_overrides")
      .delete()
      .eq("business_id", adminContext.businessId)
      .eq("product_id", productId)
      .eq("override_type", "option")
      .eq("option_id", optionId);

    if (error) {
      throw new Error("No pudimos restaurar la herencia de la opción.");
    }

    revalidateCustomizationPaths();
    return { success: true, message: "Herencia de la opción restaurada." };
  } catch (error) {
    logActionFailure("customizations.override.option.restore", error, {
      productId,
      optionId
    });
    return {
      error: getActionErrorMessage(
        error,
        "No pudimos restaurar la herencia de la opción."
      )
    };
  }
}

export async function createUpsellGroupAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = parseUpsellGroupInput(formData);
  if ("error" in parsed) {
    return { error: parsed.error };
  }

  try {
    const adminContext = await requireAdminPermission("manageProducts");
    const targetOwnership = await assertTargetOwnership(
      parsed.targetType,
      parsed.targetId,
      adminContext.businessId
    );
    if ("error" in targetOwnership) {
      return { error: targetOwnership.error };
    }

    const { data: existing, error: existingError } = await targetOwnership.supabase
      .from("upsell_groups")
      .select("id, is_available")
      .eq("business_id", adminContext.businessId)
      .eq("target_type", parsed.targetType)
      .eq("target_id", parsed.targetId)
      .maybeSingle();

    if (existingError) {
      throw new Error("No pudimos validar grupos de plus existentes.");
    }

    if (existing) {
      return {
        error:
          "Este destino ya tiene un grupo de plus. Editá o activá/desactivá el existente (máximo 1 por destino)."
      };
    }

    const { data, error } = await targetOwnership.supabase
      .from("upsell_groups")
      .insert({
        business_id: adminContext.businessId,
        name: parsed.name,
        description: parsed.description,
        target_type: parsed.targetType,
        target_id: parsed.targetId,
        is_available: parsed.isAvailable,
        sort_order: parsed.sortOrder
      })
      .select("id")
      .single();

    if (error || !data) {
      if (error?.code === "23505") {
        return {
          error:
            "Este destino ya tiene un grupo de plus. Editá o activá/desactivá el existente."
        };
      }
      throw new Error("No pudimos crear el grupo de plus.");
    }

    revalidateCustomizationPaths();
    return {
      success: true,
      message: "Grupo de plus creado.",
      upsellGroupId: data.id
    };
  } catch (error) {
    logActionFailure("customizations.upsell.create", error);
    return {
      error: getActionErrorMessage(error, "No pudimos crear el grupo de plus.")
    };
  }
}

export async function updateUpsellGroupAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const upsellGroupId = getId(formData, "upsell_group_id");
  if (!upsellGroupId) {
    return { error: "Falta identificar el grupo de plus." };
  }

  const parsed = parseUpsellGroupInput(formData);
  if ("error" in parsed) {
    return { error: parsed.error };
  }

  try {
    const adminContext = await requireAdminPermission("manageProducts");
    const ownership = await assertUpsellGroupOwnership(
      upsellGroupId,
      adminContext.businessId
    );
    if ("error" in ownership) {
      return { error: ownership.error };
    }

    const targetOwnership = await assertTargetOwnership(
      parsed.targetType,
      parsed.targetId,
      adminContext.businessId
    );
    if ("error" in targetOwnership) {
      return { error: targetOwnership.error };
    }

    if (
      ownership.upsellGroup.target_type !== parsed.targetType ||
      ownership.upsellGroup.target_id !== parsed.targetId
    ) {
      const { data: conflict } = await ownership.supabase
        .from("upsell_groups")
        .select("id")
        .eq("business_id", adminContext.businessId)
        .eq("target_type", parsed.targetType)
        .eq("target_id", parsed.targetId)
        .neq("id", upsellGroupId)
        .maybeSingle();

      if (conflict) {
        return {
          error: "Ese destino ya tiene otro grupo de plus. Máximo 1 por destino."
        };
      }
    }

    const { error } = await ownership.supabase
      .from("upsell_groups")
      .update({
        name: parsed.name,
        description: parsed.description,
        target_type: parsed.targetType,
        target_id: parsed.targetId,
        is_available: parsed.isAvailable,
        sort_order: parsed.sortOrder
      })
      .eq("id", upsellGroupId)
      .eq("business_id", adminContext.businessId);

    if (error) {
      if (error.code === "23505") {
        return {
          error: "Ese destino ya tiene otro grupo de plus. Máximo 1 por destino."
        };
      }
      throw new Error("No pudimos actualizar el grupo de plus.");
    }

    revalidateCustomizationPaths();
    return { success: true, message: "Grupo de plus actualizado." };
  } catch (error) {
    logActionFailure("customizations.upsell.update", error, { upsellGroupId });
    return {
      error: getActionErrorMessage(error, "No pudimos actualizar el grupo de plus.")
    };
  }
}

export async function toggleUpsellGroupAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const upsellGroupId = getId(formData, "upsell_group_id");
  const isAvailable = getBooleanToggle(formData, "is_available");

  if (!upsellGroupId) {
    return { error: "Falta identificar el grupo de plus." };
  }

  try {
    const adminContext = await requireAdminPermission("manageProducts");
    const ownership = await assertUpsellGroupOwnership(
      upsellGroupId,
      adminContext.businessId
    );
    if ("error" in ownership) {
      return { error: ownership.error };
    }

    // Unique por target garantiza ≤1 fila; al activar no puede haber otro activo.
    const { error } = await ownership.supabase
      .from("upsell_groups")
      .update({ is_available: isAvailable })
      .eq("id", upsellGroupId)
      .eq("business_id", adminContext.businessId);

    if (error) {
      throw new Error("No pudimos actualizar la disponibilidad del grupo de plus.");
    }

    revalidateCustomizationPaths();
    return {
      success: true,
      message: isAvailable ? "Grupo de plus activado." : "Grupo de plus desactivado."
    };
  } catch (error) {
    logActionFailure("customizations.upsell.toggle", error, { upsellGroupId });
    return {
      error: getActionErrorMessage(
        error,
        "No pudimos actualizar la disponibilidad del grupo de plus."
      )
    };
  }
}

export async function addUpsellGroupItemAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = parseUpsellItemInput(formData);
  if ("error" in parsed) {
    return { error: parsed.error };
  }

  try {
    const adminContext = await requireAdminPermission("manageProducts");
    const groupOwnership = await assertUpsellGroupOwnership(
      parsed.upsellGroupId,
      adminContext.businessId
    );
    if ("error" in groupOwnership) {
      return { error: groupOwnership.error };
    }

    const productOwnership = await assertProductOwnership(
      parsed.productId,
      adminContext.businessId
    );
    if ("error" in productOwnership) {
      return { error: productOwnership.error };
    }

    if (
      groupOwnership.upsellGroup.target_type === "product" &&
      groupOwnership.upsellGroup.target_id === parsed.productId
    ) {
      return { error: "No podés sugerir el mismo producto como plus de sí mismo." };
    }

    const { data: existing, error: existingError } = await groupOwnership.supabase
      .from("upsell_group_items")
      .select("id")
      .eq("business_id", adminContext.businessId)
      .eq("upsell_group_id", parsed.upsellGroupId)
      .eq("product_id", parsed.productId)
      .maybeSingle();

    if (existingError) {
      throw new Error("No pudimos validar productos sugeridos existentes.");
    }

    if (existing) {
      return { error: "Ese producto ya está en este grupo de plus." };
    }

    const { data, error } = await groupOwnership.supabase
      .from("upsell_group_items")
      .insert({
        business_id: adminContext.businessId,
        upsell_group_id: parsed.upsellGroupId,
        product_id: parsed.productId,
        is_available: parsed.isAvailable,
        sort_order: parsed.sortOrder
      })
      .select("id")
      .single();

    if (error || !data) {
      if (error?.code === "23505") {
        return { error: "Ese producto ya está en este grupo de plus." };
      }
      throw new Error("No pudimos agregar el producto sugerido.");
    }

    revalidateCustomizationPaths();
    return {
      success: true,
      message: "Producto sugerido agregado.",
      upsellItemId: data.id
    };
  } catch (error) {
    logActionFailure("customizations.upsell.item.add", error);
    return {
      error: getActionErrorMessage(error, "No pudimos agregar el producto sugerido.")
    };
  }
}

export async function updateUpsellGroupItemAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const itemId = getId(formData, "upsell_item_id");
  if (!itemId) {
    return { error: "Falta identificar el producto sugerido." };
  }

  const sortRaw = formData.get("sort_order");
  const sortValue = typeof sortRaw === "string" ? sortRaw.trim() : "";
  if (!sortValue || !/^\d+$/.test(sortValue)) {
    return { error: "El orden debe ser un número entero mayor o igual a 0." };
  }

  const isAvailableRaw = formData.get("is_available");
  const hasAvailable = isAvailableRaw !== null;
  const isAvailable = getBooleanToggle(formData, "is_available");

  try {
    const adminContext = await requireAdminPermission("manageProducts");
    const ownership = await assertUpsellItemOwnership(itemId, adminContext.businessId);
    if ("error" in ownership) {
      return { error: ownership.error };
    }

    const payload: { sort_order: number; is_available?: boolean } = {
      sort_order: Number.parseInt(sortValue, 10)
    };
    if (hasAvailable) {
      payload.is_available = isAvailable;
    }

    const { error } = await ownership.supabase
      .from("upsell_group_items")
      .update(payload)
      .eq("id", itemId)
      .eq("business_id", adminContext.businessId);

    if (error) {
      throw new Error("No pudimos actualizar el producto sugerido.");
    }

    revalidateCustomizationPaths();
    return { success: true, message: "Producto sugerido actualizado." };
  } catch (error) {
    logActionFailure("customizations.upsell.item.update", error, { itemId });
    return {
      error: getActionErrorMessage(error, "No pudimos actualizar el producto sugerido.")
    };
  }
}

export async function toggleUpsellGroupItemAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const itemId = getId(formData, "upsell_item_id");
  const isAvailable = getBooleanToggle(formData, "is_available");

  if (!itemId) {
    return { error: "Falta identificar el producto sugerido." };
  }

  try {
    const adminContext = await requireAdminPermission("manageProducts");
    const ownership = await assertUpsellItemOwnership(itemId, adminContext.businessId);
    if ("error" in ownership) {
      return { error: ownership.error };
    }

    const { error } = await ownership.supabase
      .from("upsell_group_items")
      .update({ is_available: isAvailable })
      .eq("id", itemId)
      .eq("business_id", adminContext.businessId);

    if (error) {
      throw new Error("No pudimos actualizar la disponibilidad del producto sugerido.");
    }

    revalidateCustomizationPaths();
    return {
      success: true,
      message: isAvailable
        ? "Producto sugerido activado."
        : "Producto sugerido desactivado."
    };
  } catch (error) {
    logActionFailure("customizations.upsell.item.toggle", error, { itemId });
    return {
      error: getActionErrorMessage(
        error,
        "No pudimos actualizar la disponibilidad del producto sugerido."
      )
    };
  }
}

export async function loadProductCustomizationInheritanceAction(
  productId: string
): Promise<
  | { ok: true; data: ProductCustomizationInheritance }
  | { ok: false; error: string }
> {
  const trimmed = productId.trim();
  if (!trimmed) {
    return { ok: false, error: "Falta identificar el producto." };
  }

  try {
    const adminContext = await requireAdminPermission("manageProducts");
    const data = await getProductCustomizationInheritanceForAdmin(
      adminContext.businessId,
      trimmed
    );

    if (!data) {
      return { ok: false, error: "El producto no existe o no pertenece a tu negocio." };
    }

    return { ok: true, data };
  } catch (error) {
    logActionFailure("customizations.inheritance.load", error, { productId: trimmed });
    return {
      ok: false,
      error: getActionErrorMessage(
        error,
        "No pudimos cargar la herencia de personalización."
      )
    };
  }
}

export async function reorderCustomizationGroupsAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = parseOrderedIdsJson(getId(formData, "orderedIdsJson"));
  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const { orderedIds } = parsed;

  try {
    const adminContext = await requireAdminPermission("manageProducts");
    const supabase = await createSupabaseServerClient();

    const { data: existing, error: loadError } = await supabase
      .from("customization_groups")
      .select("id")
      .eq("business_id", adminContext.businessId)
      .in("id", orderedIds);

    if (loadError) {
      throw new Error("No pudimos verificar los grupos.");
    }

    const ownedIds = new Set((existing ?? []).map((row) => row.id));
    if (ownedIds.size !== orderedIds.length || orderedIds.some((id) => !ownedIds.has(id))) {
      return { error: "Uno o más grupos no existen o no pertenecen a tu negocio." };
    }

    const sortRows = buildIncrementalSortOrders(orderedIds);
    const results = await Promise.all(
      sortRows.map((row) =>
        supabase
          .from("customization_groups")
          .update({ sort_order: row.sort_order })
          .eq("id", row.id)
          .eq("business_id", adminContext.businessId)
      )
    );

    if (results.some((result) => result.error)) {
      throw new Error("No pudimos actualizar el orden de grupos.");
    }

    revalidateCustomizationPaths();
    return { success: true, message: "Orden de grupos actualizado." };
  } catch (error) {
    logActionFailure("customizations.groups.reorder", error);
    return {
      error: getActionErrorMessage(error, "No se pudo actualizar el orden.")
    };
  }
}

export async function reorderCustomizationOptionsAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const groupId = getId(formData, "groupId");
  if (!groupId) {
    return { error: "Falta identificar el grupo." };
  }

  const parsed = parseOrderedIdsJson(getId(formData, "orderedIdsJson"));
  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const { orderedIds } = parsed;

  try {
    const adminContext = await requireAdminPermission("manageProducts");
    const groupOwnership = await assertGroupOwnership(groupId, adminContext.businessId);
    if ("error" in groupOwnership) {
      return { error: groupOwnership.error };
    }

    const { data: existing, error: loadError } = await groupOwnership.supabase
      .from("customization_options")
      .select("id, group_id")
      .eq("business_id", adminContext.businessId)
      .eq("group_id", groupId)
      .in("id", orderedIds);

    if (loadError) {
      throw new Error("No pudimos verificar las opciones.");
    }

    const ownedIds = new Set((existing ?? []).map((row) => row.id));
    if (
      ownedIds.size !== orderedIds.length ||
      orderedIds.some((id) => !ownedIds.has(id)) ||
      (existing ?? []).some((row) => row.group_id !== groupId)
    ) {
      return {
        error: "Una o más opciones no existen o no pertenecen a ese grupo."
      };
    }

    const sortRows = buildIncrementalSortOrders(orderedIds);
    const results = await Promise.all(
      sortRows.map((row) =>
        groupOwnership.supabase
          .from("customization_options")
          .update({ sort_order: row.sort_order })
          .eq("id", row.id)
          .eq("group_id", groupId)
          .eq("business_id", adminContext.businessId)
      )
    );

    if (results.some((result) => result.error)) {
      throw new Error("No pudimos actualizar el orden de opciones.");
    }

    revalidateCustomizationPaths();
    return { success: true, message: "Orden de opciones actualizado." };
  } catch (error) {
    logActionFailure("customizations.options.reorder", error, { groupId });
    return {
      error: getActionErrorMessage(error, "No se pudo actualizar el orden.")
    };
  }
}

export async function reorderCustomizationAssignmentsAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const targetTypeRaw = getId(formData, "targetType");
  const targetId = getId(formData, "targetId");

  if (targetTypeRaw !== "category" && targetTypeRaw !== "product") {
    return { error: "El destino debe ser categoría o producto." };
  }

  if (!targetId) {
    return { error: "Falta identificar el destino." };
  }

  const parsed = parseOrderedIdsJson(getId(formData, "orderedIdsJson"));
  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const { orderedIds } = parsed;
  const targetType = targetTypeRaw;

  try {
    const adminContext = await requireAdminPermission("manageProducts");
    const supabase = await createSupabaseServerClient();

    if (targetType === "category") {
      const { data: category, error: categoryError } = await supabase
        .from("categories")
        .select("id")
        .eq("id", targetId)
        .eq("business_id", adminContext.businessId)
        .maybeSingle();

      if (categoryError) {
        throw new Error("No pudimos verificar la categoría.");
      }
      if (!category) {
        return { error: "La categoría no existe o no pertenece a tu negocio." };
      }
    } else {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("id")
        .eq("id", targetId)
        .eq("business_id", adminContext.businessId)
        .maybeSingle();

      if (productError) {
        throw new Error("No pudimos verificar el producto.");
      }
      if (!product) {
        return { error: "El producto no existe o no pertenece a tu negocio." };
      }
    }

    const { data: existing, error: loadError } = await supabase
      .from("customization_group_assignments")
      .select("id, target_type, target_id")
      .eq("business_id", adminContext.businessId)
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .in("id", orderedIds);

    if (loadError) {
      throw new Error("No pudimos verificar las asignaciones.");
    }

    const ownedIds = new Set((existing ?? []).map((row) => row.id));
    if (
      ownedIds.size !== orderedIds.length ||
      orderedIds.some((id) => !ownedIds.has(id)) ||
      (existing ?? []).some(
        (row) => row.target_type !== targetType || row.target_id !== targetId
      )
    ) {
      return {
        error: "Una o más asignaciones no existen o no pertenecen a ese destino."
      };
    }

    const sortRows = buildIncrementalSortOrders(orderedIds);
    const results = await Promise.all(
      sortRows.map((row) =>
        supabase
          .from("customization_group_assignments")
          .update({ sort_order: row.sort_order })
          .eq("id", row.id)
          .eq("business_id", adminContext.businessId)
          .eq("target_type", targetType)
          .eq("target_id", targetId)
      )
    );

    if (results.some((result) => result.error)) {
      throw new Error("No pudimos actualizar el orden de asignaciones.");
    }

    revalidateCustomizationPaths();
    return { success: true, message: "Orden de assignments actualizado." };
  } catch (error) {
    logActionFailure("customizations.assignments.reorder", error, {
      targetType,
      targetId
    });
    return {
      error: getActionErrorMessage(error, "No se pudo actualizar el orden.")
    };
  }
}

