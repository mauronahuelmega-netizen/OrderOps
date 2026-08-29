/**
 * Static QA for preparation mapper (no network / no create_order).
 * Run: npx tsx lib/product-customization/order-preparation.verify.ts
 */
import assert from "node:assert/strict";

import { buildOrderPreparationItems } from "@/lib/product-customization/order-preparation";
import type { OrderItemLike } from "@/lib/product-customization/order-dashboard";

function item(overrides: Partial<OrderItemLike> & Pick<OrderItemLike, "product_name">): OrderItemLike {
  return {
    id: overrides.id ?? `item-${overrides.product_name}`,
    product_id: overrides.product_id ?? "product-1",
    product_name: overrides.product_name,
    quantity: overrides.quantity ?? 1,
    unit_price: overrides.unit_price ?? 1000,
    item_kind: overrides.item_kind ?? "product",
    parent_order_item_id: overrides.parent_order_item_id ?? null,
    customization_snapshot: overrides.customization_snapshot ?? null,
    description: overrides.description ?? null
  };
}

const v1Snapshot = {
  version: 1,
  source: "public_checkout",
  configuration_signature: "sig-v1",
  product: { id: "p1", name: "BBQ Bacon" },
  groups: [
    {
      group_id: "g-papas",
      group_name: "Papas",
      selection_type: "single" as const,
      is_required: true,
      min_selections: 1,
      max_selections: 1,
      sort_order: 0,
      selected_options: [
        {
          option_id: "o-papas",
          option_name: "Papas grandes",
          price_delta: 1500,
          sort_order: 0
        }
      ]
    },
    {
      group_id: "g-salsas",
      group_name: "Salsas",
      selection_type: "multiple" as const,
      is_required: false,
      min_selections: 0,
      max_selections: 5,
      sort_order: 1,
      selected_options: [
        {
          option_id: "o-bbq",
          option_name: "BBQ",
          price_delta: 250,
          sort_order: 0
        },
        {
          option_id: "o-mac",
          option_name: "Salsa Big Mac",
          price_delta: 250,
          sort_order: 1
        }
      ]
    }
  ],
  pricing: { base_unit_price: 12500, customization_total: 2000, final_unit_price: 14500 },
  summary: ["Papas: Papas grandes (+$1.500)", "Salsas: BBQ (+$250), Salsa Big Mac (+$250)"]
};

const v2StandardGroupSnapshot = {
  version: 2,
  source: "public_checkout",
  configuration_signature: "sig-v2-standard",
  product: { id: "p1", name: "BBQ Bacon" },
  groups: [
    {
      group_id: "g-papas",
      group_name: "Papas",
      selection_type: "single" as const,
      allows_option_quantity: false,
      is_required: true,
      min_selections: 1,
      max_selections: 1,
      max_total_quantity: null,
      sort_order: 0,
      selected_options: [
        {
          option_id: "o-papas",
          option_name: "Papas grandes",
          price_delta: 1500,
          quantity: 1,
          total_price_delta: 1500,
          sort_order: 0
        }
      ]
    }
  ],
  pricing: { base_unit_price: 12500, customization_total: 1500, final_unit_price: 14000 },
  summary: ["Papas: Papas grandes (+$1.500)"]
};

const v2QtySnapshot = {
  version: 2,
  source: "public_checkout",
  configuration_signature: "sig-v2",
  product: { id: "p1", name: "Doble Smash" },
  groups: [
    {
      group_id: "g-extra",
      group_name: "Agregados extra",
      selection_type: "multiple" as const,
      allows_option_quantity: true,
      is_required: false,
      min_selections: 0,
      max_selections: 5,
      max_total_quantity: null,
      sort_order: 0,
      selected_options: [
        {
          option_id: "o-bacon",
          option_name: "Bacon",
          price_delta: 1000,
          quantity: 4,
          total_price_delta: 4000,
          sort_order: 0
        },
        {
          option_id: "o-huevo",
          option_name: "Huevo",
          price_delta: 750,
          quantity: 1,
          total_price_delta: 750,
          sort_order: 1
        },
        {
          option_id: "o-cheddar",
          option_name: "Cheddar",
          price_delta: 500,
          quantity: 4,
          total_price_delta: 2000,
          sort_order: 2
        }
      ]
    }
  ],
  pricing: { base_unit_price: 12500, customization_total: 6750, final_unit_price: 19250 },
  summary: [
    "Agregados extra: Bacon x4 (+$4.000), Huevo (+$750), Cheddar x4 (+$2.000)"
  ]
};

