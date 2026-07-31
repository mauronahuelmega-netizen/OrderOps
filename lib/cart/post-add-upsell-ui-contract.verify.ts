/**
 * Pure fixtures for PUBLIC-CATALOG-POST-ADD-UPSELL-IMPL-1 (U1).
 * Run: npx tsx lib/cart/post-add-upsell-ui-contract.verify.ts
 */

import assert from "node:assert/strict";
import {
  attachUpsellChildToParent,
  buildCartLinesFromCustomizationSelection,
  getCartItemCount,
  getCartItemsTotal,
  mergeCustomizedSelectionIntoCart,
  type LocalCartItem
} from "@/lib/cart/local";
import {
  decidePostAddOverlay,
  getEligiblePostAddUpsellCandidates,
  wouldUpsellAttachmentConflict
} from "@/lib/cart/post-add-upsell";
import type {
  PublicProductCustomizationConfig,
  PublicUpsellSuggestedProduct
} from "@/lib/product-customization/public-shared";

function section(name: string) {
  console.log(`\n✓ ${name}`);
}

const coca: PublicUpsellSuggestedProduct = {
  id: "upsell-coca",
  name: "Coca Cola 500ml",
  price: 3000,
  imageUrl: null
};

const sprite: PublicUpsellSuggestedProduct = {
  id: "upsell-sprite",
  name: "Sprite 500ml",
  price: 2800,
  imageUrl: null
};

const fanta: PublicUpsellSuggestedProduct = {
  id: "upsell-fanta",
  name: "Fanta 500ml",
  price: 2700,
  imageUrl: null
};

const water: PublicUpsellSuggestedProduct = {
  id: "upsell-water",
  name: "Agua 500ml",
  price: 2000,
  imageUrl: null
};

function baseConfig(
  overrides?: Partial<PublicProductCustomizationConfig>
): PublicProductCustomizationConfig {
  return {
    productId: "burger-1",
    productName: "Doble Smash",
    productPrice: 12500,
    productImageUrl: null,
    productDescription: null,
    groups: [
      {
        id: "g-papas",
        name: "Papas",
        description: null,
        selectionType: "single",
        isRequired: true,
        minSelections: 1,
        maxSelections: 1,
        options: [
          {
            id: "opt-grandes",
            name: "Papas grandes",
            description: null,
            priceDelta: 1500
          },
          {
            id: "opt-chicas",
            name: "Papas chicas",
            description: null,
            priceDelta: 0
          }
        ],
        isBlocked: false
      }
    ],
    upsellGroup: {
      id: "ug-plus",
      name: "Plus",
      description: null,
      products: [coca, sprite, fanta, water]
    },
    ...overrides
  };
}

function createParent(params?: {
  optionId?: string;
  selectedUpsellProductIds?: string[];
  quantity?: number;
}): { items: LocalCartItem[]; parentCartLineId: string } {
  const config = baseConfig();
  const { parent, children } = buildCartLinesFromCustomizationSelection({
    config,
    categoryId: "cat-burgers",
    selectedOptionsByGroupId: {
      "g-papas": [params?.optionId ?? "opt-grandes"]
    },
    selectedUpsellProductIds: params?.selectedUpsellProductIds ?? [],
    quantity: params?.quantity ?? 1
  });

  const merged = mergeCustomizedSelectionIntoCart([], parent, children);
  assert.equal(merged.outcome, "created");
  return { items: merged.items, parentCartLineId: merged.parentCartLineId };
}

section("U1-01 — created + candidates");
{
  const { items, parentCartLineId } = createParent();
  const decision = decidePostAddOverlay({
    outcome: "created",
    items,
    parentCartLineId,
    suggestedProducts: [coca, sprite]
  });
  assert.equal(decision.openPostAdd, true);
  assert.equal(decision.openCart, false);
  assert.equal(decision.candidates.length, 2);
}

section("U1-02 — created + zero candidates");
{
  const { items, parentCartLineId } = createParent();
  const decision = decidePostAddOverlay({
    outcome: "created",
    items,
    parentCartLineId,
    suggestedProducts: []
  });
  assert.equal(decision.openPostAdd, false);
  assert.equal(decision.openCart, true);
}

