/**
 * Pure verify: customer-facing order summary model + formatters.
 *
 * Run: npx tsx lib/orders/customer-order-summary.verify.ts
 */
import assert from "node:assert/strict";

import {
  buildCustomerOrderSummary,
  formatPlainTextCustomerOrderProducts,
  formatPlainTextCustomerOrderSummary,
  formatWhatsappCustomerOrderProducts
} from "@/lib/orders/customer-order-summary";
import { buildOrderDisplayRef } from "@/lib/orders/display-ref";
import type { OrderItemLike } from "@/lib/product-customization/order-dashboard";

const ORDER_ID = "e6e2a819-3018-48f9-b9d9-4025b4847dc3";
assert.equal(buildOrderDisplayRef(ORDER_ID), "7DC3");

function item(
  overrides: Partial<OrderItemLike> & Pick<OrderItemLike, "product_name" | "id">
): OrderItemLike {
  return {
    product_id: overrides.product_id ?? "p1",
    quantity: overrides.quantity ?? 1,
    unit_price: overrides.unit_price ?? 1000,
    item_kind: overrides.item_kind ?? "product",
    parent_order_item_id: overrides.parent_order_item_id ?? null,
    customization_snapshot: overrides.customization_snapshot ?? null,
    description: overrides.description ?? null,
    ...overrides
  };
}

const v2BbqSnapshot = {
  version: 2 as const,
  source: "public_checkout" as const,
  configuration_signature: "sig-v2",
  product: { id: "bbq", name: "BBQ Bacon" },
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
          price_delta: 0,
          quantity: 1,
          total_price_delta: 0,
          sort_order: 0
        }
      ]
    },
    {
      group_id: "g-salsas",
      group_name: "Salsas",
      selection_type: "multiple" as const,
      allows_option_quantity: false,
      is_required: false,
      min_selections: 0,
      max_selections: 5,
      max_total_quantity: null,
      sort_order: 1,
      selected_options: [
        {
          option_id: "o-mac",
          option_name: "Big Mac",
          price_delta: 0,
          quantity: 1,
          total_price_delta: 0,
          sort_order: 0
        },
        {
          option_id: "o-bbq",
          option_name: "BBQ",
          price_delta: 0,
          quantity: 1,
          total_price_delta: 0,
          sort_order: 1
        }
      ]
    },
    {
      group_id: "g-extras",
      group_name: "Agregados extra",
      selection_type: "multiple" as const,
      allows_option_quantity: true,
      is_required: false,
      min_selections: 0,
      max_selections: null,
      max_total_quantity: null,
      sort_order: 2,
      selected_options: [
        {
          option_id: "o-bacon",
          option_name: "Bacon",
          price_delta: 500,
          quantity: 4,
          total_price_delta: 2000,
          sort_order: 0
        },
        {
          option_id: "o-cheddar",
          option_name: "Cheddar",
          price_delta: 400,
          quantity: 4,
          total_price_delta: 1600,
          sort_order: 1
        }
      ]
    }
  ],
  pricing: { base_unit_price: 10000, customization_total: 3600, final_unit_price: 13600 },
  summary: []
};

const v2SmashSnapshot = {
  version: 2 as const,
  source: "public_checkout" as const,
  configuration_signature: "sig-smash",
  product: { id: "smash", name: "Doble Smash" },
  groups: [
    {
      group_id: "g-papas-2",
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
          option_id: "o-papas-2",
          option_name: "Papas grandes",
          price_delta: 0,
          quantity: 1,
          total_price_delta: 0,
          sort_order: 0
        }
      ]
    }
  ],
  pricing: { base_unit_price: 9000, customization_total: 0, final_unit_price: 9000 },
  summary: []
};

const v2Items: OrderItemLike[] = [
  item({
    id: "root-bbq",
    product_name: "BBQ Bacon",
    quantity: 2,
    customization_snapshot: v2BbqSnapshot
  }),
  item({
    id: "upsell-bbq",
    product_name: "Coca Cola 500ml",
    quantity: 2,
    item_kind: "upsell",
    parent_order_item_id: "root-bbq"
  }),
  item({
    id: "root-smash",
    product_name: "Doble Smash",
    quantity: 1,
    customization_snapshot: v2SmashSnapshot
  })
];

