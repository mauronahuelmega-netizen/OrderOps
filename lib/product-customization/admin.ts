import "server-only";

import {
  type AdminCatalogProductOption,
  type AdminCustomizationAssignment,
  type AdminCustomizationGroup,
  type AdminCustomizationOption,
  type AdminProductCustomizationOverride,
  type AdminUpsellGroup,
  type AdminUpsellGroupItem,
  type ProductCustomizationInheritance,
  type ProductCustomizationInheritanceGroup
} from "@/lib/product-customization/shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type {
  AdminCatalogProductOption,
  AdminCustomizationAssignment,
  AdminCustomizationGroup,
  AdminCustomizationOption,
  AdminProductCustomizationOverride,
  AdminUpsellGroup,
  AdminUpsellGroupItem,
  CustomizationSelectionType,
  CustomizationTargetType,
  ParsedAssignmentInput,
  ParsedCustomizationGroupInput,
  ParsedCustomizationOptionInput,
  ParsedUpsellGroupInput,
  ParsedUpsellItemInput,
  ProductCustomizationInheritance,
  ProductCustomizationInheritanceGroup,
  ProductCustomizationInheritanceOption
} from "@/lib/product-customization/shared";

export {
  formatCustomizationPriceDelta,
  parseCustomizationAssignmentInput,
  parseCustomizationGroupInput,
  parseCustomizationOptionInput,
  parseOrderedIdsJson,
  parseUpsellGroupInput,
  parseUpsellItemInput,
  suggestNextAssignmentSortOrder,
  suggestNextGroupSortOrder,
  suggestNextOptionSortOrder,
  suggestNextUpsellItemSortOrder,
  suggestNextUpsellSortOrder
} from "@/lib/product-customization/shared";

export async function getCustomizationGroupsForAdmin(
  businessId: string
): Promise<AdminCustomizationGroup[]> {
  const supabase = await createSupabaseServerClient();

  const [{ data: groups, error: groupsError }, { data: options, error: optionsError }] =
    await Promise.all([
      supabase
        .from("customization_groups")
        .select(
          "id, business_id, name, description, selection_type, is_required, min_selections, max_selections, allows_option_quantity, max_total_quantity, is_available, sort_order, created_at, updated_at"
        )
        .eq("business_id", businessId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("customization_options")
        .select(
          "id, business_id, group_id, name, description, price_delta, max_quantity, is_available, sort_order, created_at, updated_at"
        )
        .eq("business_id", businessId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true })
    ]);

  if (groupsError) {
    throw new Error("No pudimos cargar los grupos de personalización.");
  }

  if (optionsError) {
    throw new Error("No pudimos cargar las opciones de personalización.");
  }

  const optionsByGroup = new Map<string, AdminCustomizationOption[]>();

  for (const option of options ?? []) {
    const current = optionsByGroup.get(option.group_id) ?? [];
    current.push(option);
    optionsByGroup.set(option.group_id, current);
  }

  return (groups ?? []).map((group) => ({
    ...group,
    options: optionsByGroup.get(group.id) ?? []
  }));
}

export async function getCatalogProductsForCustomizationAdmin(
  businessId: string
): Promise<AdminCatalogProductOption[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, category_id, price, is_available")
    .eq("business_id", businessId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error("No pudimos cargar los productos del catálogo.");
  }

  return (data ?? []) as AdminCatalogProductOption[];
}

