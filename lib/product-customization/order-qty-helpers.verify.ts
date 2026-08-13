/**
 * Static helper QA for ORDER qty path (no network / no create_order).
 * Run: npx tsx lib/product-customization/order-qty-helpers.verify.ts
 */
import assert from "node:assert/strict";

import type { LocalCartSelectedGroup } from "@/lib/cart/types";
import {
  normalizeCheckoutGroupSelection,
  normalizeCheckoutGroups,
  selectionMapsFromNormalizedGroups
} from "@/lib/product-customization/checkout-payload-v2";
import {
  getCustomizationSummaryLines,
  parseCustomizationSnapshot
} from "@/lib/product-customization/order-dashboard";
import {
  buildCustomizationSnapshotV2,
  buildDisplaySummaryFromSelectedGroups
} from "@/lib/product-customization/order-snapshot";
import type { PublicCustomizationGroup } from "@/lib/product-customization/public-shared";
import {
  getEffectiveAllowsOptionQuantity,
  getEffectiveMaxTotalQuantity,
  isSelectionStrictlyWithinLimits
} from "@/lib/product-customization/selection-v2";

function assertRejectQuantity(raw: unknown, label: string) {
  const result = normalizeCheckoutGroupSelection({
    groupId: "agregados_extra",
    selectedOptions: [{ optionId: "bacon", quantity: raw as number }]
  });
  assert.equal(result.ok, false, `expected reject: ${label}`);
}

function rejectQtyGt1Integrity(
  groups: PublicCustomizationGroup[],
  selectedQuantitiesByGroupId: Record<string, Record<string, number>>
): boolean {
  for (const group of groups) {
    const quantities = selectedQuantitiesByGroupId[group.id] ?? {};
    for (const qty of Object.values(quantities)) {
      if (group.selectionType === "single" && qty > 1) {
        return true;
      }
      if (!getEffectiveAllowsOptionQuantity(group) && qty > 1) {
        return true;
      }
    }
  }
  return false;
}

// --- V2 normalize ---
const v2Groups = normalizeCheckoutGroups([
  {
    groupId: "agregados_extra",
    selectedOptions: [
      { optionId: "bacon", quantity: 2 },
      { optionId: "cheddar", quantity: 1 }
    ],
    selectedOptionIds: ["bacon", "cheddar"]
  }
]);
assert.equal(v2Groups.ok, true);
if (!v2Groups.ok) {
  throw new Error("normalize V2 failed");
}
assert.equal(v2Groups.byGroupId.agregados_extra.quantities.bacon, 2);
assert.equal(v2Groups.byGroupId.agregados_extra.quantities.cheddar, 1);
assert.deepEqual(v2Groups.byGroupId.agregados_extra.optionIds.sort(), [
  "bacon",
  "cheddar"
]);

// Prefer selectedOptions over bridge IDs
const preferV2 = normalizeCheckoutGroups([
  {
    groupId: "agregados_extra",
    selectedOptions: [{ optionId: "bacon", quantity: 3 }],
    selectedOptionIds: ["bacon", "cheddar"]
  }
]);
assert.equal(preferV2.ok, true);
if (!preferV2.ok) {
  throw new Error("prefer V2 failed");
}
assert.equal(preferV2.byGroupId.agregados_extra.quantities.bacon, 3);
assert.equal(preferV2.byGroupId.agregados_extra.quantities.cheddar, undefined);

// --- Legacy selectedOptionIds → qty 1 ---
const legacy = normalizeCheckoutGroups([
  {
    groupId: "agregados_extra",
    selectedOptionIds: ["bacon", "cheddar"]
  }
]);
assert.equal(legacy.ok, true);
if (!legacy.ok) {
  throw new Error("normalize legacy failed");
}
assert.equal(legacy.byGroupId.agregados_extra.quantities.bacon, 1);
assert.equal(legacy.byGroupId.agregados_extra.quantities.cheddar, 1);

// --- Duplicate selectedOptions sum ---
const duplicated = normalizeCheckoutGroups([
  {
    groupId: "agregados_extra",
    selectedOptions: [
      { optionId: "bacon", quantity: 2 },
      { optionId: "bacon", quantity: 1 }
    ]
  }
]);
assert.equal(duplicated.ok, true);
if (!duplicated.ok) {
  throw new Error("duplicate sum failed");
}
assert.equal(duplicated.byGroupId.agregados_extra.quantities.bacon, 3);
assert.deepEqual(duplicated.byGroupId.agregados_extra.optionIds, ["bacon"]);

