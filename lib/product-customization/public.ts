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
import { resolveUpsellForProduct } from "@/lib/product-customization/resolve-upsell";
import {
  getSafeErrorDetails,
  throwLoggedCorpusError
} from "@/lib/product-customization/safe-error-details";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

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
  allows_option_quantity?: boolean | null;
  max_total_quantity?: number | null;
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
  max_quantity?: number | null;
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
        priceDelta: Number(option.price_delta),
        maxQuantity:
          typeof option.max_quantity === "number" &&
          Number.isFinite(option.max_quantity) &&
          option.max_quantity >= 1
            ? Math.floor(option.max_quantity)
            : 1
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
      allowsOptionQuantity:
        resolved.group.selection_type === "multiple" &&
        Boolean(resolved.group.allows_option_quantity),
      maxTotalQuantity:
        typeof resolved.group.max_total_quantity === "number" &&
        Number.isFinite(resolved.group.max_total_quantity) &&
        resolved.group.max_total_quantity >= 1
          ? Math.floor(resolved.group.max_total_quantity)
          : null,
      options,
      isBlocked
    });
  }

  return result;
}

type LoadPublicCustomizationCorpusOptions = {
  /** When provided, skips the products re-fetch for the summary/config product ids. */
  products?: ProductRow[];
  /**
   * When true with `products`, resolve suggested/upsell product cards only from
   * that set (no second products query). Safe for full public catalog loads.
   */
  reuseProductsForSuggested?: boolean;
};

/**
 * Loads only customization rows relevant to `productIds` (and their categories).
 * Does NOT fetch all tenant groups/options/upsell items.
 */
