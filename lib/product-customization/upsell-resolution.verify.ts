/**
 * Pure fixtures for single-upsell realignment (CLEANUP-1).
 * Run: npx tsx lib/product-customization/upsell-resolution.verify.ts
 */

import assert from "node:assert/strict";
import { resolveUpsellForProduct } from "@/lib/product-customization/resolve-upsell";
import {
  productNeedsCustomizationModal,
  type PublicProductCustomizationSummary
} from "@/lib/product-customization/public-shared";
import { parseUpsellGroupInput } from "@/lib/product-customization/shared";

function section(name: string) {
  console.log(`\n✓ ${name}`);
}

const productId = "prod-1";
const categoryId = "cat-1";

function group(
  id: string,
  targetType: "product" | "category",
  targetId: string,
  available = true
) {
  return {
    id,
    name: id,
    description: null as string | null,
    target_type: targetType,
    target_id: targetId,
    is_available: available
  };
}

const suggestedById = new Map([
  ["sug-a", { id: "sug-a", name: "A", price: 1000, imageUrl: null as string | null }],
  ["sug-b", { id: "sug-b", name: "B", price: 2000, imageUrl: null as string | null }]
]);

function itemsMap(
  entries: Array<[string, Array<{ product_id: string; is_available: boolean; sort_order: number }>]>
) {
  return new Map(entries);
}

section("REALIGN-01 product target wins");
{
  const result = resolveUpsellForProduct({
    productId,
    categoryId,
    upsellGroups: [
      group("g-prod", "product", productId),
      group("g-cat", "category", categoryId)
    ],
    itemsByUpsellGroupId: itemsMap([
      ["g-prod", [{ product_id: "sug-a", is_available: true, sort_order: 0 }]],
      ["g-cat", [{ product_id: "sug-b", is_available: true, sort_order: 0 }]]
    ]),
    suggestedById
  });
  assert.equal(result?.id, "g-prod");
  assert.equal(result?.products.length, 1);
  assert.equal(result?.products[0]?.id, "sug-a");
}

section("REALIGN-02 category fallback");
{
  const result = resolveUpsellForProduct({
    productId,
    categoryId,
    upsellGroups: [group("g-cat", "category", categoryId)],
    itemsByUpsellGroupId: itemsMap([
      ["g-cat", [{ product_id: "sug-b", is_available: true, sort_order: 0 }]]
    ]),
    suggestedById
  });
  assert.equal(result?.id, "g-cat");
}

section("REALIGN-03 unavailable product → category fallback");
{
  const result = resolveUpsellForProduct({
    productId,
    categoryId,
    upsellGroups: [
      group("g-prod", "product", productId, false),
      group("g-cat", "category", categoryId, true)
    ],
    itemsByUpsellGroupId: itemsMap([
      ["g-prod", [{ product_id: "sug-a", is_available: true, sort_order: 0 }]],
      ["g-cat", [{ product_id: "sug-b", is_available: true, sort_order: 0 }]]
    ]),
    suggestedById
  });
  assert.equal(result?.id, "g-cat");
}

section("REALIGN-04 no group");
{
  const result = resolveUpsellForProduct({
    productId,
    categoryId,
    upsellGroups: [],
    itemsByUpsellGroupId: new Map(),
    suggestedById
  });
  assert.equal(result, null);
}

section("REALIGN-05 single public shape");
{
  const result = resolveUpsellForProduct({
    productId,
    categoryId,
    upsellGroups: [group("g-prod", "product", productId)],
    itemsByUpsellGroupId: itemsMap([
      ["g-prod", [{ product_id: "sug-a", is_available: true, sort_order: 0 }]]
    ]),
    suggestedById
  });
  assert.ok(result);
  assert.equal("placement" in result, false);
  assert.ok(Array.isArray(result.products));
}

section("REALIGN-06 / 07 summary + modal trigger");
{
  const withUpsellOnly: PublicProductCustomizationSummary = {
    productId,
    hasCustomizations: false,
    hasPaidCustomizations: false,
    hasUpsell: true,
    priceFrom: 1000
  };
  assert.equal(productNeedsCustomizationModal(withUpsellOnly), false);

  const withCustomizations: PublicProductCustomizationSummary = {
    productId,
    hasCustomizations: true,
    hasPaidCustomizations: false,
    hasUpsell: true,
    priceFrom: 1000
  };
  assert.equal(productNeedsCustomizationModal(withCustomizations), true);

  const empty: PublicProductCustomizationSummary = {
    productId,
    hasCustomizations: false,
    hasPaidCustomizations: false,
    hasUpsell: false,
    priceFrom: null
  };
  assert.equal(productNeedsCustomizationModal(empty), false);
}

section("REALIGN-08 admin parse has no placement");
{
  const fd = new FormData();
  fd.set("name", "Plus bebidas");
  fd.set("target_type", "product");
  fd.set("target_id", productId);
  fd.set("is_available", "true");
  fd.set("sort_order", "0");
  const parsed = parseUpsellGroupInput(fd);
  assert.ok(!("error" in parsed));
  assert.equal("placement" in parsed, false);
  assert.equal("placementProvided" in parsed, false);
}

section("REALIGN-09 self-product excluded from group products");
{
  const result = resolveUpsellForProduct({
    productId: "sug-a",
    categoryId,
    upsellGroups: [group("g-prod", "product", "sug-a")],
    itemsByUpsellGroupId: itemsMap([
      [
        "g-prod",
        [
          { product_id: "sug-a", is_available: true, sort_order: 0 },
          { product_id: "sug-b", is_available: true, sort_order: 1 }
        ]
      ]
    ]),
    suggestedById
  });
  assert.equal(result?.products.length, 1);
  assert.equal(result?.products[0]?.id, "sug-b");
}

section("REALIGN-10 other business groups never in input");
{
  // Resolver is tenant-scoped by caller; only groups passed in participate.
  const result = resolveUpsellForProduct({
    productId,
    categoryId,
    upsellGroups: [group("g-other", "product", "other-product")],
    itemsByUpsellGroupId: itemsMap([
      ["g-other", [{ product_id: "sug-a", is_available: true, sort_order: 0 }]]
    ]),
    suggestedById
  });
  assert.equal(result, null);
}

console.log("\nALL_PASS upsell-resolution.verify.ts\n");