// --- Invalid quantities reject ---
assertRejectQuantity(0, "qty 0");
assertRejectQuantity(-1, "negative");
assertRejectQuantity(1.5, "non-integer");
assertRejectQuantity(Number.NaN, "NaN");
assertRejectQuantity(Number.POSITIVE_INFINITY, "Infinity");
assertRejectQuantity("2" as unknown as number, "string quantity");

const qtyGroup: PublicCustomizationGroup = {
  id: "agregados_extra",
  name: "Agregados extra",
  description: null,
  selectionType: "multiple",
  isRequired: false,
  minSelections: 0,
  maxSelections: 3,
  allowsOptionQuantity: true,
  maxTotalQuantity: 4,
  isBlocked: false,
  options: [
    {
      id: "bacon",
      name: "Bacon",
      description: null,
      priceDelta: 1000,
      maxQuantity: 2
    },
    {
      id: "cheddar",
      name: "Cheddar",
      description: null,
      priceDelta: 500,
      maxQuantity: 5
    },
    {
      id: "egg",
      name: "Egg",
      description: null,
      priceDelta: 700,
      maxQuantity: 5
    },
    {
      id: "onion",
      name: "Onion",
      description: null,
      priceDelta: 300,
      maxQuantity: 5
    }
  ]
};

const nonQtyMultiple: PublicCustomizationGroup = {
  ...qtyGroup,
  id: "extras_binary",
  name: "Extras",
  allowsOptionQuantity: false,
  maxTotalQuantity: null,
  options: qtyGroup.options.map((option) => ({
    ...option,
    maxQuantity: undefined
  }))
};

const singleGroup: PublicCustomizationGroup = {
  id: "punto",
  name: "Punto",
  description: null,
  selectionType: "single",
  isRequired: true,
  minSelections: 1,
  maxSelections: 1,
  allowsOptionQuantity: false,
  maxTotalQuantity: null,
  isBlocked: false,
  options: [
    {
      id: "medium",
      name: "Al punto",
      description: null,
      priceDelta: 0
    }
  ]
};

// --- Integrity: reject qty > 1 on single / non-qty ---
assert.equal(
  rejectQtyGt1Integrity([singleGroup], { punto: { medium: 2 } }),
  true,
  "single qty>1 must reject"
);
assert.equal(
  rejectQtyGt1Integrity([nonQtyMultiple], { extras_binary: { bacon: 2 } }),
  true,
  "non-qty multiple qty>1 must reject"
);
assert.equal(
  rejectQtyGt1Integrity([qtyGroup], { agregados_extra: { bacon: 2 } }),
  false,
  "qty-enabled bacon×2 must allow integrity gate"
);

// --- Order-path strict limits (no silent clamp) ---
assert.equal(
  isSelectionStrictlyWithinLimits([qtyGroup], {
    agregados_extra: { bacon: 3 }
  }),
  false,
  "option.max_quantity"
);

assert.equal(
  isSelectionStrictlyWithinLimits([qtyGroup], {
    agregados_extra: { bacon: 2, cheddar: 3 }
  }),
  false,
  "max_total_quantity"
);

assert.equal(
  isSelectionStrictlyWithinLimits([qtyGroup], {
    agregados_extra: { bacon: 1, cheddar: 1, egg: 1, onion: 1 }
  }),
  false,
  "max_selections distinct"
);

assert.equal(
  isSelectionStrictlyWithinLimits([qtyGroup], {
    agregados_extra: { bacon: 2, cheddar: 1 }
  }),
  true,
  "valid qty selection within limits"
);

assert.equal(
  isSelectionStrictlyWithinLimits([nonQtyMultiple], {
    extras_binary: { bacon: 2 }
  }),
  false,
  "non-qty clamp must fail strict limits"
);

assert.equal(
  getEffectiveMaxTotalQuantity({
    selectionType: "multiple",
    allowsOptionQuantity: true,
    maxTotalQuantity: null,
    maxSelections: 5
  }),
  5,
  "max_total_quantity null bridge → max_selections"
);