const v2Summary = buildCustomerOrderSummary({
  id: ORDER_ID,
  customer_name: "Mauro Ramirez",
  delivery_method: "delivery",
  address: "Núñez N°3050, Glew",
  notes: "Sin cebolla",
  order_items: v2Items
});

assert.equal(v2Summary.orderRef, "7DC3");
assert.equal(v2Summary.roots.length, 2);
assert.equal(v2Summary.roots[0]?.additionals.length, 1);
assert.equal(v2Summary.roots[0]?.additionals[0]?.productName, "Coca Cola 500ml");
assert.equal(v2Summary.roots[1]?.additionals.length, 0);

const v2WhatsappProducts = formatWhatsappCustomerOrderProducts(v2Summary);
assert.match(v2WhatsappProducts, /^\*2× BBQ Bacon\*/m);
assert.match(v2WhatsappProducts, /- Papas: Papas grandes/);
assert.match(v2WhatsappProducts, /- Salsas: Big Mac \/ BBQ/);
assert.match(v2WhatsappProducts, /- Agregados extra: Bacon ×4 c\/u \/ Cheddar ×4 c\/u/);
assert.match(v2WhatsappProducts, /- Adicional: Coca Cola 500ml ×2/);
assert.match(v2WhatsappProducts, /\*1× Doble Smash\*/);
assert.equal(v2WhatsappProducts.includes("8 total"), false);
assert.equal(v2WhatsappProducts.includes("Total:"), false);
assert.equal(v2WhatsappProducts.includes("--------------------------------"), false);
assert.ok(v2WhatsappProducts.includes("\n\n*1× Doble Smash*"));

const v2Plain = formatPlainTextCustomerOrderSummary(v2Summary);
assert.match(v2Plain, /^Pedido #7DC3/m);
assert.match(v2Plain, /^Cliente: Mauro Ramirez/m);
assert.match(v2Plain, /^2× BBQ Bacon$/m);
assert.equal(v2Plain.includes("*2×"), false);
assert.match(v2Plain, /Indicaciones: Sin cebolla/);
assert.match(v2Plain, /Modalidad: Delivery/);
assert.match(v2Plain, /Dirección: Núñez N°3050, Glew/);
assert.equal(v2Plain.includes("Total:"), false);

// Empty notes
for (const notes of [null, "", "   "] as const) {
  const emptyNotes = buildCustomerOrderSummary({
    id: ORDER_ID,
    customer_name: "Mauro",
    delivery_method: "delivery",
    address: "X",
    notes,
    order_items: v2Items
  });
  assert.equal(emptyNotes.notes, null);
  assert.equal(formatPlainTextCustomerOrderSummary(emptyNotes).includes("Indicaciones:"), false);
}

// Pickup — no address line
const pickupSummary = buildCustomerOrderSummary({
  id: ORDER_ID,
  customer_name: "Mauro",
  delivery_method: "pickup",
  address: "Should not appear",
  notes: null,
  order_items: v2Items
});
const pickupPlain = formatPlainTextCustomerOrderSummary(pickupSummary);
assert.match(pickupPlain, /Modalidad: Retiro/);
assert.equal(pickupPlain.includes("Dirección:"), false);

// V1 — no ×N c/u fabrication
const v1Snapshot = {
  version: 1 as const,
  source: "public_checkout" as const,
  configuration_signature: "sig-v1",
  product: { id: "bbq", name: "BBQ Bacon" },
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
        { option_id: "o1", option_name: "Papas grandes", price_delta: 0, sort_order: 0 }
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
        { option_id: "o2", option_name: "Big Mac", price_delta: 0, sort_order: 0 },
        { option_id: "o3", option_name: "BBQ", price_delta: 0, sort_order: 1 }
      ]
    },
    {
      group_id: "g-extras",
      group_name: "Agregados extra",
      selection_type: "multiple" as const,
      is_required: false,
      min_selections: 0,
      max_selections: null,
      sort_order: 2,
      selected_options: [
        { option_id: "o4", option_name: "Bacon", price_delta: 0, sort_order: 0 },
        { option_id: "o5", option_name: "Cheddar", price_delta: 0, sort_order: 1 }
      ]
    }
  ],
  pricing: { base_unit_price: 10000, customization_total: 0, final_unit_price: 10000 },
  summary: []
};