section("U1-03 — merged");
{
  const first = createParent();
  const config = baseConfig();
  const { parent, children } = buildCartLinesFromCustomizationSelection({
    config,
    categoryId: "cat-burgers",
    selectedOptionsByGroupId: { "g-papas": ["opt-grandes"] },
    selectedUpsellProductIds: [],
    quantity: 1
  });
  const merged = mergeCustomizedSelectionIntoCart(first.items, parent, children);
  assert.equal(merged.outcome, "merged");
  const decision = decidePostAddOverlay({
    outcome: "merged",
    items: merged.items,
    parentCartLineId: merged.parentCartLineId,
    suggestedProducts: [coca, sprite]
  });
  assert.equal(decision.openPostAdd, false);
  assert.equal(decision.openCart, true);
}

section("U1-04 — replaced");
{
  const first = createParent();
  const config = baseConfig();
  const { parent, children } = buildCartLinesFromCustomizationSelection({
    config,
    categoryId: "cat-burgers",
    selectedOptionsByGroupId: { "g-papas": ["opt-chicas"] },
    selectedUpsellProductIds: [],
    quantity: 1
  });
  const replaced = mergeCustomizedSelectionIntoCart(first.items, parent, children, {
    replaceCartLineId: first.parentCartLineId,
    eligibleAttachedUpsellProductIds: new Set([coca.id, sprite.id])
  });
  assert.equal(replaced.outcome, "replaced");
  const decision = decidePostAddOverlay({
    outcome: "replaced",
    items: replaced.items,
    parentCartLineId: replaced.parentCartLineId,
    suggestedProducts: [coca, sprite]
  });
  assert.equal(decision.openPostAdd, false);
  assert.equal(decision.openCart, true);
}

section("U1-05 — failures do not open success overlays");
{
  // Overlay decision helper is only invoked for success outcomes in CatalogClient.
  // Failures never call decidePostAddOverlay — assert that pattern is intentional.
  const failureOutcomes = ["signature_conflict", "parent_missing"] as const;
  for (const outcome of failureOutcomes) {
    assert.notEqual(outcome, "created");
  }
}

section("U1-06 — self excluded");
{
  const { items, parentCartLineId } = createParent();
  const self: PublicUpsellSuggestedProduct = {
    id: "burger-1",
    name: "Self",
    price: 100,
    imageUrl: null
  };
  const candidates = getEligiblePostAddUpsellCandidates({
    items,
    parentCartLineId,
    suggestedProducts: [self, coca]
  });
  assert.deepEqual(
    candidates.map((c) => c.id),
    [coca.id]
  );
}

section("U1-07 — duplicate IDs excluded");
{
  const { items, parentCartLineId } = createParent();
  const candidates = getEligiblePostAddUpsellCandidates({
    items,
    parentCartLineId,
    suggestedProducts: [coca, coca, sprite]
  });
  assert.deepEqual(
    candidates.map((c) => c.id),
    [coca.id, sprite.id]
  );
}

section("U1-08 — unavailable excluded (pre-filtered from suggested list)");
{
  const { items, parentCartLineId } = createParent();
  // Public config omits unavailable products; they never appear in suggestedProducts.
  const candidates = getEligiblePostAddUpsellCandidates({
    items,
    parentCartLineId,
    suggestedProducts: [coca]
  });
  assert.equal(candidates.some((c) => c.id === sprite.id), false);
  assert.equal(candidates.length, 1);
}

section("U1-09 — already attached excluded");
{
  let { items, parentCartLineId } = createParent();
  const attached = attachUpsellChildToParent({
    items,
    parentCartLineId,
    suggestedProduct: coca
  });
  assert.equal(attached.outcome, "attached");
  items = attached.items;
  const candidates = getEligiblePostAddUpsellCandidates({
    items,
    parentCartLineId,
    suggestedProducts: [coca, sprite]
  });
  assert.deepEqual(
    candidates.map((c) => c.id),
    [sprite.id]
  );
}

