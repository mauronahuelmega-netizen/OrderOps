import {
  buildCartConfigurationSignature,
  selectedGroupsToSignatureInput
} from "@/lib/cart/signature";
import type {
  LocalCartItem,
  LocalCartItemV2,
  LocalCartLegacyItem,
  LocalCartSelectedGroup
} from "@/lib/cart/types";
import {
  cartContainsCustomizedItems,
  isLocalCartItemV2,
  isLocalCartLegacyItem
} from "@/lib/cart/types";
import type {
  PublicCustomizationGroup,
  PublicProductCustomizationConfig,
  PublicUpsellSuggestedProduct
} from "@/lib/product-customization/public-shared";

export type {
  LocalCartItem,
  LocalCartItemV2,
  LocalCartLegacyItem,
  LocalCartSelectedGroup
} from "@/lib/cart/types";

export {
  cartContainsCustomizedItems,
  isLocalCartItemV2,
  isLocalCartLegacyItem
} from "@/lib/cart/types";

export { buildCartConfigurationSignature } from "@/lib/cart/signature";

export type CartStorageScope = "public" | "preview";

export function getCartStorageKey(
  businessId: string,
  scope: CartStorageScope = "public"
) {
  return scope === "preview"
    ? `orderops-preview-cart:${businessId}`
    : `orderops-cart:${businessId}`;
}

export function getCartV2StorageKey(
  businessId: string,
  scope: CartStorageScope = "public"
) {
  return scope === "preview"
    ? `orderops-preview-cart-v2:${businessId}`
    : `orderops-cart-v2:${businessId}`;
}

export function getCartStorageKeys(
  businessId: string,
  scope: CartStorageScope = "public"
) {
  return {
    legacy: getCartStorageKey(businessId, scope),
    v2: getCartV2StorageKey(businessId, scope)
  };
}

function createCartLineId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function recalculateV2Line(item: LocalCartItemV2, quantity: number): LocalCartItemV2 {
  const safeQuantity = Math.max(0, quantity);
  return {
    ...item,
    quantity: safeQuantity,
    lineTotal: item.finalUnitPrice * safeQuantity,
    updatedAt: nowIso()
  };
}

/** Legacy-only parser used by checkout submit path. */
export function parseLocalCartItems(value: string | null): LocalCartLegacyItem[] {
  if (!value) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(value) as unknown;

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter((item): item is LocalCartLegacyItem => {
      if (!item || typeof item !== "object") {
        return false;
      }

      const candidate = item as Record<string, unknown>;

      if (candidate.schemaVersion === 2 || typeof candidate.cartLineId === "string") {
        return false;
      }

      return (
        typeof candidate.productId === "string" &&
        typeof candidate.categoryId === "string" &&
        typeof candidate.name === "string" &&
        typeof candidate.price === "number" &&
        typeof candidate.quantity === "number" &&
        candidate.quantity > 0
      );
    });
  } catch {
    return [];
  }
}

export function parseLocalCartV2Items(value: string | null): LocalCartItemV2[] {
  if (!value) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(value) as unknown;

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter((item): item is LocalCartItemV2 => {
      if (!item || typeof item !== "object") {
        return false;
      }

      const candidate = item as Partial<LocalCartItemV2>;

      return (
        candidate.schemaVersion === 2 &&
        typeof candidate.cartLineId === "string" &&
        typeof candidate.productId === "string" &&
        typeof candidate.productName === "string" &&
        typeof candidate.quantity === "number" &&
        candidate.quantity > 0 &&
        (candidate.itemKind === "product" || candidate.itemKind === "upsell") &&
        typeof candidate.configurationSignature === "string" &&
        typeof candidate.finalUnitPrice === "number" &&
        typeof candidate.lineTotal === "number"
      );
    });
  } catch {
    return [];
  }
}

export function loadUnifiedCartItems(
  businessId: string,
  scope: CartStorageScope = "public"
): LocalCartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  const keys = getCartStorageKeys(businessId, scope);
  const legacy = parseLocalCartItems(window.localStorage.getItem(keys.legacy));
  const v2 = parseLocalCartV2Items(window.localStorage.getItem(keys.v2));

  return [...legacy, ...v2];
}

export function persistUnifiedCartItems(
  businessId: string,
  items: LocalCartItem[],
  scope: CartStorageScope = "public"
) {
  const keys = getCartStorageKeys(businessId, scope);
  const legacyItems = items.filter(isLocalCartLegacyItem);
  const v2Items = items.filter(isLocalCartItemV2);

  window.localStorage.setItem(keys.legacy, JSON.stringify(legacyItems));
  window.localStorage.setItem(keys.v2, JSON.stringify(v2Items));
}

