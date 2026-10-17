/**
 * Pure regression coverage for cart parse, totals and parent quantity.
 * Does not repeat the post-add upsell attach contract.
 * Run: npx tsx lib/cart/pure-cart-regression.verify.ts
 */

import assert from "node:assert/strict";
import {
  getCartItemsTotal,
  parseLocalCartV2Items,
  setV2ParentQuantity,
  type LocalCartItem,
  type LocalCartItemV2,
  type LocalCartLegacyItem
} from "@/lib/cart/local";

function section(name: string) {
  console.log(`\n✓ ${name}`);
}

function v2Line(
  overrides: Partial<LocalCartItemV2> & Pick<LocalCartItemV2, "cartLineId" | "itemKind">
): LocalCartItemV2 {
  return {
    schemaVersion: 2,
    productId: "burger",
    productName: "Burger",
    categoryId: "burgers",
    productImageUrl: null,
    baseUnitPrice: 4000,
    quantity: 1,
    parentCartLineId: overrides.itemKind === "upsell" ? "parent-1" : null,
    selectedGroups: [],
    customizationTotal: 500,
    finalUnitPrice: overrides.itemKind === "upsell" ? 3000 : 4500,
    lineTotal: overrides.itemKind === "upsell" ? 3000 : 4500,
    configurationSignature: "sig-burger",
    displaySummary: ["Cheddar"],
    createdAt: "2026-10-16T00:00:00.000Z",
    updatedAt: "2026-10-16T00:00:00.000Z",
    ...overrides
  };
}

const parent = v2Line({
  cartLineId: "parent-1",
  itemKind: "product",
  selectedGroups: [
    {
      groupId: "extras",
      groupName: "Extras",
      selectionType: "multiple",
      isRequired: false,
      minSelections: 0,
      maxSelections: null,
      sortOrder: 0,
      selectedOptions: [
        {
          optionId: "cheddar",
          optionName: "Cheddar",
          priceDelta: 500,
          quantity: 2,
          sortOrder: 0
        }
      ]
    }
  ]
});

const child = v2Line({
  cartLineId: "child-1",
  itemKind: "upsell",
  parentCartLineId: "parent-1",
  productId: "coca",
  productName: "Coca",
  configurationSignature: "sig-coca",
  customizationTotal: 0,
  baseUnitPrice: 3000
});

const otherParent = v2Line({
  cartLineId: "parent-2",
  itemKind: "product",
  productId: "fries",
  productName: "Fries",
  configurationSignature: "sig-fries",
  finalUnitPrice: 2000,
  lineTotal: 2000,
  customizationTotal: 0,
  baseUnitPrice: 2000
});

const legacy: LocalCartLegacyItem = {
  productId: "water",
  categoryId: "drinks",
  name: "Water",
  description: null,
  imageUrl: null,
  price: 1000,
  quantity: 2
};

section("parseLocalCartV2Items rejects empty and invalid payloads");

assert.deepEqual(parseLocalCartV2Items(null), []);
assert.deepEqual(parseLocalCartV2Items(""), []);
assert.deepEqual(parseLocalCartV2Items("{"), []);
assert.deepEqual(parseLocalCartV2Items(JSON.stringify({ cartLineId: "not-a-list" })), []);

section("parseLocalCartV2Items keeps valid lines and drops incomplete ones");

{
  const raw = [
    parent,
    {
      schemaVersion: 2,
      cartLineId: "missing-signature",
      productId: "burger",
      productName: "Burger",
      quantity: 1,
      itemKind: "product",
      finalUnitPrice: 4500,
      lineTotal: 4500
    },
    { ...child, quantity: 0 },
    { ...otherParent, itemKind: "note" },
    legacy
  ];
  const parsed = parseLocalCartV2Items(JSON.stringify(raw));

  assert.deepEqual(
    parsed.map((item) => item.cartLineId),
    ["parent-1"]
  );
  assert.equal(parsed[0]?.configurationSignature, "sig-burger");
  assert.equal(parsed[0]?.selectedGroups[0]?.selectedOptions[0]?.quantity, 2);
}

