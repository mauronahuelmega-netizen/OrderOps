/**
 * Static helper QA for ORDER qty path (no network / no create_order).
 * Run: npx tsx lib/product-customization/order-qty-helpers.verify.ts
 *
 * LIMITS-GRID-POLISH-1: max_total_quantity is deprecated/no-op.
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
  canIncrementOptionQuantity,
  getEffectiveAllowsOptionQuantity,
  getEffectiveMaxTotalQuantity,
  isSelectionStrictlyWithinLimits,
  normalizeSelectionToV2,
  selectSingleOptionInV2,
  toggleMultipleOptionInV2,
  type CustomizationSelectionStateV2
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

assertRejectQuantity(0, "qty 0");
assertRejectQuantity(-1, "negative");
assertRejectQuantity(1.5, "non-integer");
assertRejectQuantity(Number.NaN, "NaN");
assertRejectQuantity(Number.POSITIVE_INFINITY, "Infinity");

const qtyGroup: PublicCustomizationGroup = {
  id: "agregados_extra",
  name: "Agregados extra",
  description: null,
  selectionType: "multiple",
  isRequired: false,
  minSelections: 0,
  maxSelections: 2,
  allowsOptionQuantity: true,
  // Stale DB value must be ignored.
  maxTotalQuantity: 4,
  isBlocked: false,
  options: [
    {
      id: "bacon",
      name: "Bacon",
      description: null,
      priceDelta: 1000,
      maxQuantity: 5
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
      name: "Huevo",
      description: null,
      priceDelta: 700,
      maxQuantity: 3
    }
  ]
};

const nonQtyMultiple: PublicCustomizationGroup = {
  ...qtyGroup,
  id: "extras_binary",
  name: "Extras",
  allowsOptionQuantity: false,
  maxTotalQuantity: null,
  maxSelections: 5,
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

assert.equal(getEffectiveMaxTotalQuantity(qtyGroup), null, "max_total no-op");

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

// Bacon x5 + Cheddar x5 allowed even when stale maxTotalQuantity=4
assert.equal(
  isSelectionStrictlyWithinLimits([qtyGroup], {
    agregados_extra: { bacon: 5, cheddar: 5 }
  }),
  true,
  "max_total ignored — option max only"
);

assert.equal(
  isSelectionStrictlyWithinLimits([qtyGroup], {
    agregados_extra: { bacon: 6 }
  }),
  false,
  "option.max_quantity"
);

assert.equal(
  isSelectionStrictlyWithinLimits([qtyGroup], {
    agregados_extra: { bacon: 5, cheddar: 5, egg: 1 }
  }),
  false,
  "max_selections distinct"
);

assert.equal(
  canIncrementOptionQuantity({
    selection: { agregados_extra: { bacon: 5, cheddar: 5 } },
    group: qtyGroup,
    optionId: "bacon"
  }),
  false,
  "bacon at option max"
);

assert.equal(
  canIncrementOptionQuantity({
    selection: { agregados_extra: { bacon: 5 } },
    group: qtyGroup,
    optionId: "cheddar"
  }),
  true,
  "cheddar can rise while bacon at 5"
);

assert.equal(
  canIncrementOptionQuantity({
    selection: { agregados_extra: { bacon: 5, cheddar: 5 } },
    group: qtyGroup,
    optionId: "egg"
  }),
  false,
  "new option blocked by maxSelections"
);

assert.equal(
  isSelectionStrictlyWithinLimits([nonQtyMultiple], {
    extras_binary: { bacon: 2 }
  }),
  false,
  "non-qty clamp must fail strict limits"
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
assert.equal(snapshot.groups[0]?.max_total_quantity, null);
assert.equal(snapshot.groups[0]?.selected_options[0]?.quantity, 2);
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

const maps = selectionMapsFromNormalizedGroups(v2Groups.byGroupId);
assert.equal(maps.selectedQuantitiesByGroupId.agregados_extra.bacon, 2);

// --- Cross-group quantity preservation (CONTROLS-FIX-1) ---
const fixtureGroups: PublicCustomizationGroup[] = [
  {
    id: "papas",
    name: "Papas",
    selectionType: "single",
    isRequired: true,
    minSelections: 1,
    maxSelections: null,
    allowsOptionQuantity: false,
    maxTotalQuantity: null,
    isBlocked: false,
    description: null,
    options: [
      {
        id: "papas-chicas",
        name: "Papas chicas",
        priceDelta: 0,
        description: null,
        maxQuantity: 1
      },
      {
        id: "papas-medianas",
        name: "Papas medianas",
        priceDelta: 950,
        description: null,
        maxQuantity: 1
      }
    ]
  },
  {
    id: "salsas",
    name: "Salsas",
    selectionType: "multiple",
    isRequired: false,
    minSelections: 0,
    maxSelections: 5,
    allowsOptionQuantity: false,
    maxTotalQuantity: null,
    isBlocked: false,
    description: null,
    options: [
      {
        id: "mayo",
        name: "Mayonesa",
        priceDelta: 0,
        description: null,
        maxQuantity: 1
      },
      {
        id: "ketchup",
        name: "Ketchup",
        priceDelta: 0,
        description: null,
        maxQuantity: 1
      }
    ]
  },
  {
    id: "agregados_extra",
    name: "Agregados extra",
    selectionType: "multiple",
    isRequired: false,
    minSelections: 0,
    maxSelections: 5,
    allowsOptionQuantity: true,
    maxTotalQuantity: null,
    isBlocked: false,
    description: null,
    options: [
      {
        id: "bacon",
        name: "Bacon",
        priceDelta: 1000,
        description: null,
        maxQuantity: 5
      },
      {
        id: "cheddar",
        name: "Cheddar",
        priceDelta: 500,
        description: null,
        maxQuantity: 5
      }
    ]
  }
];

const baseSelection: CustomizationSelectionStateV2 = normalizeSelectionToV2(
  {
    papas: { "papas-chicas": 1 },
    agregados_extra: { bacon: 3, cheddar: 2 }
  },
  fixtureGroups
);

const afterSalsa = toggleMultipleOptionInV2({
  selection: baseSelection,
  groups: fixtureGroups,
  group: fixtureGroups[1]!,
  optionId: "mayo"
});
assert.equal(afterSalsa.agregados_extra?.bacon, 3, "salsa toggle preserves bacon qty");
assert.equal(afterSalsa.agregados_extra?.cheddar, 2, "salsa toggle preserves cheddar qty");
assert.equal(afterSalsa.salsas?.mayo, 1, "mayo selected");

const afterPapas = selectSingleOptionInV2({
  selection: afterSalsa,
  groups: fixtureGroups,
  group: fixtureGroups[0]!,
  optionId: "papas-medianas"
});
assert.equal(afterPapas.agregados_extra?.bacon, 3, "papas switch preserves bacon qty");
assert.equal(afterPapas.agregados_extra?.cheddar, 2, "papas switch preserves cheddar qty");
assert.equal(afterPapas.papas?.["papas-medianas"], 1, "papas updated");

const afterSalsaOff = toggleMultipleOptionInV2({
  selection: afterPapas,
  groups: fixtureGroups,
  group: fixtureGroups[1]!,
  optionId: "mayo"
});
assert.equal(afterSalsaOff.salsas?.mayo, undefined, "mayo deselected");
assert.equal(afterSalsaOff.agregados_extra?.bacon, 3, "salsa deselect preserves bacon qty");

console.log("ORDER_HELPER_QA = PASS");