/** Clears only the given scope keys (preview must never touch public keys). */
export function clearUnifiedCartItems(
  businessId: string,
  scope: CartStorageScope = "public"
) {
  if (typeof window === "undefined") {
    return;
  }

  const keys = getCartStorageKeys(businessId, scope);
  window.localStorage.removeItem(keys.legacy);
  window.localStorage.removeItem(keys.v2);
}

export function getCartItemCount(items: LocalCartItem[]) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function getCartItemsTotal(items: LocalCartItem[]) {
  return items.reduce((total, item) => {
    if (isLocalCartItemV2(item)) {
      return total + item.lineTotal;
    }

    return total + item.price * item.quantity;
  }, 0);
}

export function getLegacyQuantityForProduct(
  items: LocalCartItem[],
  productId: string
): number {
  const legacy = items.find(
    (item) => isLocalCartLegacyItem(item) && item.productId === productId
  );
  return legacy?.quantity ?? 0;
}

export function setLegacyProductQuantity(
  items: LocalCartItem[],
  product: {
    id: string;
    category_id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    price: number;
  },
  quantity: number
): LocalCartItem[] {
  const withoutLegacyProduct = items.filter(
    (item) => !(isLocalCartLegacyItem(item) && item.productId === product.id)
  );

  if (quantity <= 0) {
    return withoutLegacyProduct;
  }

  const nextLegacy: LocalCartLegacyItem = {
    schemaVersion: 1,
    productId: product.id,
    categoryId: product.category_id,
    name: product.name,
    description: product.description,
    imageUrl: product.image_url,
    price: Number(product.price),
    quantity
  };

  return [...withoutLegacyProduct, nextLegacy];
}

function buildDisplaySummary(groups: LocalCartSelectedGroup[]): string[] {
  return groups
    .filter((group) => group.selectedOptions.length > 0)
    .map((group) => {
      const optionsLabel = group.selectedOptions
        .map((option) => {
          if (option.priceDelta > 0) {
            return `${option.optionName} (+$${formatPlainAmount(option.priceDelta)})`;
          }
          return option.optionName;
        })
        .join(", ");

      return `${group.groupName}: ${optionsLabel}`;
    });
}

function formatPlainAmount(value: number) {
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 2
  }).format(value);
}

function buildSelectedGroupsFromConfig(
  groups: PublicCustomizationGroup[],
  selectedOptionsByGroupId: Record<string, string[]>
): LocalCartSelectedGroup[] {
  const result: LocalCartSelectedGroup[] = [];

  groups.forEach((group, groupIndex) => {
    const selectedIds = selectedOptionsByGroupId[group.id] ?? [];
    if (selectedIds.length === 0) {
      return;
    }

    const optionById = new Map(group.options.map((option) => [option.id, option]));
    const selectedOptions = selectedIds
      .map((optionId, optionIndex) => {
        const option = optionById.get(optionId);
        if (!option) {
          return null;
        }

        return {
          optionId: option.id,
          optionName: option.name,
          priceDelta: option.priceDelta,
          sortOrder: optionIndex
        };
      })
      .filter((option): option is NonNullable<typeof option> => Boolean(option));

    if (selectedOptions.length === 0) {
      return;
    }

    result.push({
      groupId: group.id,
      groupName: group.name,
      selectionType: group.selectionType,
      isRequired: group.isRequired,
      minSelections: group.minSelections,
      maxSelections: group.maxSelections,
      sortOrder: groupIndex,
      selectedOptions
    });
  });

  return result;
}

