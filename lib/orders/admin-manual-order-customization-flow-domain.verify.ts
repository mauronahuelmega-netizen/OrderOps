/**
 * Boundary + payload contracts for ADMIN-MANUAL-ORDER-CUSTOMIZATION-FLOW-DOMAIN-1.
 *
 * Run: npx tsx lib/orders/admin-manual-order-customization-flow-domain.verify.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import type { LocalCartSelectedGroup } from "@/lib/cart/types";
import { toManualOrderCreateOrderItems } from "@/lib/orders/manual-order-customization-payload";
import {
  createManualConfiguredTicketBundle,
  createManualSimpleTicketLine
} from "@/lib/orders/manual-order-customization-ticket";
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
      `${relativePath} must not contain domain-wiring leakage (${token})`
    );
  }
}

const ticketSource = read("lib/orders/manual-order-customization-ticket.ts");
const payloadSource = read("lib/orders/manual-order-customization-payload.ts");
const actions = read("app/admin/(protected)/orders/actions.ts");
const modal = read("components/admin/orders/manual-order-modal.tsx");
const modalCss = read("components/admin/orders/manual-order-modal.module.css");
const eligibility = read("lib/orders/manual-order-customization-eligibility.ts");
const safety = read("lib/orders/manual-order-customization-safety.ts");

assert.equal(ticketSource.includes("createManualSimpleTicketLine"), true);
assert.equal(ticketSource.includes("createManualConfiguredTicketLine"), true);
assert.equal(ticketSource.includes("createManualUpsellTicketLine"), true);
assert.equal(ticketSource.includes("mergeManualTicketLine"), true);
assert.equal(ticketSource.includes("removeManualTicketLine"), true);
assert.equal(ticketSource.includes("updateManualTicketLineQuantity"), true);
assert.equal(ticketSource.includes("getManualTicketEstimatedTotal"), true);
assert.equal(ticketSource.includes("buildCartConfigurationSignature"), true);
assert.equal(ticketSource.includes("buildCustomizationSnapshotV2"), true);

assert.equal(payloadSource.includes("toManualOrderCreateOrderItems"), true);
assert.equal(payloadSource.includes("toManualOrderCreateOrderRpcJson"), true);
assert.equal(
  /from\s+["']@\/lib\/product-customization\/order-validation["']/.test(
    payloadSource
  ),
  false
);
assert.equal(payloadSource.includes('import "server-only"'), false);

// Payload adapter behavior
const configGroups: PublicCustomizationGroup[] = [
  {
    id: "g1",
    name: "Extras",
    description: null,
    selectionType: "multiple",
    isRequired: false,
    minSelections: 0,
    maxSelections: null,
    allowsOptionQuantity: true,
    options: [{ id: "o1", name: "Bacon", description: null, priceDelta: 1000 }],
    isBlocked: false
  }
];

const selectedGroups: LocalCartSelectedGroup[] = [
  {
    groupId: "g1",
    groupName: "Extras",
    selectionType: "multiple",
    isRequired: false,
    minSelections: 0,
    maxSelections: null,
    allowsOptionQuantity: true,
    sortOrder: 0,
    selectedOptions: [
      {
        optionId: "o1",
        optionName: "Bacon",
        priceDelta: 1000,
        quantity: 1,
        sortOrder: 0
      }
    ]
  }
];

const simple = createManualSimpleTicketLine({
  productId: "coca",
  productName: "Coca Cola 500ml",
  unitPrice: 3000,
  quantity: 2,
  clientLineId: "manual-simple-1"
});
const simplePayload = toManualOrderCreateOrderItems([simple]);
assert.equal(simplePayload.ok, true);
if (simplePayload.ok) {
  assert.deepEqual(simplePayload.items[0], {
    client_line_id: "manual-simple-1",
    product_id: "coca",
    quantity: 2,
    item_kind: "product"
  });
}

const bundle = createManualConfiguredTicketBundle({
  productId: "bbq",
  productName: "BBQ Bacon",
  baseUnitPrice: 12000,
  quantity: 2,
  clientLineId: "manual-parent-1",
  selectedGroups,
  configGroups,
  upsells: [
    {
      productId: "coca-upsell",
      productName: "Coca Cola 500ml",
      unitPrice: 3000,
      clientLineId: "manual-child-1"
    }
  ]
});

const richPayload = toManualOrderCreateOrderItems([
  bundle.parent,
  ...bundle.children
]);
assert.equal(richPayload.ok, true);
if (richPayload.ok) {
  assert.equal(richPayload.items.length, 2);
  assert.equal(richPayload.items[0].item_kind, "product");
  assert.equal(richPayload.items[1].item_kind, "upsell");
  const parentItem = richPayload.items[0] as {
    unit_price?: number;
    customization_snapshot?: { version?: number };
    client_line_id: string;
  };
  assert.equal(parentItem.client_line_id, "manual-parent-1");
  assert.equal(parentItem.unit_price, 13000);
  assert.equal(parentItem.customization_snapshot?.version, 2);
  const childItem = richPayload.items[1] as {
    parent_client_line_id?: string;
    unit_price?: number;
  };
  assert.equal(childItem.parent_client_line_id, "manual-parent-1");
  assert.equal("unit_price" in childItem, false);
}

// createManualOrderAction wires checkout cart builder (not domain preview adapter)
assert.equal(actions.includes("toManualOrderCreateOrderItems"), false);
assert.equal(actions.includes("manual-order-customization-ticket"), false);
assert.equal(actions.includes("manualCreateTicketLinesToCheckoutCart"), true);
assert.equal(actions.includes("manual-order-customization-payload"), true);
assert.equal(actions.includes("validateCheckoutCartForCreateOrder"), true);
assert.equal(actions.includes("toCreateOrderRpcJson"), true);
assert.equal(actions.includes("resolveManualOrderProductEligibilityMap"), true);
assert.equal(
  actions.includes("product_id: item.productId") ||
    actions.includes("product_id: item.productId,") ||
    actions.includes("toCreateOrderRpcJson"),
  true
);

// Safety gate remains active in UI + eligibility
assert.equal(modal.includes("Requiere personalización"), true);
assert.equal(
  modal.includes("Usá el catálogo hasta habilitar el selector manual.") ||
    modal.includes("Tocá + para configurar opciones antes de agregar."),
  true
);
assert.equal(modal.includes("isManualOrderAvailable"), true);
assert.equal(modal.includes("toManualOrderCreateOrderItems"), false);
assert.equal(eligibility.includes("productNeedsCustomizationModal"), true);
assert.equal(safety.includes("resolveManualOrderProductEligibilityMap"), true);

// Single-scroll preserved in CSS source
assert.equal(modalCss.includes("@media (max-width: 899px)"), true);
assert.equal(
  /overflow:\s*visible/.test(modalCss) && modalCss.includes("max-height: none"),
  true
);

// Modal may use ticket domain helpers + create-input mapper; must not call domain preview RPC adapter.
assertUntouched("components/admin/orders/manual-order-modal.tsx", [
  "toManualOrderCreateOrderItems"
]);
assertUntouched("components/admin/orders/manual-order-modal.module.css", [
  "toManualOrderCreateOrderItems"
]);
assertUntouched("app/b/[slug]/checkout/actions.ts", [
  "toManualOrderCreateOrderItems",
  "manual-order-customization-ticket"
]);
assertUntouched("components/public/catalog/catalog-client.tsx", [
  "toManualOrderCreateOrderItems"
]);
assertUntouched("components/admin/admin-mobile-drawer.tsx", [
  "toManualOrderCreateOrderItems"
]);
assertUntouched("components/admin/orders/DashboardToolbar.tsx", [
  "toManualOrderCreateOrderItems"
]);
assertUntouched("components/admin/layout/admin-footer.tsx", [
  "toManualOrderCreateOrderItems"
]);
assertUntouched("app/globals.css", ["toManualOrderCreateOrderItems"]);
assertUntouched("app/theme-tokens.css", ["toManualOrderCreateOrderItems"]);
assertUntouched("package.json", ["manual-order-customization-ticket"]);

const migrationsDir = path.join(root, "supabase/migrations");
if (fs.existsSync(migrationsDir)) {
  const migrationLeak = fs
    .readdirSync(migrationsDir)
    .some((name) => /manual.?order.?customization.?flow.?domain/i.test(name));
  assert.equal(migrationLeak, false);
}

console.log("PASS: admin-manual-order-customization-flow-domain.verify.ts");
