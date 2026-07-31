/**
 * Pure helpers for simplified single-group post-add Plus surface (U1).
 * Candidates come from config.upsellGroup.products only (single-group contract).
 */

import {
  isUpsellChildForParent,
  isV2ParentCartItem,
  type LocalCartItem
} from "@/lib/cart/types";
import { buildCartConfigurationSignatureWithUpsell } from "@/lib/cart/signature";
import type { PublicUpsellSuggestedProduct } from "@/lib/product-customization/public-shared";

export type PostAddOverlayDecision =
  | { openPostAdd: true; openCart: false; candidates: PublicUpsellSuggestedProduct[] }
  | { openPostAdd: false; openCart: true; candidates: [] };

/**
 * Whether attaching `suggestedProductId` to the parent would collide with
 * another V2 root's configurationSignature. Pure / non-mutating.
 */
export function wouldUpsellAttachmentConflict(params: {
  items: LocalCartItem[];
  parentCartLineId: string;
  suggestedProductId: string;
}): boolean {
  const parent = params.items.find(
    (item): item is Extract<LocalCartItem, { schemaVersion: 2 }> =>
      isV2ParentCartItem(item) && item.cartLineId === params.parentCartLineId
  );

  if (!parent) {
    return false;
  }

  const existingUpsellProductIds = params.items
    .filter((item) => isUpsellChildForParent(item, parent.cartLineId))
    .map((item) => item.productId);

  if (existingUpsellProductIds.includes(params.suggestedProductId)) {
    return false;
  }

  const nextSignature = buildCartConfigurationSignatureWithUpsell({
    parent,
    existingUpsellProductIds,
    additionalUpsellProductId: params.suggestedProductId
  });

  for (const item of params.items) {
    if (!isV2ParentCartItem(item)) {
      continue;
    }
    if (item.cartLineId === parent.cartLineId) {
      continue;
    }
    if (item.configurationSignature === nextSignature) {
      return true;
    }
  }

  return false;
}

function isValidSuggestedPrice(price: number): boolean {
  return Number.isFinite(price) && price >= 0;
}

/**
 * Eligible Plus candidates for the post-add sheet from a single upsellGroup.
 * Order preserved; max applied after filtering.
 */
export function getEligiblePostAddUpsellCandidates(params: {
  items: LocalCartItem[];
  parentCartLineId: string;
  suggestedProducts: readonly PublicUpsellSuggestedProduct[];
  maxCandidates?: number;
}): PublicUpsellSuggestedProduct[] {
  const maxCandidates = Math.max(params.maxCandidates ?? 3, 0);
  const parent = params.items.find(
    (item): item is Extract<LocalCartItem, { schemaVersion: 2 }> =>
      isV2ParentCartItem(item) && item.cartLineId === params.parentCartLineId
  );

  if (!parent || maxCandidates === 0) {
    return [];
  }

  const attachedIds = new Set(
    params.items
      .filter((item) => isUpsellChildForParent(item, parent.cartLineId))
      .map((item) => item.productId)
  );

  const seen = new Set<string>();
  const eligible: PublicUpsellSuggestedProduct[] = [];

  for (const product of params.suggestedProducts) {
    if (!product?.id || typeof product.id !== "string") {
      continue;
    }
    if (seen.has(product.id)) {
      continue;
    }
    seen.add(product.id);

    if (product.id === parent.productId) {
      continue;
    }
    if (!isValidSuggestedPrice(product.price)) {
      continue;
    }
    if (attachedIds.has(product.id)) {
      continue;
    }
    if (
      wouldUpsellAttachmentConflict({
        items: params.items,
        parentCartLineId: parent.cartLineId,
        suggestedProductId: product.id
      })
    ) {
      continue;
    }

    eligible.push(product);
    if (eligible.length >= maxCandidates) {
      break;
    }
  }

  return eligible;
}

/**
 * Pure overlay decision after a successful merge (for fixtures / CatalogClient).
 */
export function decidePostAddOverlay(params: {
  outcome: "created" | "merged" | "replaced";
  items: LocalCartItem[];
  parentCartLineId: string;
  suggestedProducts: readonly PublicUpsellSuggestedProduct[];
  maxCandidates?: number;
}): PostAddOverlayDecision {
  if (params.outcome !== "created") {
    return { openPostAdd: false, openCart: true, candidates: [] };
  }

  const candidates = getEligiblePostAddUpsellCandidates({
    items: params.items,
    parentCartLineId: params.parentCartLineId,
    suggestedProducts: params.suggestedProducts,
    maxCandidates: params.maxCandidates
  });

  if (candidates.length === 0) {
    return { openPostAdd: false, openCart: true, candidates: [] };
  }

  return { openPostAdd: true, openCart: false, candidates };
}
