import "server-only";

import { unstable_noStore as noStore } from "next/cache";
import { isProductCustomizationEnabled } from "@/lib/product-customization/flags";
import {
  computeMinimumRequiredDelta,
  type PublicCustomizationGroup,
  type PublicProductCustomizationConfig,
  type PublicProductCustomizationSummary,
  type PublicUpsellGroupView
} from "@/lib/product-customization/public-shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ProductRow = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
};

type AssignmentRow = {
  id: string;
  group_id: string;
  target_type: "category" | "product";
  target_id: string;
  is_enabled: boolean;
  sort_order: number;
  created_at: string;
};

type GroupRow = {
  id: string;
  name: string;
  description: string | null;
  selection_type: "single" | "multiple";
  is_required: boolean;
  min_selections: number;
  max_selections: number | null;
  is_available: boolean;
  sort_order: number;
  created_at: string;
};

type OptionRow = {
  id: string;
  group_id: string;
  name: string;
  description: string | null;
  price_delta: number;
  is_available: boolean;
  sort_order: number;
  created_at: string;
};

type OverrideRow = {
  override_type: "group" | "option";
  group_id: string | null;
  option_id: string | null;
  is_enabled: boolean;
};

function emptySummary(productId: string): PublicProductCustomizationSummary {
  return {
    productId,
    hasCustomizations: false,
    hasPaidCustomizations: false,
    hasUpsell: false,
    priceFrom: null
  };
}

function sortResolvedGroups(
  groups: Array<{
    group: GroupRow;
    assignmentSortOrder: number;
    createdAt: string;
  }>
) {
  return [...groups].sort((a, b) => {
    if (a.assignmentSortOrder !== b.assignmentSortOrder) {
      return a.assignmentSortOrder - b.assignmentSortOrder;
    }
    if (a.group.sort_order !== b.group.sort_order) {
      return a.group.sort_order - b.group.sort_order;
    }
    return a.createdAt.localeCompare(b.createdAt);
  });
}

function resolveGroupsForProduct(params: {
  productId: string;
  categoryId: string | null;
  assignments: AssignmentRow[];
  groupsById: Map<string, GroupRow>;
  optionsByGroupId: Map<string, OptionRow[]>;
  overrides: OverrideRow[];
}): PublicCustomizationGroup[] {
  const disabledGroupIds = new Set(
    params.overrides
      .filter(
        (row) =>
          row.override_type === "group" && row.group_id && row.is_enabled === false
      )
      .map((row) => row.group_id as string)
  );

  const disabledOptionIds = new Set(
    params.overrides
      .filter(
        (row) =>
          row.override_type === "option" && row.option_id && row.is_enabled === false
      )
      .map((row) => row.option_id as string)
  );

  type Resolved = {
    group: GroupRow;
    assignmentSortOrder: number;
    createdAt: string;
    source: "category" | "product";
  };

  const resolvedByGroup = new Map<string, Resolved>();

  for (const assignment of params.assignments) {
    if (!assignment.is_enabled) {
      continue;
    }

    const matchesProduct =
      assignment.target_type === "product" && assignment.target_id === params.productId;
    const matchesCategory =
      assignment.target_type === "category" &&
      params.categoryId !== null &&
      assignment.target_id === params.categoryId;

    if (!matchesProduct && !matchesCategory) {
      continue;
    }

    const group = params.groupsById.get(assignment.group_id);
    if (!group || !group.is_available) {
      continue;
    }

    if (disabledGroupIds.has(group.id)) {
      continue;
    }

    const candidate: Resolved = {
      group,
      assignmentSortOrder: assignment.sort_order,
      createdAt: assignment.created_at,
      source: assignment.target_type
    };

    const existing = resolvedByGroup.get(group.id);
    if (!existing) {
      resolvedByGroup.set(group.id, candidate);
      continue;
    }

    if (existing.source === "category" && candidate.source === "product") {
      resolvedByGroup.set(group.id, candidate);
    }
  }

  const sorted = sortResolvedGroups([...resolvedByGroup.values()]);

  const result: PublicCustomizationGroup[] = [];

  for (const resolved of sorted) {
    const options = (params.optionsByGroupId.get(resolved.group.id) ?? [])
      .filter(
        (option) =>
          option.is_available && !disabledOptionIds.has(option.id)
      )
      .sort((a, b) => {
        if (a.sort_order !== b.sort_order) {
          return a.sort_order - b.sort_order;
        }
        return a.created_at.localeCompare(b.created_at);
      })
      .map((option) => ({
        id: option.id,
        name: option.name,
        description: option.description,
        priceDelta: Number(option.price_delta)
      }));

    const isRequired = resolved.group.is_required;
    const isBlocked = isRequired && options.length === 0;

    if (options.length === 0 && !isRequired) {
      continue;
    }

    result.push({
      id: resolved.group.id,
      name: resolved.group.name,
      description: resolved.group.description,
      selectionType: resolved.group.selection_type,
      isRequired,
      minSelections: resolved.group.min_selections,
      maxSelections: resolved.group.max_selections,
      options,
      isBlocked
    });
  }

  return result;
}