const v1Summary = buildCustomerOrderSummary({
  id: ORDER_ID,
  customer_name: "Mauro",
  delivery_method: "delivery",
  address: "Addr",
  notes: null,
  order_items: [
    item({
      id: "v1-root",
      product_name: "BBQ Bacon",
      quantity: 2,
      customization_snapshot: v1Snapshot
    }),
    item({
      id: "v1-upsell",
      product_name: "Coca Cola 500ml",
      quantity: 2,
      item_kind: "upsell",
      parent_order_item_id: "v1-root"
    })
  ]
});

const v1Products = formatWhatsappCustomerOrderProducts(v1Summary);
assert.match(v1Products, /\*2× BBQ Bacon\*/);
assert.match(v1Products, /- Papas: Papas grandes/);
assert.match(v1Products, /- Salsas: Big Mac \/ BBQ/);
assert.match(v1Products, /- Agregados extra: Bacon \/ Cheddar/);
assert.match(v1Products, /- Adicional: Coca Cola 500ml ×2/);
assert.equal(v1Products.includes("c/u"), false);

// Legacy
const legacySummary = buildCustomerOrderSummary({
  id: ORDER_ID,
  customer_name: "Mauro",
  delivery_method: "pickup",
  order_items: [item({ id: "legacy", product_name: "BBQ Bacon", quantity: 2 })]
});
assert.equal(formatWhatsappCustomerOrderProducts(legacySummary), "*2× BBQ Bacon*");
assert.equal(formatPlainTextCustomerOrderProducts(legacySummary), "2× BBQ Bacon");

// Malformed snapshot — root still renders
const malformedSummary = buildCustomerOrderSummary({
  id: ORDER_ID,
  customer_name: "Mauro",
  delivery_method: "delivery",
  order_items: [
    item({
      id: "bad",
      product_name: "BBQ Bacon",
      quantity: 1,
      customization_snapshot: "not-an-object"
    })
  ]
});
assert.equal(formatWhatsappCustomerOrderProducts(malformedSummary), "*1× BBQ Bacon*");
assert.equal(malformedSummary.roots[0]?.groups.length, 0);

// Multi-root upsell association
assert.equal(v2Summary.roots[0]?.additionals[0]?.quantity, 2);
assert.equal(v2Summary.roots[1]?.productName, "Doble Smash");

// Huevo ×1 c/u retained for qty-enabled qty=1
const huevoSnapshot = {
  ...v2BbqSnapshot,
  groups: [
    {
      group_id: "g-extras",
      group_name: "Agregados extra",
      selection_type: "multiple" as const,
      allows_option_quantity: true,
      is_required: false,
      min_selections: 0,
      max_selections: null,
      max_total_quantity: null,
      sort_order: 0,
      selected_options: [
        {
          option_id: "o-huevo",
          option_name: "Huevo",
          price_delta: 0,
          quantity: 1,
          total_price_delta: 0,
          sort_order: 0
        }
      ]
    }
  ]
};
const huevoSummary = buildCustomerOrderSummary({
  id: ORDER_ID,
  customer_name: "Mauro",
  delivery_method: "delivery",
  order_items: [
    item({
      id: "huevo-root",
      product_name: "BBQ Bacon",
      quantity: 1,
      customization_snapshot: huevoSnapshot
    })
  ]
});
assert.match(
  formatWhatsappCustomerOrderProducts(huevoSummary),
  /Huevo ×1 c\/u/
);

// Order code awareness
const codeSummary = buildCustomerOrderSummary({
  id: ORDER_ID,
  order_code: "K7M4Q9",
  customer_name: "Mauro Ramirez",
  delivery_method: "delivery",
  order_items: []
});
assert.equal(codeSummary.orderRef, "K7M4Q9");
assert.match(formatPlainTextCustomerOrderSummary(codeSummary), /^Pedido #K7M4Q9/);

// Fallback to legacy UUID ref when order_code is omitted/null
const legacyRefSummary = buildCustomerOrderSummary({
  id: ORDER_ID,
  customer_name: "Mauro Ramirez",
  delivery_method: "delivery",
  order_items: []
});
assert.equal(legacyRefSummary.orderRef, "7DC3");
assert.match(formatPlainTextCustomerOrderSummary(legacyRefSummary), /^Pedido #7DC3/);

console.log("customer-order-summary.verify.ts: PASS");
