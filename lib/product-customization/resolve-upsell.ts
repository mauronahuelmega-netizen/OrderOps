/**
 * Pure public upsell resolution (single effective group).
 * Precedence: available product-target → available category-target.
 * Unavailable product-target does not block category fallback.
 */

import type { PublicUpsellGroupView } from "@/lib/product-customization/public-shared";

export type ResolveUpsellGroupRow = {
  id: string;
  name: string;
  description: string | null;
  target_type: "category" | "product";
  target_id: string;
  is_available: boolean;
};

/**
 * Resolve the single effective Plus group for a product.
 */
export function resolveUpsellForProduct(params: {
  productId: string;
  categoryId: string | null;
  upsellGroups: ResolveUpsellGroupRow[];
  itemsByUpsellGroupId: Map<
    string,
    Array<{ product_id: string; is_available: boolean; sort_order: number }>
  >;
  suggestedById: Map<
    string,
    { id: string; name: string; price: number; imageUrl: string | null }
  >;
}): PublicUpsellGroupView | null {
  const eligible = params.upsellGroups.filter((group) => group.is_available);

  const productGroup = eligible.find(
    (group) =>
      group.target_type === "product" && group.target_id === params.productId
  );
  const categoryGroup =
    !productGroup && params.categoryId
      ? eligible.find(
          (group) =>
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