// A. Simple — no snapshot
const simple = buildOrderPreparationItems([
  item({ id: "simple-1", product_name: "Coca Cola 500ml", quantity: 2, unit_price: 3000 })
]);
assert.equal(simple.length, 1);
assert.equal(simple[0]?.groups.length, 0);
assert.equal(simple[0]?.unitPrice, 3000);
assert.equal(simple[0]?.lineTotal, 6000);
assert.equal(simple[0]?.quantity, 2);

// B. V1 structured — parent qty = 1
const v1 = buildOrderPreparationItems([
  item({
    id: "v1-1",
    product_name: "Doble Smash",
    unit_price: 14500,
    customization_snapshot: v1Snapshot
  })
]);
assert.equal(v1[0]?.snapshotVersion, 1);
assert.equal(v1[0]?.groups[0]?.options[0]?.isQuantityEnabled, false);
assert.equal(v1[0]?.groups[0]?.options[0]?.quantityPerUnit, undefined);

// C. V2 qty extras — parent qty = 1
const v2 = buildOrderPreparationItems([
  item({
    id: "v2-1",
    product_name: "Doble Smash",
    unit_price: 19250,
    customization_snapshot: v2QtySnapshot
  })
]);
const bacon = v2[0]?.groups[0]?.options[0];
assert.equal(v2[0]?.groups[0]?.allowsOptionQuantity, true);
assert.equal(bacon?.isQuantityEnabled, true);
assert.equal(bacon?.quantityPerUnit, 4);
assert.equal(bacon?.operationalTotal, undefined);
const huevo = v2[0]?.groups[0]?.options[1];
assert.equal(huevo?.quantityPerUnit, undefined);
assert.equal(huevo?.isQuantityEnabled, true);

// D. Parent qty = 2 + V2 qty extras
const v2Parent2 = buildOrderPreparationItems([
  item({
    id: "v2-parent-2",
    product_name: "BBQ Bacon",
    quantity: 2,
    unit_price: 22250,
    customization_snapshot: v2QtySnapshot
  })
]);
assert.equal(v2Parent2[0]?.unitPrice, 22250);
assert.equal(v2Parent2[0]?.lineTotal, 44500);
const baconParent2 = v2Parent2[0]?.groups[0]?.options[0];
assert.equal(baconParent2?.quantityPerUnit, 4);
assert.equal(baconParent2?.operationalTotal, 8);
const huevoParent2 = v2Parent2[0]?.groups[0]?.options[1];
assert.equal(huevoParent2?.quantityPerUnit, 1);
assert.equal(huevoParent2?.operationalTotal, 2);
const cheddarParent2 = v2Parent2[0]?.groups[0]?.options[2];
assert.equal(cheddarParent2?.quantityPerUnit, 4);
assert.equal(cheddarParent2?.operationalTotal, 8);

// E. V2 standard group — parent qty = 2 (not quantity-enabled)
const v2StandardParent2 = buildOrderPreparationItems([
  item({
    id: "v2-standard-parent-2",
    product_name: "BBQ Bacon",
    quantity: 2,
    unit_price: 14000,
    customization_snapshot: v2StandardGroupSnapshot
  })
]);
assert.equal(v2StandardParent2[0]?.groups[0]?.allowsOptionQuantity, false);
assert.equal(v2StandardParent2[0]?.groups[0]?.options[0]?.isQuantityEnabled, false);
assert.equal(v2StandardParent2[0]?.groups[0]?.options[0]?.quantityPerUnit, undefined);