async function loadPublicCustomizationCorpus(
  businessId: string,
  productIds: string[],
  corpusOptions?: LoadPublicCustomizationCorpusOptions
) {
  // Cookie-free service client so corpus can run inside unstable_cache.
  // Callers already fail-closed via isProductCustomizationEnabled before load.
  const supabase = createSupabaseServiceClient();

  let productRows: ProductRow[];

  if (corpusOptions?.products) {
    const requestedIds = new Set(productIds);
    productRows = corpusOptions.products.filter((row) => requestedIds.has(row.id));
  } else {
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, category_id, name, description, price, image_url, is_available")
      .eq("business_id", businessId)
      .in("id", productIds);

    if (productsError) {
      throwLoggedCorpusError(
        "No pudimos cargar productos para personalización.",
        productsError,
        { businessId, stage: "products" }
      );
    }

    productRows = (products ?? []) as ProductRow[];
  }

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

  // Phase 1: scoped targets only (assignments / overrides / upsell groups).
  const [
    { data: assignments, error: assignmentsError },
    { data: overrides, error: overridesError },
    { data: upsellGroups, error: upsellGroupsError }
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
      : Promise.resolve({ data: [], error: null })
  ]);

  if (assignmentsError || overridesError || upsellGroupsError) {
    throwLoggedCorpusError(
      "No pudimos cargar la configuración pública de personalización.",
      assignmentsError ?? overridesError ?? upsellGroupsError,
      {
        businessId,
        stage: "assignments_overrides_upsell_groups"
      }
    );
  }

  const relevantGroupIds = [
    ...new Set((assignments ?? []).map((row) => row.group_id).filter(Boolean))
  ];
  const relevantUpsellGroupIds = [
    ...new Set((upsellGroups ?? []).map((row) => row.id).filter(Boolean))
  ];

  // Phase 2: groups/options/items only for IDs derived above.
  const [
    { data: groups, error: groupsError },
    { data: options, error: optionsError },
    { data: upsellItems, error: upsellItemsError }
  ] = await Promise.all([
    relevantGroupIds.length > 0
      ? supabase
          .from("customization_groups")
          .select(
            "id, name, description, selection_type, is_required, min_selections, max_selections, allows_option_quantity, max_total_quantity, is_available, sort_order, created_at"
          )
          .eq("business_id", businessId)
          .eq("is_available", true)
          .in("id", relevantGroupIds)
      : Promise.resolve({ data: [], error: null }),
    relevantGroupIds.length > 0
      ? supabase
          .from("customization_options")
          .select(
            "id, group_id, name, description, price_delta, max_quantity, is_available, sort_order, created_at"
          )
          .eq("business_id", businessId)
          .eq("is_available", true)
          .in("group_id", relevantGroupIds)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    relevantUpsellGroupIds.length > 0
      ? supabase
          .from("upsell_group_items")
          .select("id, upsell_group_id, product_id, is_available, sort_order")
          .eq("business_id", businessId)
          .eq("is_available", true)
          .in("upsell_group_id", relevantUpsellGroupIds)
          .order("sort_order", { ascending: true })
      : Promise.resolve({ data: [], error: null })
  ]);

  if (groupsError || optionsError || upsellItemsError) {
    throwLoggedCorpusError(
      "No pudimos cargar la configuración pública de personalización.",
      groupsError ?? optionsError ?? upsellItemsError,
      {
        businessId,
        stage: "groups_options_upsell_items"
      }
    );
  }

  const suggestedProductIds = [
    ...new Set((upsellItems ?? []).map((item) => item.product_id))
  ];

  const preloadedById = new Map(productRows.map((row) => [row.id, row]));
  const suggestedById = new Map<
    string,
    { id: string; name: string; price: number; imageUrl: string | null }
  >();

  for (const suggestedProductId of suggestedProductIds) {
    const preloaded = preloadedById.get(suggestedProductId);
    if (preloaded?.is_available) {
      suggestedById.set(suggestedProductId, {
        id: preloaded.id,
        name: preloaded.name,
        price: Number(preloaded.price),
        imageUrl: preloaded.image_url
      });
    }
  }

  const missingSuggestedIds = suggestedProductIds.filter(
    (productId) => !suggestedById.has(productId)
  );

  // Waterfall remains only when suggested ids are outside the preloaded set
  // (e.g. single-product modal config). Catalog page passes reuseProductsForSuggested.
  if (missingSuggestedIds.length > 0 && !corpusOptions?.reuseProductsForSuggested) {
    const { data: suggestedProducts, error: suggestedError } = await supabase
      .from("products")
      .select("id, name, price, image_url, is_available")
      .eq("business_id", businessId)
      .eq("is_available", true)
      .in("id", missingSuggestedIds);

    if (suggestedError) {
      throwLoggedCorpusError(
        "No pudimos cargar productos sugeridos.",
        suggestedError,
        { businessId, stage: "suggested_products" }
      );
    }

    for (const row of suggestedProducts ?? []) {
      suggestedById.set(row.id, {
        id: row.id,
        name: row.name,
        price: Number(row.price),
        imageUrl: row.image_url
      });
    }
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

/**
 * Resolve the single effective upsell group for a product.
 * Precedence: available product-target → available category-target.
 */
export { resolveUpsellForProduct } from "@/lib/product-customization/resolve-upsell";

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

type PublicCustomizationSummariesParams = {
  businessId: string;
  productIds: string[];
  /** When provided, skips the feature-flag settings read. */
  productCustomizationEnabled?: boolean;
  /** When provided, skips the products re-fetch inside the corpus loader. */
  products?: ProductRow[];
  /** See loadPublicCustomizationCorpus reuseProductsForSuggested. */
  reuseProductsForSuggested?: boolean;
};

/**
 * Cookie-free summaries loader for unstable_cache.
 * Callers must fail-closed on productCustomizationEnabled / flag first.
 */
export async function loadPublicCustomizationSummariesForProducts(
  params: PublicCustomizationSummariesParams
): Promise<Map<string, PublicProductCustomizationSummary>> {
  const result = new Map<string, PublicProductCustomizationSummary>();
  const uniqueProductIds = [...new Set(params.productIds.filter(Boolean))];

  for (const productId of uniqueProductIds) {
    result.set(productId, emptySummary(productId));
  }

  if (uniqueProductIds.length === 0) {
    return result;
  }

  const enabled = await isProductCustomizationEnabled(params.businessId, {
    productCustomizationEnabled: params.productCustomizationEnabled
  });
  if (!enabled) {
    return result;
  }

  try {
    const corpus = await loadPublicCustomizationCorpus(
      params.businessId,
      uniqueProductIds,
      params.products
        ? {
            products: params.products,
            reuseProductsForSuggested: params.reuseProductsForSuggested === true
          }
        : undefined
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
    console.error(
      "[product-customization] Failed to load public summaries",
      JSON.stringify({
        businessId: params.businessId,
        ...getSafeErrorDetails(error)
      })
    );
    return result;
  }
}

export async function getPublicCustomizationSummariesForProducts(
  params: PublicCustomizationSummariesParams
): Promise<Map<string, PublicProductCustomizationSummary>> {
  noStore();
  return loadPublicCustomizationSummariesForProducts(params);
}

type CatalogSummaryProductInput = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
};

/**
 * Summary-lite entrypoint for the public catalog page.
 * Computes card summaries for visible products only (filtered corpus).
 * Does not load modal config, checkout validation, or full tenant groups/options.
 */
export async function loadPublicCustomizationSummariesForCatalogProducts(params: {
  businessId: string;
  products: CatalogSummaryProductInput[];
  productCustomizationEnabled: boolean;
}): Promise<Map<string, PublicProductCustomizationSummary>> {
  const corpusProducts: ProductRow[] = params.products.map((product) => ({
    id: product.id,
    category_id: product.category_id,
    name: product.name,
    description: product.description,
    price: product.price,
    image_url: product.image_url,
    is_available: true
  }));

  return loadPublicCustomizationSummariesForProducts({
    businessId: params.businessId,
    productIds: corpusProducts.map((product) => product.id),
    productCustomizationEnabled: params.productCustomizationEnabled,
    products: corpusProducts,
    reuseProductsForSuggested: true
  });
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
