/** Client-safe cart types for legacy + Product Customization V2. */

export type LocalCartLegacyItem = {
  schemaVersion?: 1;
  productId: string;
  categoryId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  quantity: number;
};

export type LocalCartSelectedOption = {
  optionId: string;
  optionName: string;
  priceDelta: number;
  /** Extra option quantity. Missing/legacy → treat as 1. */
  quantity?: number;
  sortOrder: number;
};

export type LocalCartSelectedGroup = {
  groupId: string;
  groupName: string;
  selectionType: "single" | "multiple";
  isRequired: boolean;
  minSelections: number;
  maxSelections: number | null;
  /** Hint from config at add time; missing on legacy lines. */
  allowsOptionQuantity?: boolean;
  sortOrder: number;
  selectedOptions: LocalCartSelectedOption[];
};

export type LocalCartItemV2 = {
  schemaVersion: 2;
  cartLineId: string;
  productId: string;
  productName: string;
  categoryId: string;
  productImageUrl: string | null;
  baseUnitPrice: number;
  quantity: number;
  itemKind: "product" | "upsell";
  parentCartLineId: string | null;
  selectedGroups: LocalCartSelectedGroup[];
  customizationTotal: number;
  finalUnitPrice: number;
  lineTotal: number;
  configurationSignature: string;
  displaySummary: string[];
  createdAt: string;
  updatedAt: string;
};

/** Discriminated cart line used by catalog UI. */
export type LocalCartItem = LocalCartLegacyItem | LocalCartItemV2;

export function isLocalCartItemV2(item: LocalCartItem): item is LocalCartItemV2 {
  return (
    typeof item === "object" &&
    item !== null &&
    "schemaVersion" in item &&
    (item as LocalCartItemV2).schemaVersion === 2 &&
    typeof (item as LocalCartItemV2).cartLineId === "string"
  );
}

export function isLocalCartLegacyItem(item: LocalCartItem): item is LocalCartLegacyItem {
  return !isLocalCartItemV2(item);
}

export function isV2ParentCartItem(item: LocalCartItem): item is LocalCartItemV2 {
  return isLocalCartItemV2(item) && item.itemKind === "product" && item.parentCartLineId === null;
}

export function isUpsellChildForParent(
  item: LocalCartItem,
  parentCartLineId: string
): item is LocalCartItemV2 {
  return (
    isLocalCartItemV2(item) &&
    item.itemKind === "upsell" &&
    item.parentCartLineId === parentCartLineId
  );
}

export function cartContainsCustomizedItems(items: LocalCartItem[]): boolean {
  return items.some((item) => isLocalCartItemV2(item));
}