// --- Pricing ---
const selectedGroups: LocalCartSelectedGroup[] = [
  {
    groupId: "agregados_extra",
    groupName: "Agregados extra",
    selectionType: "multiple",
    isRequired: false,
    minSelections: 0,
    maxSelections: 5,
    allowsOptionQuantity: true,
    sortOrder: 0,
    selectedOptions: [
      {
        optionId: "bacon",
        optionName: "Bacon",
        priceDelta: 1000,
        quantity: 2,
        sortOrder: 0
      },
      {
        optionId: "cheddar",
        optionName: "Cheddar",
        priceDelta: 500,
        quantity: 1,
        sortOrder: 1
      }
    ]
  }
];

const customizationTotal = selectedGroups.reduce(
  (sum, group) =>
    sum +
    group.selectedOptions.reduce(
      (optionSum, option) =>
        optionSum + option.priceDelta * (option.quantity ?? 1),
      0
    ),
  0
);
assert.equal(customizationTotal, 2500);
const finalUnitPrice = 12500 + customizationTotal;
assert.equal(finalUnitPrice, 15000);
assert.equal(finalUnitPrice * 2, 30000);

// --- Snapshot V2 ---
const snapshot = buildCustomizationSnapshotV2({
  configurationSignature: "test",
  productId: "product_doble_smash",
  productName: "Doble Smash",
  baseUnitPrice: 12500,
  customizationTotal,
  finalUnitPrice,
  selectedGroups,
  configGroups: [qtyGroup]
});
assert.equal(snapshot.version, 2);
assert.equal(snapshot.source, "public_checkout");
assert.equal(snapshot.product.name, "Doble Smash");
assert.equal(snapshot.groups[0]?.allows_option_quantity, true);
assert.equal(snapshot.groups[0]?.max_total_quantity, 4);
assert.equal(snapshot.groups[0]?.selected_options[0]?.quantity, 2);
assert.equal(snapshot.groups[0]?.selected_options[0]?.total_price_delta, 2000);
assert.ok(snapshot.summary.some((line) => line.includes("Bacon x2")));
assert.equal(snapshot.pricing.final_unit_price, 15000);

assert.ok(
  buildDisplaySummaryFromSelectedGroups(selectedGroups)[0]?.includes("Bacon x2")
);

const parsedV2 = parseCustomizationSnapshot(snapshot);
assert.equal(parsedV2?.version, 2);
assert.ok(
  getCustomizationSummaryLines(parsedV2).some((line) => line.includes("Bacon x2"))
);

const v2WithoutSummary = parseCustomizationSnapshot({
  ...snapshot,
  summary: []
});
assert.ok(
  getCustomizationSummaryLines(v2WithoutSummary).some((line) =>
    line.includes("Bacon x2")
  )
);

// --- V1 reader ---
const v1Parsed = parseCustomizationSnapshot({
  version: 1,
  source: "public_checkout",
  configuration_signature: "legacy",
  product: { id: "p", name: "P" },
  groups: [
    {
      group_id: "g",
      group_name: "Extras",
      selection_type: "multiple",
      is_required: false,
      min_selections: 0,
      max_selections: null,
      sort_order: 0,
      selected_options: [
        {
          option_id: "bacon",
          option_name: "Bacon",
          price_delta: 1000,
          sort_order: 0
        }
      ]
    }
  ],
  pricing: { base_unit_price: 1, customization_total: 1, final_unit_price: 2 },
  summary: ["Extras: Bacon (+$1.000)"]
});
assert.equal(v1Parsed?.version, 1);
assert.deepEqual(getCustomizationSummaryLines(v1Parsed), [
  "Extras: Bacon (+$1.000)"
]);

const missingVersion = parseCustomizationSnapshot({
  source: "public_checkout",
  configuration_signature: "legacy",
  product: { id: "p", name: "P" },
  groups: [
    {
      group_id: "g",
      group_name: "Extras",
      selection_type: "multiple",
      is_required: false,
      min_selections: 0,
      max_selections: null,
      sort_order: 0,
      selected_options: [
        {
          option_id: "bacon",
          option_name: "Bacon",
          price_delta: 1000,
          sort_order: 0
        }
      ]
    }
  ],
  pricing: { base_unit_price: 1, customization_total: 1, final_unit_price: 2 },
  summary: []
});
assert.equal(missingVersion?.version, 1);
assert.ok(
  getCustomizationSummaryLines(missingVersion).some((line) =>
    line.includes("Bacon")
  )
);

const maps = selectionMapsFromNormalizedGroups(v2Groups.byGroupId);
assert.equal(maps.selectedQuantitiesByGroupId.agregados_extra.bacon, 2);

console.log("ORDER_HELPER_QA = PASS");
