/**
 * Source + pure contracts for ADMIN-MANUAL-ORDER-CUSTOMIZATION-FLOW-SERVER-PAYLOAD-1.
 *
 * Run: npx tsx lib/orders/admin-manual-order-customization-flow-server-payload.verify.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import type { LocalCartSelectedGroup } from "@/lib/cart/types";
import {
  localSelectedGroupsToCheckoutGroups,
  manualCreateTicketLinesToCheckoutCart,
  manualTicketLinesToCreateInput,
  toManualOrderCreateOrderItems
} from "@/lib/orders/manual-order-customization-payload";
import {
  createManualConfiguredTicketBundle,
  createManualSimpleTicketLine,
  createManualUpsellTicketLine
} from "@/lib/orders/manual-order-customization-ticket";
import type { ManualOrderCreateTicketLineInput } from "@/lib/orders/manual-order-types";
import type { PublicCustomizationGroup } from "@/lib/product-customization/public-shared";

const root = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assertUntouched(relativePath: string, leakTokens: string[]) {
  const source = read(relativePath);
  for (const token of leakTokens) {
    assert.equal(
      source.includes(token),
      false,
      `${relativePath} must not contain server-payload leakage (${token})`
    );
  }
}

const configGroups: PublicCustomizationGroup[] = [
  {
    id: "g-protein",
    name: "Proteína",
    description: null,
    selectionType: "single",
    isRequired: true,
    minSelections: 1,
    maxSelections: 1,
    allowsOptionQuantity: false,
    options: [
      {
        id: "opt-bacon",
        name: "Bacon",
        description: null,
        priceDelta: 1000,
        maxQuantity: 1
      }
    ],
    isBlocked: false
  },
  {
    id: "g-extra",
    name: "Extras",
    description: null,
    selectionType: "multiple",
    isRequired: false,
    minSelections: 0,
    maxSelections: 2,
    allowsOptionQuantity: true,
    options: [
      {
        id: "opt-cheese",
        name: "Queso",
        description: null,
        priceDelta: 500,
        maxQuantity: 2
      }
    ],
    isBlocked: false
  }
];

const selectedGroups: LocalCartSelectedGroup[] = [
  {
    groupId: "g-protein",
    groupName: "Proteína",
    selectionType: "single",
    isRequired: true,
    minSelections: 1,
    maxSelections: 1,
    sortOrder: 0,
    selectedOptions: [
      {
        optionId: "opt-bacon",
        optionName: "Bacon",
        priceDelta: 1000,
        quantity: 1,
        sortOrder: 0
      }
    ]
  }
];

// --- Pure adapter: simple-only ---
const simple = createManualSimpleTicketLine({
  productId: "coca",
  productName: "Coca Cola 500ml",
  unitPrice: 3000,
  quantity: 2,
  clientLineId: "manual-simple-coca"
});
const simpleInput = manualTicketLinesToCreateInput([simple]);
assert.equal(simpleInput.ok, true);
if (simpleInput.ok) {
  assert.equal(simpleInput.ticketLines.length, 1);
  assert.equal(simpleInput.ticketLines[0].kind, "simple");
  const cart = manualCreateTicketLinesToCheckoutCart(simpleInput.ticketLines);
  assert.equal(cart.ok, true);
  if (cart.ok) {
    assert.equal(cart.cart.legacyItems.length, 1);
    assert.equal(cart.cart.customizedItems.length, 0);
    assert.equal(cart.cart.legacyItems[0].productId, "coca");
    assert.equal(cart.cart.legacyItems[0].quantity, 2);
  }
}

// --- Configured + upsell ---
const bundle = createManualConfiguredTicketBundle({
  productId: "bbq",
  productName: "BBQ Bacon",
  baseUnitPrice: 12000,
  quantity: 2,
  clientLineId: "manual-cfg-bbq",
  selectedGroups,
  configGroups,
  upsells: [
    {
      productId: "fries",
      productName: "Papas",
      unitPrice: 2500,
      clientLineId: "manual-child-fries"
    }
  ]
});
assert.equal(bundle.parent.selectedGroups?.length, 1);
const configuredInput = manualTicketLinesToCreateInput([
  bundle.parent,
  ...bundle.children
]);
assert.equal(configuredInput.ok, true);
if (configuredInput.ok) {
  const cart = manualCreateTicketLinesToCheckoutCart(configuredInput.ticketLines);
  assert.equal(cart.ok, true);
  if (cart.ok) {
    assert.equal(cart.cart.legacyItems.length, 0);
    assert.equal(cart.cart.customizedItems.length, 1);
    const parent = cart.cart.customizedItems[0];
    assert.equal(parent.productId, "bbq");
    assert.equal(parent.quantity, 2);
    assert.equal(parent.cartLineId, "manual-cfg-bbq");
    assert.equal(parent.selectedGroups.length > 0, true);
    assert.equal(parent.upsellItems.length, 1);
    assert.equal(parent.upsellItems[0].parentCartLineId, "manual-cfg-bbq");
    assert.equal(parent.upsellItems[0].productId, "fries");
    // Parent quantity drives child quantity in ticket; checkout builder preserves child qty field
    // (server validator re-syncs to parent qty).
    assert.equal(parent.upsellItems[0].quantity, 2);
  }
}

// --- Bare customized rejected (missing selectedGroups) ---
const bareConfigured: ManualOrderCreateTicketLineInput = {
  kind: "customized",
  clientLineId: "manual-cfg-bare",
  productId: "bbq",
  quantity: 1,
  selectedGroups: [],
  configurationSignature: ""
};
const bareCart = manualCreateTicketLinesToCheckoutCart([bareConfigured]);
assert.equal(bareCart.ok, false);
if (!bareCart.ok) {
  assert.match(bareCart.error, /configuración/i);
}

// --- Duplicate client_line_id ---
const dupCart = manualCreateTicketLinesToCheckoutCart([
  {
    kind: "simple",
    clientLineId: "dup",
    productId: "a",
    quantity: 1
  },
  {
    kind: "simple",
    clientLineId: "dup",
    productId: "b",
    quantity: 1
  }
]);
assert.equal(dupCart.ok, false);

// --- Orphan upsell ---
const orphanCart = manualCreateTicketLinesToCheckoutCart([
  {
    kind: "upsell",
    clientLineId: "orphan",
    productId: "fries",
    quantity: 1,
    parentClientLineId: "missing-parent"
  }
]);
assert.equal(orphanCart.ok, false);
if (!orphanCart.ok) {
  assert.match(orphanCart.error, /adicional/i);
}

// --- Upsell attached to simple parent rejected ---
const upsellOnSimple = manualCreateTicketLinesToCheckoutCart([
  {
    kind: "simple",
    clientLineId: "simple-parent",
    productId: "coca",
    quantity: 1
  },
  {
    kind: "upsell",
    clientLineId: "child",
    productId: "fries",
    quantity: 1,
    parentClientLineId: "simple-parent"
  }
]);
assert.equal(upsellOnSimple.ok, false);

// --- Domain preview adapter still works (not server authority) ---
const preview = toManualOrderCreateOrderItems([bundle.parent, ...bundle.children]);
assert.equal(preview.ok, true);
if (preview.ok) {
  assert.equal(preview.items[0].item_kind, "product");
  assert.equal("customization_snapshot" in preview.items[0], true);
  assert.equal("unit_price" in preview.items[0], true);
  assert.equal(preview.items[1].item_kind, "upsell");
  if (preview.items[1].item_kind === "upsell") {
    assert.equal(preview.items[1].parent_client_line_id, "manual-cfg-bbq");
    assert.equal("unit_price" in preview.items[1], false);
  }
}

// Parent before child in domain adapter
if (preview.ok) {
  const parentIdx = preview.items.findIndex((item) => item.item_kind === "product");
  const childIdx = preview.items.findIndex((item) => item.item_kind === "upsell");
  assert.equal(parentIdx < childIdx, true);
}

// Checkout group mapping
const mappedGroups = localSelectedGroupsToCheckoutGroups(selectedGroups);
assert.equal(mappedGroups[0].groupId, "g-protein");
assert.equal(mappedGroups[0].selectedOptionIds[0], "opt-bacon");
assert.equal(mappedGroups[0].selectedOptions?.[0].quantity, 1);

// Ticket create input never includes unitPrice / snapshot authority fields
if (configuredInput.ok) {
  const json = JSON.stringify(configuredInput.ticketLines);
  assert.equal(json.includes("unitPrice"), false);
  assert.equal(json.includes("customizationSnapshot"), false);
  assert.equal(json.includes("business_id"), false);
}

// Upsell without parent on ticket create input
const orphanTicket = createManualUpsellTicketLine({
  productId: "fries",
  productName: "Papas",
  unitPrice: 2500,
  parentClientLineId: "ghost",
  quantity: 1,
  clientLineId: "orphan-line"
});
const orphanCreate = manualTicketLinesToCreateInput([orphanTicket]);
assert.equal(orphanCreate.ok, false);

// --- Source contracts ---
const actions = read("app/admin/(protected)/orders/actions.ts");
const modal = read("components/admin/orders/manual-order-modal.tsx");
const payload = read("lib/orders/manual-order-customization-payload.ts");
const types = read("lib/orders/manual-order-types.ts");
const safety = read("lib/orders/manual-order-customization-safety.ts");

assert.equal(types.includes("ManualOrderCreateTicketLineInput"), true);
assert.equal(payload.includes("manualCreateTicketLinesToCheckoutCart"), true);
assert.equal(payload.includes("manualTicketLinesToCreateInput"), true);

assert.equal(actions.includes("ticketLines"), true);
assert.equal(actions.includes("validateCheckoutCartForCreateOrder"), true);
assert.equal(actions.includes("toCreateOrderRpcJson"), true);
assert.equal(actions.includes("manualCreateTicketLinesToCheckoutCart"), true);
assert.equal(actions.includes("rejectBareCustomizableProducts"), true);
assert.equal(actions.includes("resolveManualOrderProductEligibilityMap"), true);
assert.equal(
  actions.indexOf("validateCheckoutCartForCreateOrder") <
    actions.indexOf('supabase.rpc("create_order"'),
  true
);
assert.equal(
  actions.indexOf("rejectBareCustomizableProducts") <
    actions.indexOf('supabase.rpc("create_order"'),
  true
);
assert.equal(actions.includes("adminContext.businessId"), true);
assert.equal(actions.includes("input.businessId"), false);
assert.equal(actions.includes("input.unitPrice"), false);
assert.equal(actions.includes("item.customizationSnapshot"), false);
assert.equal(actions.includes("components/public"), false);

assert.equal(modal.includes("manualTicketLinesToCreateInput"), true);
assert.equal(modal.includes("ticketLines: createInput.ticketLines"), true);
assert.equal(modal.includes("canSubmit"), true);
assert.equal(modal.includes("canSubmitLegacy"), false);
assert.equal(
  modal.includes("La creación del pedido se habilita en la próxima etapa"),
  false
);
assert.equal(modal.includes("CUSTOMIZED_SUBMIT_GUARD_COPY"), false);
assert.equal(
  modal.includes("Este producto requiere configuración antes de crear el pedido"),
  true
);
assert.equal(modal.includes("components/public"), false);
assert.equal(modal.includes("toManualOrderCreateOrderItems"), false);

assert.equal(safety.includes("resolveManualOrderProductEligibilityMap"), true);

assertUntouched("components/public/catalog/catalog-client.tsx", [
  "manualCreateTicketLinesToCheckoutCart",
  "ManualOrderCreateTicketLineInput"
]);
assertUntouched("app/b/[slug]/checkout/actions.ts", [
  "manualCreateTicketLinesToCheckoutCart",
  "rejectBareCustomizableProducts"
]);
assertUntouched("components/admin/admin-mobile-drawer.tsx", [
  "manualCreateTicketLinesToCheckoutCart"
]);
assertUntouched("components/admin/orders/DashboardToolbar.tsx", [
  "manualCreateTicketLinesToCheckoutCart"
]);
assertUntouched("components/admin/layout/admin-footer.tsx", [
  "manualCreateTicketLinesToCheckoutCart"
]);
assertUntouched("lib/whatsapp/admin.ts", ["manualCreateTicketLinesToCheckoutCart"]);
assertUntouched("lib/orders/customer-order-summary.ts", [
  "manualCreateTicketLinesToCheckoutCart"
]);
assertUntouched("app/globals.css", ["manualCreateTicketLinesToCheckoutCart"]);
assertUntouched("app/theme-tokens.css", ["manualCreateTicketLinesToCheckoutCart"]);

const migrations = fs.readdirSync(path.join(root, "supabase/migrations"));
assert.equal(
  migrations.some((name) =>
    /manual.?order.?customization.?flow.?server.?payload/i.test(name)
  ),
  false,
  "No server-payload migration allowed"
);

const createOrderSqlTouched = migrations.some((name) => {
  const content = fs.readFileSync(
    path.join(root, "supabase/migrations", name),
    "utf8"
  );
  return (
    /ADMIN-MANUAL-ORDER-CUSTOMIZATION-FLOW-SERVER-PAYLOAD/i.test(content) ||
    /manualCreateTicketLinesToCheckoutCart/.test(content)
  );
});
assert.equal(createOrderSqlTouched, false);

console.log("PASS: admin-manual-order-customization-flow-server-payload.verify.ts");