export function buildCartLinesFromCustomizationSelection(params: {
  config: PublicProductCustomizationConfig;
  categoryId: string;
  selectedOptionsByGroupId: Record<string, string[]>;
  selectedUpsellProductIds: string[];
  quantity?: number;
}): { parent: LocalCartItemV2; children: LocalCartItemV2[] } {
  const quantity = Math.max(params.quantity ?? 1, 1);
  const selectedGroups = buildSelectedGroupsFromConfig(
    params.config.groups,
    params.selectedOptionsByGroupId
  );

  const customizationTotal = selectedGroups.reduce(
    (sum, group) =>
      sum +
      group.selectedOptions.reduce((optionSum, option) => optionSum + option.priceDelta, 0),
    0
  );

  const baseUnitPrice = params.config.productPrice;
  const finalUnitPrice = baseUnitPrice + customizationTotal;
  const parentCartLineId = createCartLineId();
  const timestamp = nowIso();

  const upsellProducts = params.config.upsellGroup?.products ?? [];
  const selectedUpsells = params.selectedUpsellProductIds
    .map((productId) => upsellProducts.find((product) => product.id === productId))
    .filter((product): product is PublicUpsellSuggestedProduct => Boolean(product));

  const configurationSignature = buildCartConfigurationSignature({
    productId: params.config.productId,
    selectedGroups: selectedGroupsToSignatureInput(selectedGroups),
    upsellProductIds: selectedUpsells.map((product) => product.id)
  });

  const parent: LocalCartItemV2 = {
    schemaVersion: 2,
    cartLineId: parentCartLineId,
    productId: params.config.productId,
    productName: params.config.productName,
    categoryId: params.categoryId,
    productImageUrl: params.config.productImageUrl,
    baseUnitPrice,
    quantity,
    itemKind: "product",
    parentCartLineId: null,
    selectedGroups,
    customizationTotal,
    finalUnitPrice,
    lineTotal: finalUnitPrice * quantity,
    configurationSignature,
    displaySummary: buildDisplaySummary(selectedGroups),
    createdAt: timestamp,
    updatedAt: timestamp
  };

  const children: LocalCartItemV2[] = selectedUpsells.map((product) => {
    const childId = createCartLineId();
    return {
      schemaVersion: 2,
      cartLineId: childId,
      productId: product.id,
      productName: product.name,
      categoryId: params.categoryId,
      productImageUrl: product.imageUrl,
      baseUnitPrice: product.price,
      quantity,
      itemKind: "upsell",
      parentCartLineId,
      selectedGroups: [],
      customizationTotal: 0,
      finalUnitPrice: product.price,
      lineTotal: product.price * quantity,
      configurationSignature: buildCartConfigurationSignature({
        productId: product.id,
        selectedGroups: [],
        upsellProductIds: []
      }),
      displaySummary: [`Plus: ${product.name}`],
      createdAt: timestamp,
      updatedAt: timestamp
    };
  });

  return { parent, children };
}

/**
 * Upsert customized parent (+ synced upsell children).
 * Upsell quantity tracks parent quantity.
 */
export function mergeCustomizedSelectionIntoCart(
  items: LocalCartItem[],
  parent: LocalCartItemV2,
  children: LocalCartItemV2[],
  options?: { replaceCartLineId?: string | null }
): LocalCartItem[] {
  let working = items;

  if (options?.replaceCartLineId) {
    working = removeCartLineWithChildren(working, options.replaceCartLineId);
  }

  const existingParent = working.find(
    (item) =>
      isLocalCartItemV2(item) &&
      item.itemKind === "product" &&
      item.configurationSignature === parent.configurationSignature
  );

  if (existingParent && isLocalCartItemV2(existingParent)) {
    const nextQuantity = existingParent.quantity + parent.quantity;
    const updatedParent = recalculateV2Line(existingParent, nextQuantity);

    const withoutExistingFamily = removeCartLineWithChildren(
      working,
      existingParent.cartLineId
    );

    const remappedChildren = children.map((child) =>
      recalculateV2Line(
        {
          ...child,
          parentCartLineId: updatedParent.cartLineId,
          cartLineId: createCartLineId()
        },
        nextQuantity
      )
    );

    // Preserve any prior upsells that match by productId if children empty? No — children
    // from new selection fully replace upsell set for this signature.
    return [...withoutExistingFamily, updatedParent, ...remappedChildren];
  }

  return [...working, parent, ...children];
}

export function removeCartLineWithChildren(
  items: LocalCartItem[],
  cartLineId: string
): LocalCartItem[] {
  return items.filter((item) => {
    if (!isLocalCartItemV2(item)) {
      return true;
    }

    if (item.cartLineId === cartLineId) {
      return false;
    }

    if (item.parentCartLineId === cartLineId) {
      return false;
    }

    return true;
  });
}

export function removeSingleCartLine(
  items: LocalCartItem[],
  cartLineId: string
): LocalCartItem[] {
  const target = items.find(
    (item) => isLocalCartItemV2(item) && item.cartLineId === cartLineId
  );

  if (!target || !isLocalCartItemV2(target)) {
    return items;
  }

  if (target.itemKind === "product") {
    return removeCartLineWithChildren(items, cartLineId);
  }

  return items.filter(
    (item) => !(isLocalCartItemV2(item) && item.cartLineId === cartLineId)
  );
}