export async function getCustomizationAssignmentsForAdmin(
  businessId: string
): Promise<AdminCustomizationAssignment[]> {
  const supabase = await createSupabaseServerClient();

  const [
    { data: assignments, error: assignmentsError },
    { data: groups, error: groupsError },
    { data: categories, error: categoriesError },
    { data: products, error: productsError }
  ] = await Promise.all([
    supabase
      .from("customization_group_assignments")
      .select(
        "id, business_id, group_id, target_type, target_id, is_enabled, sort_order, created_at, updated_at"
      )
      .eq("business_id", businessId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase.from("customization_groups").select("id, name").eq("business_id", businessId),
    supabase.from("categories").select("id, name").eq("business_id", businessId),
    supabase.from("products").select("id, name").eq("business_id", businessId)
  ]);

  if (assignmentsError || groupsError || categoriesError || productsError) {
    throw new Error("No pudimos cargar las asignaciones de personalización.");
  }

  const groupNames = new Map((groups ?? []).map((row) => [row.id, row.name]));
  const categoryNames = new Map((categories ?? []).map((row) => [row.id, row.name]));
  const productNames = new Map((products ?? []).map((row) => [row.id, row.name]));

  return (assignments ?? []).map((assignment) => {
    const targetName =
      assignment.target_type === "category"
        ? (categoryNames.get(assignment.target_id) ?? "Categoría desconocida")
        : (productNames.get(assignment.target_id) ?? "Producto desconocido");

    return {
      ...assignment,
      group_name: groupNames.get(assignment.group_id) ?? "Grupo desconocido",
      target_name: targetName
    };
  });
}

export async function getUpsellGroupsForAdmin(
  businessId: string
): Promise<AdminUpsellGroup[]> {
  const supabase = await createSupabaseServerClient();

  const [
    { data: groups, error: groupsError },
    { data: items, error: itemsError },
    { data: categories, error: categoriesError },
    { data: products, error: productsError }
  ] = await Promise.all([
    supabase
      .from("upsell_groups")
      .select(
        "id, business_id, name, description, target_type, target_id, is_available, sort_order, created_at, updated_at"
      )
      .eq("business_id", businessId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("upsell_group_items")
      .select(
        "id, business_id, upsell_group_id, product_id, is_available, sort_order, created_at, updated_at"
      )
      .eq("business_id", businessId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase.from("categories").select("id, name").eq("business_id", businessId),
    supabase.from("products").select("id, name, price").eq("business_id", businessId)
  ]);

  if (groupsError || itemsError || categoriesError || productsError) {
    throw new Error("No pudimos cargar los grupos de plus sugeridos.");
  }

  const categoryNames = new Map((categories ?? []).map((row) => [row.id, row.name]));
  const productById = new Map(
    (products ?? []).map((row) => [row.id, { name: row.name, price: row.price }])
  );

  const itemsByGroup = new Map<string, AdminUpsellGroupItem[]>();

  for (const item of items ?? []) {
    const product = productById.get(item.product_id);
    const enriched: AdminUpsellGroupItem = {
      ...item,
      product_name: product?.name ?? "Producto desconocido",
      product_price: product?.price ?? 0
    };
    const current = itemsByGroup.get(item.upsell_group_id) ?? [];
    current.push(enriched);
    itemsByGroup.set(item.upsell_group_id, current);
  }

  return (groups ?? []).map((group) => {
    const targetName =
      group.target_type === "category"
        ? (categoryNames.get(group.target_id) ?? "Categoría desconocida")
        : (productById.get(group.target_id)?.name ?? "Producto desconocido");

    return {
      ...group,
      target_name: targetName,
      items: itemsByGroup.get(group.id) ?? []
    };
  });
}

export async function getProductCustomizationInheritanceForAdmin(
  businessId: string,
  productId: string
): Promise<ProductCustomizationInheritance | null> {
  const supabase = await createSupabaseServerClient();

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, name, category_id")
    .eq("business_id", businessId)
    .eq("id", productId)
    .maybeSingle();

  if (productError) {
    throw new Error("No pudimos cargar el producto para herencia.");
  }

  if (!product) {
    return null;
  }

  let categoryName: string | null = null;
  if (product.category_id) {
    const { data: category } = await supabase
      .from("categories")
      .select("name")
      .eq("business_id", businessId)
      .eq("id", product.category_id)
      .maybeSingle();
    categoryName = category?.name ?? null;
  }

  const assignmentFilters = [`and(target_type.eq.product,target_id.eq.${productId})`];
  if (product.category_id) {
    assignmentFilters.push(
      `and(target_type.eq.category,target_id.eq.${product.category_id})`
    );
  }

  const [
    { data: assignments, error: assignmentsError },
    { data: overrides, error: overridesError },
    { data: groups, error: groupsError },
    { data: options, error: optionsError }
  ] = await Promise.all([
    supabase
      .from("customization_group_assignments")
      .select(
        "id, group_id, target_type, target_id, is_enabled, sort_order, created_at"
      )
      .eq("business_id", businessId)
      .or(assignmentFilters.join(",")),
    supabase
      .from("product_customization_overrides")
      .select("id, override_type, group_id, option_id, is_enabled")
      .eq("business_id", businessId)
      .eq("product_id", productId),
    supabase
      .from("customization_groups")
      .select("id, name, sort_order, created_at, is_available")
      .eq("business_id", businessId),
    supabase
      .from("customization_options")
      .select("id, group_id, name, price_delta, is_available, sort_order, created_at")
      .eq("business_id", businessId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
  ]);

  if (assignmentsError || overridesError || groupsError || optionsError) {
    throw new Error("No pudimos resolver la herencia de personalización.");
  }

  const groupById = new Map((groups ?? []).map((row) => [row.id, row]));
  const optionsByGroup = new Map<string, typeof options>();

  for (const option of options ?? []) {
    const current = optionsByGroup.get(option.group_id) ?? [];
    current.push(option);
    optionsByGroup.set(option.group_id, current);
  }

  const disabledGroupIds = new Set(
    (overrides ?? [])
      .filter(
        (row) =>
          row.override_type === "group" &&
          row.group_id &&
          row.is_enabled === false
      )
      .map((row) => row.group_id as string)
  );

  const disabledOptionIds = new Set(
    (overrides ?? [])
      .filter(
        (row) =>
          row.override_type === "option" &&
          row.option_id &&
          row.is_enabled === false
      )
      .map((row) => row.option_id as string)
  );

  type ResolvedAssignment = {
    assignmentId: string;
    groupId: string;
    source: "category" | "product";
    assignmentSortOrder: number;
    assignmentEnabled: boolean;
    groupSortOrder: number;
    createdAt: string;
  };

  const resolvedByGroup = new Map<string, ResolvedAssignment>();

  for (const assignment of assignments ?? []) {
    const group = groupById.get(assignment.group_id);
    if (!group) {
      continue;
    }

    const candidate: ResolvedAssignment = {
      assignmentId: assignment.id,
      groupId: assignment.group_id,
      source: assignment.target_type,
      assignmentSortOrder: assignment.sort_order,
      assignmentEnabled: assignment.is_enabled,
      groupSortOrder: group.sort_order,
      createdAt: assignment.created_at
    };

    const existing = resolvedByGroup.get(assignment.group_id);
    if (!existing) {
      resolvedByGroup.set(assignment.group_id, candidate);
      continue;
    }

    // Si el mismo grupo aparece por categoría y producto, priorizar assignment directo.
    if (existing.source === "category" && candidate.source === "product") {
      resolvedByGroup.set(assignment.group_id, candidate);
    }
  }

  const inheritanceGroups: ProductCustomizationInheritanceGroup[] = [
    ...resolvedByGroup.values()
  ]
    .sort((a, b) => {
      if (a.assignmentSortOrder !== b.assignmentSortOrder) {
        return a.assignmentSortOrder - b.assignmentSortOrder;
      }
      if (a.groupSortOrder !== b.groupSortOrder) {
        return a.groupSortOrder - b.groupSortOrder;
      }
      return a.createdAt.localeCompare(b.createdAt);
    })
    .map((resolved) => {
      const group = groupById.get(resolved.groupId);
      const groupOptions = optionsByGroup.get(resolved.groupId) ?? [];

      return {
        groupId: resolved.groupId,
        groupName: group?.name ?? "Grupo desconocido",
        source: resolved.source,
        assignmentId: resolved.assignmentId,
        assignmentSortOrder: resolved.assignmentSortOrder,
        assignmentEnabled: resolved.assignmentEnabled,
        isDisabledForProduct: disabledGroupIds.has(resolved.groupId),
        options: groupOptions.map((option) => ({
          optionId: option.id,
          optionName: option.name,
          priceDelta: option.price_delta,
          optionAvailable: option.is_available,
          isDisabledForProduct: disabledOptionIds.has(option.id)
        }))
      };
    });

  return {
    productId: product.id,
    productName: product.name,
    categoryId: product.category_id,
    categoryName,
    groups: inheritanceGroups
  };
}

export async function getCustomizationOverridesForAdmin(
  businessId: string
): Promise<AdminProductCustomizationOverride[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("product_customization_overrides")
    .select(
      "id, business_id, product_id, override_type, group_id, option_id, is_enabled, created_at, updated_at"
    )
    .eq("business_id", businessId);

  if (error) {
    throw new Error("No pudimos cargar las excepciones de personalización.");
  }

  return data ?? [];
}

export async function getCustomizationAdminConfig(businessId: string) {
  const [groups, assignments, upsellGroups, products, overrides] = await Promise.all([
    getCustomizationGroupsForAdmin(businessId),
    getCustomizationAssignmentsForAdmin(businessId),
    getUpsellGroupsForAdmin(businessId),
    getCatalogProductsForCustomizationAdmin(businessId),
    getCustomizationOverridesForAdmin(businessId)
  ]);

  return { groups, assignments, upsellGroups, products, overrides };
}