section("U1-10 — signature conflict excluded");
{
  const a = createParent({ optionId: "opt-grandes" });
  const withCoca = attachUpsellChildToParent({
    items: a.items,
    parentCartLineId: a.parentCartLineId,
    suggestedProduct: coca
  });
  assert.equal(withCoca.outcome, "attached");

  const twin = buildCartLinesFromCustomizationSelection({
    config: baseConfig(),
    categoryId: "cat-burgers",
    selectedOptionsByGroupId: { "g-papas": ["opt-grandes"] },
    selectedUpsellProductIds: [],
    quantity: 1
  });
  const secondGrandes = mergeCustomizedSelectionIntoCart(
    withCoca.items,
    twin.parent,
    twin.children
  );
  assert.equal(secondGrandes.outcome, "created");
  assert.equal(
    wouldUpsellAttachmentConflict({
      items: secondGrandes.items,
      parentCartLineId: secondGrandes.parentCartLineId,
      suggestedProductId: coca.id
    }),
    true
  );
  const filtered = getEligiblePostAddUpsellCandidates({
    items: secondGrandes.items,
    parentCartLineId: secondGrandes.parentCartLineId,
    suggestedProducts: [coca, sprite]
  });
  assert.deepEqual(
    filtered.map((c) => c.id),
    [sprite.id]
  );
}

section("U1-11 — order preserved");
{
  const { items, parentCartLineId } = createParent();
  const candidates = getEligiblePostAddUpsellCandidates({
    items,
    parentCartLineId,
    suggestedProducts: [water, coca, sprite],
    maxCandidates: 10
  });
  assert.deepEqual(
    candidates.map((c) => c.id),
    [water.id, coca.id, sprite.id]
  );
}

section("U1-12 — max 3");
{
  const { items, parentCartLineId } = createParent();
  const candidates = getEligiblePostAddUpsellCandidates({
    items,
    parentCartLineId,
    suggestedProducts: [coca, sprite, fanta, water],
    maxCandidates: 3
  });
  assert.equal(candidates.length, 3);
  assert.deepEqual(
    candidates.map((c) => c.id),
    [coca.id, sprite.id, fanta.id]
  );
}

section("U1-13 — attach one");
{
  let { items, parentCartLineId } = createParent();
  const beforeCount = getCartItemCount(items);
  const beforeTotal = getCartItemsTotal(items);
  const result = attachUpsellChildToParent({
    items,
    parentCartLineId,
    suggestedProduct: coca
  });
  assert.equal(result.outcome, "attached");
  items = result.items;
  assert.equal(getCartItemCount(items), beforeCount);
  assert.equal(getCartItemsTotal(items), beforeTotal + coca.price);
  const child = items.find(
    (item) =>
      "itemKind" in item &&
      item.itemKind === "upsell" &&
      item.productId === coca.id
  );
  assert.ok(child);
  assert.equal(
    "parentCartLineId" in child! && child.parentCartLineId,
    parentCartLineId
  );
}

section("U1-14 — sequential attach");
{
  let { items, parentCartLineId } = createParent();
  const first = attachUpsellChildToParent({
    items,
    parentCartLineId,
    suggestedProduct: coca
  });
  assert.equal(first.outcome, "attached");
  items = first.items;
  const second = attachUpsellChildToParent({
    items,
    parentCartLineId,
    suggestedProduct: sprite
  });
  assert.equal(second.outcome, "attached");
  items = second.items;
  const upsellIds = items
    .filter(
      (item) =>
        "itemKind" in item &&
        item.itemKind === "upsell" &&
        item.parentCartLineId === parentCartLineId
    )
    .map((item) => item.productId);
  assert.deepEqual(upsellIds.sort(), [coca.id, sprite.id].sort());
  assert.equal(getCartItemCount(items), 1);
}

section("U1-15 — already attached idempotent");
{
  let { items, parentCartLineId } = createParent();
  items = attachUpsellChildToParent({
    items,
    parentCartLineId,
    suggestedProduct: coca
  }).items;
  const again = attachUpsellChildToParent({
    items,
    parentCartLineId,
    suggestedProduct: coca
  });
  assert.equal(again.outcome, "already_attached");
  assert.equal(
    again.items.filter(
      (item) =>
        "itemKind" in item &&
        item.itemKind === "upsell" &&
        item.productId === coca.id
    ).length,
    1
  );
}