async function loadPublicCustomizationCorpus(businessId: string, productIds: string[]) {
  // Anon/authenticated SSR client. Public SELECT policies gate on
  // is_public_product_customization_enabled(business_id) (SECURITY DEFINER
  // boolean helper) so anon does not need SELECT on business_settings.
  // Callers already fail-closed via isProductCustomizationEnabled.
  const supabase = await createSupabaseServerClient();

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, category_id, name, description, price, image_url, is_available")
    .eq("business_id", businessId)
    .in("id", productIds);

  if (productsError) {
    throw new Error("No pudimos cargar productos para personalización.");
  }

  const productRows = (products ?? []) as ProductRow[];
  const categoryIds = [
    ...new Set(productRows.map((row) => row.category_id).filter(Boolean))
  ];

  const assignmentOrFilters: string[] = [];
  for (const productId of productIds) {
    assignmentOrFilters.push(`and(target_type.eq.product,target_id.eq.${productId})`);
  }
  for (const categoryId of categoryIds) {
    assignmentOrFilters.push(`and(target_type.eq.category,target_id.eq.${categoryId})`);
  }

  const upsellOrFilters = [...assignmentOrFilters];

  const [
    { data: assignments, error: assignmentsError },
    { data: groups, error: groupsError },
    { data: options, error: optionsError },
    { data: overrides, error: overridesError },
    { data: upsellGroups, error: upsellGroupsError },
    { data: upsellItems, error: upsellItemsError }
  ] = await Promise.all([
    assignmentOrFilters.length > 0
      ? supabase
          .from("customization_group_assignments")
          .select(
            "id, group_id, target_type, target_id, is_enabled, sort_order, created_at"
          )
          .eq("business_id", businessId)
          .eq("is_enabled", true)
          .or(assignmentOrFilters.join(","))
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("customization_groups")
      .select(
        "id, name, description, selection_type, is_required, min_selections, max_selections, is_available, sort_order, created_at"
      )
      .eq("business_id", businessId)
      .eq("is_available", true),
    supabase
      .from("customization_options")
      .select(
        "id, group_id, name, description, price_delta, is_available, sort_order, created_at"
      )
      .eq("business_id", businessId)
      .eq("is_available", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("product_customization_overrides")
      .select("override_type, group_id, option_id, is_enabled, product_id")
      .eq("business_id", businessId)
      .in("product_id", productIds),
    upsellOrFilters.length > 0
      ? supabase
          .from("upsell_groups")
          .select(
            "id, name, description, target_type, target_id, is_available, sort_order"
          )
          .eq("business_id", businessId)
          .eq("is_available", true)
          .or(upsellOrFilters.join(","))
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("upsell_group_items")
      .select("id, upsell_group_id, product_id, is_available, sort_order")
      .eq("business_id", businessId)
      .eq("is_available", true)
      .order("sort_order", { ascending: true })
  ]);

  if (
    assignmentsError ||
    groupsError ||
    optionsError ||
    overridesError ||
    upsellGroupsError ||
    upsellItemsError
  ) {
    throw new Error("No pudimos cargar la configuración pública de personalización.");
  }

  const suggestedProductIds = [
    ...new Set((upsellItems ?? []).map((item) => item.product_id))
  ];

  const { data: suggestedProducts, error: suggestedError } =
    suggestedProductIds.length > 0
      ? await supabase
          .from("products")
          .select("id, name, price, image_url, is_available")
          .eq("business_id", businessId)
          .eq("is_available", true)
          .in("id", suggestedProductIds)
      : { data: [], error: null };

  if (suggestedError) {
    throw new Error("No pudimos cargar productos sugeridos.");
  }

  const groupsById = new Map((groups ?? []).map((row) => [row.id, row as GroupRow]));
  const optionsByGroupId = new Map<string, OptionRow[]>();
  for (const option of (options ?? []) as OptionRow[]) {
    const current = optionsByGroupId.get(option.group_id) ?? [];
    current.push(option);
    optionsByGroupId.set(option.group_id, current);
  }

  const overridesByProductId = new Map<string, OverrideRow[]>();
  for (const row of overrides ?? []) {
    const productId = (row as { product_id: string }).product_id;
    const current = overridesByProductId.get(productId) ?? [];
    current.push(row as OverrideRow);
    overridesByProductId.set(productId, current);
  }

  const suggestedById = new Map(
    (suggestedProducts ?? []).map((row) => [
      row.id,
      {
        id: row.id,
        name: row.name,
        price: Number(row.price),
        imageUrl: row.image_url
      }
    ])
  );

  const itemsByUpsellGroupId = new Map<string, typeof upsellItems>();
  for (const item of upsellItems ?? []) {
    const current = itemsByUpsellGroupId.get(item.upsell_group_id) ?? [];
    current.push(item);
    itemsByUpsellGroupId.set(item.upsell_group_id, current);
  }

  return {
    productRows,
    assignments: (assignments ?? []) as AssignmentRow[],
    groupsById,
    optionsByGroupId,
    overridesByProductId,
    upsellGroups: upsellGroups ?? [],
    itemsByUpsellGroupId,
    suggestedById
  };
}

function resolveUpsellForProduct(params: {
  productId: string;
  categoryId: string | null;
  upsellGroups: Array<{
    id: string;
    name: string;
    description: string | null;
    target_type: "category" | "product";
    target_id: string;
    is_available: boolean;
  }>;
  itemsByUpsellGroupId: Map<
    string,
    Array<{ product_id: string; is_available: boolean; sort_order: number }>
  >;
  suggestedById: Map<
    string,
    { id: string; name: string; price: number; imageUrl: string | null }
  >;
}): PublicUpsellGroupView | null {
  const productGroup = params.upsellGroups.find(
    (group) =>
      group.is_available &&
      group.target_type === "product" &&
      group.target_id === params.productId
  );
  const categoryGroup =
    !productGroup && params.categoryId
      ? params.upsellGroups.find(
          (group) =>
            group.is_available &&
            group.target_type === "category" &&
            group.target_id === params.categoryId
        )
      : null;

  const selected = productGroup ?? categoryGroup ?? null;
  if (!selected) {
    return null;
  }

  const products = (params.itemsByUpsellGroupId.get(selected.id) ?? [])
    .filter((item) => item.is_available && item.product_id !== params.productId)
    .map((item) => params.suggestedById.get(item.product_id))
    .filter((product): product is NonNullable<typeof product> => Boolean(product));

  if (products.length === 0) {
    return null;
  }

  return {
    id: selected.id,
    name: selected.name,
    description: selected.description,
    products
  };
}

function buildSummaryForProduct(params: {
  product: ProductRow;
  groups: PublicCustomizationGroup[];
  upsellGroup: PublicUpsellGroupView | null;
}): PublicProductCustomizationSummary {
  const hasCustomizations = params.groups.some(
    (group) => group.options.length > 0 || group.isBlocked
  );
  const hasPaidCustomizations = params.groups.some((group) =>
    group.options.some((option) => option.priceDelta > 0)
  );
  const hasUpsell = Boolean(params.upsellGroup && params.upsellGroup.products.length > 0);

  if (!hasCustomizations && !hasUpsell) {
    return emptySummary(params.product.id);
  }

  const basePrice = Number(params.product.price);
  const priceFrom = basePrice + computeMinimumRequiredDelta(params.groups);

  return {
    productId: params.product.id,
    hasCustomizations,
    hasPaidCustomizations,
    hasUpsell,
    priceFrom
  };
}

export async function getPublicCustomizationSummariesForProducts(params: {
  businessId: string;
  productIds: string[];
}): Promise<Map<string, PublicProductCustomizationSummary>> {
  noStore();

  const result = new Map<string, PublicProductCustomizationSummary>();
  const uniqueProductIds = [...new Set(params.productIds.filter(Boolean))];

  for (const productId of uniqueProductIds) {
    result.set(productId, emptySummary(productId));
  }

  if (uniqueProductIds.length === 0) {
    return result;
  }

  const enabled = await isProductCustomizationEnabled(params.businessId);
  if (!enabled) {
    return result;
  }

  try {
    const corpus = await loadPublicCustomizationCorpus(
      params.businessId,
      uniqueProductIds
    );

    for (const product of corpus.productRows) {
      const groups = resolveGroupsForProduct({
        productId: product.id,
        categoryId: product.category_id,
        assignments: corpus.assignments,
        groupsById: corpus.groupsById,
        optionsByGroupId: corpus.optionsByGroupId,
        overrides: corpus.overridesByProductId.get(product.id) ?? []
      });

      const upsellGroup = resolveUpsellForProduct({
        productId: product.id,
        categoryId: product.category_id,
        upsellGroups: corpus.upsellGroups,
        itemsByUpsellGroupId: corpus.itemsByUpsellGroupId,
        suggestedById: corpus.suggestedById
      });

      result.set(
        product.id,
        buildSummaryForProduct({ product, groups, upsellGroup })
      );
    }

    return result;
  } catch (error) {
    console.error("[product-customization] Failed to load public summaries", {
      businessId: params.businessId,
      message: error instanceof Error ? error.message : "unknown"
    });
    return result;
  }
}

export async function getPublicProductCustomizationConfig(params: {
  businessId: string;
  productId: string;
}): Promise<PublicProductCustomizationConfig | null> {
  noStore();

  const productId = params.productId.trim();
  if (!productId) {
    return null;
  }

  const enabled = await isProductCustomizationEnabled(params.businessId);
  if (!enabled) {
    return null;
  }

  const corpus = await loadPublicCustomizationCorpus(params.businessId, [productId]);
  const product = corpus.productRows.find(
    (row) => row.id === productId && row.is_available
  );

  if (!product) {
    return null;
  }

  const groups = resolveGroupsForProduct({
    productId: product.id,
    categoryId: product.category_id,
    assignments: corpus.assignments,
    groupsById: corpus.groupsById,
    optionsByGroupId: corpus.optionsByGroupId,
    overrides: corpus.overridesByProductId.get(product.id) ?? []
  });

  const upsellGroup = resolveUpsellForProduct({
    productId: product.id,
    categoryId: product.category_id,
    upsellGroups: corpus.upsellGroups,
    itemsByUpsellGroupId: corpus.itemsByUpsellGroupId,
    suggestedById: corpus.suggestedById
  });

  return {
    productId: product.id,
    productName: product.name,
    productPrice: Number(product.price),
    productImageUrl: product.image_url,
    productDescription: product.description,
    groups,
    upsellGroup
  };
}