export function setV2ParentQuantity(
  items: LocalCartItem[],
  parentCartLineId: string,
  quantity: number
): LocalCartItem[] {
  if (quantity <= 0) {
    return removeCartLineWithChildren(items, parentCartLineId);
  }

  return items.map((item) => {
    if (!isLocalCartItemV2(item)) {
      return item;
    }

    if (item.cartLineId === parentCartLineId && item.itemKind === "product") {
      return recalculateV2Line(item, quantity);
    }

    if (item.parentCartLineId === parentCartLineId && item.itemKind === "upsell") {
      return recalculateV2Line(item, quantity);
    }

    return item;
  });
}

export type HierarchicalCartRow =
  | {
      kind: "legacy";
      item: LocalCartLegacyItem;
    }
  | {
      kind: "customized";
      parent: LocalCartItemV2;
      children: LocalCartItemV2[];
    };

export function buildHierarchicalCartRows(items: LocalCartItem[]): HierarchicalCartRow[] {
  const rows: HierarchicalCartRow[] = [];
  const v2Parents = items.filter(
    (item): item is LocalCartItemV2 =>
      isLocalCartItemV2(item) && item.itemKind === "product"
  );
  const v2ChildrenByParent = new Map<string, LocalCartItemV2[]>();

  for (const item of items) {
    if (!isLocalCartItemV2(item) || item.itemKind !== "upsell" || !item.parentCartLineId) {
      continue;
    }

    const current = v2ChildrenByParent.get(item.parentCartLineId) ?? [];
    current.push(item);
    v2ChildrenByParent.set(item.parentCartLineId, current);
  }

  for (const item of items) {
    if (isLocalCartLegacyItem(item)) {
      rows.push({ kind: "legacy", item });
      continue;
    }

    if (item.itemKind === "product") {
      rows.push({
        kind: "customized",
        parent: item,
        children: v2ChildrenByParent.get(item.cartLineId) ?? []
      });
    }
  }

  // Keep stable order: legacy + parents as stored; orphan upsells ignored above.
  void v2Parents;

  return rows;
}

export function selectionStateFromCartParent(parent: LocalCartItemV2, children: LocalCartItemV2[]) {
  const selectedOptionsByGroupId: Record<string, string[]> = {};

  for (const group of parent.selectedGroups) {
    selectedOptionsByGroupId[group.groupId] = group.selectedOptions.map(
      (option) => option.optionId
    );
  }

  return {
    selectedOptionsByGroupId,
    selectedUpsellProductIds: children.map((child) => child.productId)
  };
}

export function buildCheckoutCartPayload(items: LocalCartItem[]): {
  legacyItems: Array<{ productId: string; quantity: number }>;
  customizedItems: Array<{
    cartLineId: string;
    productId: string;
    quantity: number;
    configurationSignature: string;
    selectedGroups: Array<{ groupId: string; selectedOptionIds: string[] }>;
    upsellItems: Array<{
      cartLineId: string;
      productId: string;
      quantity: number;
      parentCartLineId: string;
    }>;
  }>;
} {
  const legacyItems = items.filter(isLocalCartLegacyItem).map((item) => ({
    productId: item.productId,
    quantity: item.quantity
  }));

  const parents = items.filter(
    (item): item is LocalCartItemV2 =>
      isLocalCartItemV2(item) && item.itemKind === "product"
  );

  const childrenByParent = new Map<string, LocalCartItemV2[]>();
  for (const item of items) {
    if (!isLocalCartItemV2(item) || item.itemKind !== "upsell" || !item.parentCartLineId) {
      continue;
    }
    const current = childrenByParent.get(item.parentCartLineId) ?? [];
    current.push(item);
    childrenByParent.set(item.parentCartLineId, current);
  }

  const customizedItems = parents.map((parent) => {
    const children = childrenByParent.get(parent.cartLineId) ?? [];
    return {
      cartLineId: parent.cartLineId,
      productId: parent.productId,
      quantity: parent.quantity,
      configurationSignature: parent.configurationSignature,
      selectedGroups: parent.selectedGroups.map((group) => ({
        groupId: group.groupId,
        selectedOptionIds: group.selectedOptions.map((option) => option.optionId)
      })),
      upsellItems: children.map((child) => ({
        cartLineId: child.cartLineId,
        productId: child.productId,
        quantity: child.quantity,
        parentCartLineId: parent.cartLineId
      }))
    };
  });

  return { legacyItems, customizedItems };
}