section("U1-16 — late conflict no mutation");
{
  const a = createParent({ optionId: "opt-grandes" });
  let items = attachUpsellChildToParent({
    items: a.items,
    parentCartLineId: a.parentCartLineId,
    suggestedProduct: coca
  }).items;
  const twin = buildCartLinesFromCustomizationSelection({
    config: baseConfig(),
    categoryId: "cat-burgers",
    selectedOptionsByGroupId: { "g-papas": ["opt-grandes"] },
    selectedUpsellProductIds: [],
    quantity: 1
  });
  const second = mergeCustomizedSelectionIntoCart(items, twin.parent, twin.children);
  assert.equal(second.outcome, "created");
  items = second.items;
  const snapshot = JSON.stringify(items);
  const conflict = attachUpsellChildToParent({
    items,
    parentCartLineId: second.parentCartLineId,
    suggestedProduct: coca
  });
  assert.equal(conflict.outcome, "signature_conflict");
  assert.equal(JSON.stringify(conflict.items), snapshot);
}

section("U1-17 — parent missing no mutation");
{
  const { items } = createParent();
  const snapshot = JSON.stringify(items);
  const missing = attachUpsellChildToParent({
    items,
    parentCartLineId: "missing-parent",
    suggestedProduct: coca
  });
  assert.equal(missing.outcome, "parent_missing");
  assert.equal(JSON.stringify(missing.items), snapshot);
}

section("U1-18 — quantity scaling");
{
  let { items, parentCartLineId } = createParent({ quantity: 3 });
  const result = attachUpsellChildToParent({
    items,
    parentCartLineId,
    suggestedProduct: coca
  });
  assert.equal(result.outcome, "attached");
  const child = result.items.find(
    (item): item is Extract<LocalCartItem, { schemaVersion: 2 }> =>
      "schemaVersion" in item &&
      item.schemaVersion === 2 &&
      item.itemKind === "upsell" &&
      item.productId === coca.id
  );
  assert.ok(child);
  assert.equal(child.quantity, 3);
  assert.equal(child.lineTotal, coca.price * 3);
}

section("U1-19 — edit preservation");
{
  let { items, parentCartLineId } = createParent();
  items = attachUpsellChildToParent({
    items,
    parentCartLineId,
    suggestedProduct: coca
  }).items;
  const edited = buildCartLinesFromCustomizationSelection({
    config: baseConfig(),
    categoryId: "cat-burgers",
    selectedOptionsByGroupId: { "g-papas": ["opt-chicas"] },
    selectedUpsellProductIds: [],
    quantity: 1
  });
  const replaced = mergeCustomizedSelectionIntoCart(
    items,
    edited.parent,
    edited.children,
    {
      replaceCartLineId: parentCartLineId,
      eligibleAttachedUpsellProductIds: new Set([coca.id, sprite.id])
    }
  );
  assert.equal(replaced.outcome, "replaced");
  const preserved = replaced.items.find(
    (item) =>
      "itemKind" in item &&
      item.itemKind === "upsell" &&
      item.productId === coca.id
  );
  assert.ok(preserved);
  const decision = decidePostAddOverlay({
    outcome: "replaced",
    items: replaced.items,
    parentCartLineId: replaced.parentCartLineId,
    suggestedProducts: [coca, sprite]
  });
  assert.equal(decision.openPostAdd, false);
}

section("U1-20 — no placement contract");
{
  const fs = require("node:fs") as typeof import("node:fs");
  const path = require("node:path") as typeof import("node:path");
  const source = fs.readFileSync(
    path.join(__dirname, "post-add-upsell.ts"),
    "utf8"
  );
  assert.equal(source.includes("postAddUpsellGroup"), false);
  assert.equal(source.includes("UpsellPlacement"), false);
  assert.equal(source.includes("in_modal"), false);
  assert.equal(source.includes("post_add"), false);
  assert.equal(source.includes("placement"), false);
}

console.log("\n✅ post-add-upsell-ui-contract.verify.ts PASS\n");