section("parseLocalCartV2Items normalizes customization option quantities");

{
  const parsed = parseLocalCartV2Items(
    JSON.stringify([
      {
        ...parent,
        selectedGroups: [
          {
            ...parent.selectedGroups[0],
            selectedOptions: [
              { ...parent.selectedGroups[0].selectedOptions[0], quantity: 2.9 },
              {
                optionId: "bacon",
                optionName: "Bacon",
                priceDelta: 700,
                sortOrder: 1
              },
              {
                optionId: "onion",
                optionName: "Onion",
                priceDelta: 0,
                quantity: 0,
                sortOrder: 2
              }
            ]
          }
        ]
      }
    ])
  );
  const quantities = parsed[0]?.selectedGroups[0]?.selectedOptions.map((option) => option.quantity);

  assert.deepEqual(quantities, [2, 1, 1]);
  assert.equal(parsed[0]?.lineTotal, parent.lineTotal);
}

section("parseLocalCartV2Items drops the payload when selected groups are not a list");

{
  const parsed = parseLocalCartV2Items(
    JSON.stringify([{ ...parent, selectedGroups: 1 }, child])
  );

  assert.deepEqual(parsed, []);
}

section("getCartItemsTotal sums stored v2 line totals and legacy price times quantity");

{
  assert.equal(getCartItemsTotal([]), 0);
  assert.equal(getCartItemsTotal([legacy]), 2000);
  assert.equal(getCartItemsTotal([parent, child, otherParent, legacy]), 4500 + 3000 + 2000 + 2000);

  const stale = { ...parent, finalUnitPrice: 9999, lineTotal: 4500 };
  assert.equal(getCartItemsTotal([stale]), 4500);
}

section("setV2ParentQuantity scales the parent and its upsell without touching other lines");

{
  const items: LocalCartItem[] = [parent, child, otherParent, legacy];
  const before = structuredClone(items);
  const scaled = setV2ParentQuantity(items, parent.cartLineId, 2);
  const scaledParent = scaled.find(
    (item) => "cartLineId" in item && item.cartLineId === parent.cartLineId
  ) as LocalCartItemV2;
  const scaledChild = scaled.find(
    (item) => "cartLineId" in item && item.cartLineId === child.cartLineId
  ) as LocalCartItemV2;
  const untouched = scaled.find(
    (item) => "cartLineId" in item && item.cartLineId === otherParent.cartLineId
  ) as LocalCartItemV2;

  assert.deepEqual(items, before);
  assert.equal(scaledParent.quantity, 2);
  assert.equal(scaledParent.lineTotal, 9000);
  assert.equal(scaledParent.configurationSignature, parent.configurationSignature);
  assert.equal(scaledParent.selectedGroups[0]?.selectedOptions[0]?.quantity, 2);
  assert.equal(scaledChild.quantity, 2);
  assert.equal(scaledChild.lineTotal, 6000);
  assert.equal(scaledChild.configurationSignature, child.configurationSignature);
  assert.equal(untouched.quantity, 1);
  assert.equal(untouched.lineTotal, 2000);
  assert.equal((scaled.find((item) => !("schemaVersion" in item)) as LocalCartLegacyItem).quantity, 2);
  assert.equal(getCartItemsTotal(scaled), 9000 + 6000 + 2000 + 2000);
}

section("setV2ParentQuantity removes the parent and its children at zero");

{
  const items: LocalCartItem[] = [parent, child, otherParent, legacy];
  const removed = setV2ParentQuantity(items, parent.cartLineId, 0);
  const ids = removed.map((item) => ("cartLineId" in item ? item.cartLineId : item.productId));

  assert.deepEqual(ids, ["parent-2", "water"]);
  assert.equal(getCartItemsTotal(removed), 2000 + 2000);
  assert.deepEqual(setV2ParentQuantity(items, parent.cartLineId, -1), removed);
}

section("setV2ParentQuantity ignores an unknown parent");

{
  const items: LocalCartItem[] = [parent, child, legacy];
  assert.deepEqual(setV2ParentQuantity(items, "missing", 4), items);
}

console.log("\npure-cart-regression: PASS");
