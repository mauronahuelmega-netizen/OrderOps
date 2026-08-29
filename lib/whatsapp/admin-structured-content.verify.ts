/**
 * Pure verify: structured WhatsApp / Copy contact messaging contracts.
 *
 * Run: npx tsx lib/whatsapp/admin-structured-content.verify.ts
 */
import assert from "node:assert/strict";

import {
  buildAdminOrderWhatsappUrl,
  buildOrderContactSummary,
  buildOrderWhatsappMessage
} from "@/lib/whatsapp/admin";

const ORDER_ID = "e6e2a819-3018-48f9-b9d9-4025b4847dc3";

const v2BbqSnapshot = {
  version: 2,
  source: "public_checkout",
  configuration_signature: "sig-v2",
  product: { id: "bbq", name: "BBQ Bacon" },
  groups: [
    {
      group_id: "g-papas",
      group_name: "Papas",
      selection_type: "single",
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
      selection_type: "multiple",
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
      selection_type: "multiple",
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
  version: 2,
  source: "public_checkout",
  configuration_signature: "sig-smash",
  product: { id: "smash", name: "Doble Smash" },
  groups: [
    {
      group_id: "g-papas-2",
      group_name: "Papas",
      selection_type: "single",
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

const richOrder = {
  id: ORDER_ID,
  customer_name: "Mauro Ramirez",
  phone: "+5491159126321",
  delivery_method: "delivery" as const,
  address: "Núñez N°3050, Glew",
  status: "pending" as const,
  total_price: 68600,
  notes: "Sin cebolla",
  order_items: [
    {
      id: "root-bbq",
      product_name: "BBQ Bacon",
      quantity: 2,
      unit_price: 13600,
      item_kind: "product" as const,
      parent_order_item_id: null,
      customization_snapshot: v2BbqSnapshot
    },
    {
      id: "upsell-bbq",
      product_name: "Coca Cola 500ml",
      quantity: 2,
      unit_price: 2500,
      item_kind: "upsell" as const,
      parent_order_item_id: "root-bbq",
      customization_snapshot: null
    },
    {
      id: "root-smash",
      product_name: "Doble Smash",
      quantity: 1,
      unit_price: 9000,
      item_kind: "product" as const,
      parent_order_item_id: null,
      customization_snapshot: v2SmashSnapshot
    }
  ]
};

const expectedReceived = `Hola Mauro

Recibimos tu pedido #7DC3:

*2× BBQ Bacon*
- Papas: Papas grandes
- Salsas: Big Mac / BBQ
- Agregados extra: Bacon ×4 c/u / Cheddar ×4 c/u
- Adicional: Coca Cola 500ml ×2

*1× Doble Smash*
- Papas: Papas grandes

Indicaciones: Sin cebolla

Te avisamos apenas comience la preparación.`;

const received = buildOrderWhatsappMessage("received", richOrder);
assert.equal(received, expectedReceived);

const expectedSummary = `Hola Mauro

Te compartimos el resumen de tu pedido #7DC3:

*2× BBQ Bacon*
- Papas: Papas grandes
- Salsas: Big Mac / BBQ
- Agregados extra: Bacon ×4 c/u / Cheddar ×4 c/u
- Adicional: Coca Cola 500ml ×2

*1× Doble Smash*
- Papas: Papas grandes

Indicaciones: Sin cebolla

Modalidad: Delivery
Dirección: Núñez N°3050, Glew`;

assert.equal(buildOrderWhatsappMessage("summary", richOrder), expectedSummary);

assert.equal(
  buildOrderWhatsappMessage("preparing", { ...richOrder, status: "preparing" }),
  `Hola Mauro

Tu pedido #7DC3 ya está en preparación.`
);

assert.equal(
  buildOrderWhatsappMessage("ready_pickup", {
    ...richOrder,
    status: "ready",
    delivery_method: "pickup"
  }),
  `Hola Mauro

Tu pedido #7DC3 está listo para retirar.

Te esperamos.`
);

assert.equal(
  buildOrderWhatsappMessage("ready_delivery", { ...richOrder, status: "ready" }),
  `Hola Mauro

Tu pedido #7DC3 está listo para delivery.`
);

assert.equal(
  buildOrderWhatsappMessage("on_the_way", richOrder),
  `Hola Mauro

Tu pedido #7DC3 ya está en camino.`
);

assert.equal(
  buildOrderWhatsappMessage("confirm_address", richOrder),
  `Hola Mauro

Nos confirmás esta dirección para el envío del pedido #7DC3?

Núñez N°3050, Glew`
);

for (const key of ["preparing", "ready_pickup", "ready_delivery", "on_the_way"] as const) {
  const message = buildOrderWhatsappMessage(key, {
    ...richOrder,
    status: key === "preparing" ? "preparing" : "ready",
    delivery_method: key === "ready_pickup" ? "pickup" : "delivery"
  });
  assert.equal(message.includes("BBQ Bacon"), false, `${key} must not dump products`);
  assert.equal(message.includes("Papas"), false, `${key} must not dump groups`);
  assert.equal(message.includes("Total:"), false, `${key} must omit Total`);
  assert.equal(message.includes("Indicaciones:"), false, `${key} must omit notes`);
  assert.equal(message.includes("8 total"), false);
}

assert.equal(received.includes("Total:"), false);
assert.equal(received.includes("8 total"), false);
assert.equal(buildOrderWhatsappMessage("confirm_address", richOrder).includes("BBQ"), false);
assert.equal(buildOrderWhatsappMessage("confirm_address", richOrder).includes("Total:"), false);
assert.equal(
  buildOrderWhatsappMessage("confirm_address", richOrder).includes("Indicaciones:"),
  false
);

const pickupSummary = buildOrderWhatsappMessage("summary", {
  ...richOrder,
  delivery_method: "pickup",
  address: "Local fake"
});
assert.match(pickupSummary, /Modalidad: Retiro/);
assert.equal(pickupSummary.includes("Dirección:"), false);

const noNotesReceived = buildOrderWhatsappMessage("received", { ...richOrder, notes: "   " });
assert.equal(noNotesReceived.includes("Indicaciones:"), false);

const expectedPlain = `Pedido #7DC3
Cliente: Mauro Ramirez

2× BBQ Bacon
- Papas: Papas grandes
- Salsas: Big Mac / BBQ
- Agregados extra: Bacon ×4 c/u / Cheddar ×4 c/u
- Adicional: Coca Cola 500ml ×2

1× Doble Smash
- Papas: Papas grandes

Indicaciones: Sin cebolla

Modalidad: Delivery
Dirección: Núñez N°3050, Glew`;

const plain = buildOrderContactSummary(richOrder);
assert.equal(plain, expectedPlain);
assert.equal(plain.includes("*"), false);
assert.equal(plain.includes("Total:"), false);

// Share uses same builder — identity contract
assert.equal(buildOrderContactSummary(richOrder), plain);

const summaryMessage = buildOrderWhatsappMessage("summary", richOrder);
const url = buildAdminOrderWhatsappUrl({
  customerPhone: richOrder.phone!,
  message: summaryMessage
});
const encodedText = url.split("text=")[1] ?? "";
const decoded = decodeURIComponent(encodedText);
assert.equal(decoded, summaryMessage, "URL text roundtrip must match summary message");
assert.ok(decoded.includes("*2× BBQ Bacon*"));
assert.ok(decoded.includes("3050"));
assert.ok(decoded.includes("\n"));
// encodeURIComponent leaves `*` unescaped (ECMAScript unescaped set); bold markers survive literally.
assert.ok(encodedText.includes("*2") || encodedText.includes("%2A2"));
assert.equal((encodedText.match(/%252A/g) ?? []).length, 0, "must not double-encode asterisks");
assert.ok(encodedText.includes("%0A") || encodedText.includes("%0a"), "newlines must be encoded");

// Order code in structured WhatsApp and plain text contact summary
const codeOrder = {
  ...richOrder,
  order_code: "K7M4Q9"
};
const codeReceived = buildOrderWhatsappMessage("received", codeOrder);
assert.match(codeReceived, /Recibimos tu pedido #K7M4Q9:/);

const codeSummaryMessage = buildOrderWhatsappMessage("summary", codeOrder);
assert.match(codeSummaryMessage, /resumen de tu pedido #K7M4Q9:/);

const codePlain = buildOrderContactSummary(codeOrder);
assert.match(codePlain, /^Pedido #K7M4Q9/);

console.log("admin-structured-content.verify.ts: PASS");
console.log("--- AFTER WHATSAPP SUMMARY ---");
console.log(expectedSummary);
console.log("--- AFTER PLAIN TEXT ---");
console.log(expectedPlain);
