/**
 * Pure verify: contextual WhatsApp template default matrix + fallbacks.
 *
 * Run: npx tsx lib/whatsapp/admin-contextual-default.verify.ts
 */
import assert from "node:assert/strict";

import {
  buildContextualOrderWhatsappUrl,
  buildOrderWhatsappMessage,
  getPreferredWhatsappTemplateKeyForOrder,
  resolveWhatsappTemplateKey,
  type AdminOrderWhatsappTemplateKey
} from "@/lib/whatsapp/admin";

type MatrixCase = {
  status: string;
  deliveryMethod: string;
  expected: AdminOrderWhatsappTemplateKey;
};

const MATRIX: MatrixCase[] = [
  { status: "pending", deliveryMethod: "delivery", expected: "received" },
  { status: "pending", deliveryMethod: "pickup", expected: "received" },
  { status: "preparing", deliveryMethod: "delivery", expected: "preparing" },
  { status: "preparing", deliveryMethod: "pickup", expected: "preparing" },
  { status: "ready", deliveryMethod: "delivery", expected: "ready_delivery" },
  { status: "ready", deliveryMethod: "pickup", expected: "ready_pickup" },
  { status: "completed", deliveryMethod: "delivery", expected: "summary" },
  { status: "completed", deliveryMethod: "pickup", expected: "summary" },
  { status: "cancelled", deliveryMethod: "delivery", expected: "summary" },
  { status: "cancelled", deliveryMethod: "pickup", expected: "summary" }
];

for (const row of MATRIX) {
  const actual = getPreferredWhatsappTemplateKeyForOrder({
    status: row.status,
    deliveryMethod: row.deliveryMethod
  });
  assert.equal(
    actual,
    row.expected,
    `${row.status}+${row.deliveryMethod} → ${row.expected}, got ${actual}`
  );
}

assert.equal(
  getPreferredWhatsappTemplateKeyForOrder({
    status: "unknown_status",
    deliveryMethod: "delivery"
  }),
  "summary",
  "unknown status → summary"
);

assert.equal(
  getPreferredWhatsappTemplateKeyForOrder({
    status: "ready",
    deliveryMethod: "unknown_method"
  }),
  "summary",
  "ready + unknown modality → summary"
);

assert.equal(
  resolveWhatsappTemplateKey("ready_delivery", ["ready_delivery", "confirm_address", "summary"]),
  "ready_delivery",
  "preferred available → preferred"
);

assert.equal(
  resolveWhatsappTemplateKey("received", ["confirm_address", "on_the_way", "summary"]),
  "summary",
  "preferred missing + summary → summary"
);

assert.equal(
  resolveWhatsappTemplateKey("received", ["confirm_address", "on_the_way"]),
  "confirm_address",
  "preferred missing + no summary → first available"
);

assert.equal(
  resolveWhatsappTemplateKey("summary", []),
  "",
  "no templates → empty"
);

const completedDeliveryOrder = {
  id: "qa-completed-delivery",
  customer_name: "Mauro Ramirez",
  phone: "5491112345678",
  delivery_method: "delivery" as const,
  address: "Calle Falsa 123",
  status: "completed" as const,
  total_price: 1000,
  item_summary: "1x Test",
  order_items: [{ product_name: "Test", quantity: 1 }]
};

const contextualUrl = buildContextualOrderWhatsappUrl(completedDeliveryOrder);
assert.ok(contextualUrl, "contextual URL should exist when phone present");

const summaryMessage = buildOrderWhatsappMessage("summary", completedDeliveryOrder);
const confirmMessage = buildOrderWhatsappMessage("confirm_address", completedDeliveryOrder);
assert.ok(
  contextualUrl!.includes(encodeURIComponent(summaryMessage)),
  "completed+delivery contextual URL must use summary message"
);
assert.equal(
  contextualUrl!.includes(encodeURIComponent(confirmMessage)),
  false,
  "completed+delivery contextual URL must NOT use confirm_address"
);

assert.equal(
  buildContextualOrderWhatsappUrl({ ...completedDeliveryOrder, phone: null }),
  null,
  "no phone → null URL"
);

console.log("admin-contextual-default.verify.ts: PASS");