// F. V1 parent qty = 2 — no fabricated option qty
const v1Parent2 = buildOrderPreparationItems([
  item({
    id: "v1-parent-2",
    product_name: "Doble Smash",
    quantity: 2,
    unit_price: 14500,
    customization_snapshot: v1Snapshot
  })
]);
const v1Papas = v1Parent2[0]?.groups[0]?.options[0];
assert.equal(v1Papas?.name, "Papas grandes");
assert.equal(v1Papas?.quantityPerUnit, undefined);
assert.equal(v1Papas?.operationalTotal, undefined);
assert.equal(v1Papas?.isQuantityEnabled, false);

// G. Parent qty = 3 + V2 qty extras
const v2Parent3 = buildOrderPreparationItems([
  item({
    id: "v2-parent-3",
    product_name: "BBQ Bacon",
    quantity: 3,
    unit_price: 20000,
    customization_snapshot: {
      ...v2QtySnapshot,
      groups: [
        {
          ...v2QtySnapshot.groups[0],
          selected_options: [
            {
              option_id: "o-bacon",
              option_name: "Bacon",
              price_delta: 1000,
              quantity: 2,
              total_price_delta: 2000,
              sort_order: 0
            }
          ]
        }
      ]
    }
  })
]);
const baconParent3 = v2Parent3[0]?.groups[0]?.options[0];
assert.equal(baconParent3?.quantityPerUnit, 2);
assert.equal(baconParent3?.operationalTotal, 6);

// H. Upsell child — qty preserved, line total in VM
const upsellParent = buildOrderPreparationItems([
  item({
    id: "parent-upsell",
    product_name: "Doble Smash",
    quantity: 2,
    unit_price: 22250,
    customization_snapshot: v2QtySnapshot
  }),
  item({
    id: "child-upsell",
    product_name: "Coca Cola 500ml",
    quantity: 2,
    unit_price: 3000,
    item_kind: "upsell",
    parent_order_item_id: "parent-upsell"
  })
]);
assert.equal(upsellParent[0]?.children.length, 1);
assert.equal(upsellParent[0]?.children[0]?.quantity, 2);
assert.equal(upsellParent[0]?.children[0]?.lineTotal, 6000);
assert.equal(upsellParent[0]?.lineTotal, 44500);

// I. Orphan upsell
const orphan = buildOrderPreparationItems([
  item({
    id: "orphan-upsell",
    product_name: "Coca Cola 500ml",
    quantity: 1,
    unit_price: 3000,
    item_kind: "upsell",
    parent_order_item_id: "missing-parent"
  })
]);
assert.equal(orphan[0]?.isOrphanUpsell, true);

// J. Malformed snapshot
const malformed = buildOrderPreparationItems([
  item({
    id: "malformed",
    product_name: "Mystery Item",
    unit_price: 5000,
    customization_snapshot: "not-json"
  })
]);
assert.equal(malformed[0]?.groups.length, 0);
assert.equal(malformed[0]?.lineTotal, 5000);

// K. Unit price uses persisted value — not derived from lineTotal/qty
const unitPriceFixture = buildOrderPreparationItems([
  item({
    id: "unit-price",
    product_name: "BBQ Bacon",
    quantity: 2,
    unit_price: 22250,
    customization_snapshot: null
  })
]);
assert.equal(unitPriceFixture[0]?.unitPrice, 22250);
assert.equal(unitPriceFixture[0]?.lineTotal, 44500);

// L. No option price fields in VM
for (const group of v2[0]?.groups ?? []) {
  for (const option of group.options) {
    assert.equal("unitPriceDelta" in option, false);
    assert.equal("extendedPriceDelta" in option, false);
  }
}

console.log("order-preparation.verify.ts — all assertions passed");
