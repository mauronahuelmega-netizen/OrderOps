/**
 * Deterministic domain tests for manual-order customization ticket helpers.
 *
 * Run: npx tsx lib/orders/manual-order-customization-ticket.verify.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import type { LocalCartSelectedGroup } from "@/lib/cart/types";
import type { PublicCustomizationGroup } from "@/lib/product-customization/public-shared";
import {
  createManualConfiguredTicketBundle,
  createManualConfiguredTicketLine,
  createManualSimpleTicketLine,
  createManualUpsellTicketLine,
  getManualTicketEstimatedTotal,
  mergeManualConfiguredSelection,
  mergeManualTicketLine,
  normalizeManualTicketQuantity,
  removeManualTicketLine,
  updateManualTicketLineQuantity
} from "@/lib/orders/manual-order-customization-ticket";
import { toManualOrderCreateOrderItems } from "@/lib/orders/manual-order-customization-payload";

const root = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const configGroups: PublicCustomizationGroup[] = [
  {
    id: "g-extra",
    name: "Extras",
    description: null,
    selectionType: "multiple",
    isRequired: false,
    minSelections: 0,
    maxSelections: 3,
    allowsOptionQuantity: true,
    options: [
      { id: "opt-bacon", name: "Bacon", description: null, priceDelta: 1000, maxQuantity: 3 },
      { id: "opt-cheese", name: "Queso", description: null, priceDelta: 500, maxQuantity: 2 }
    ],
    isBlocked: false
  }
];

const selectedBacon1: LocalCartSelectedGroup[] = [
  {
    groupId: "g-extra",
    groupName: "Extras",
    selectionType: "multiple",
    isRequired: false,
    minSelections: 0,
    maxSelections: 3,
    allowsOptionQuantity: true,
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

const selectedBacon2: LocalCartSelectedGroup[] = [
  {
    groupId: "g-extra",
    groupName: "Extras",
    selectionType: "multiple",
    isRequired: false,
    minSelections: 0,
    maxSelections: 3,
    allowsOptionQuantity: true,
    sortOrder: 0,
    selectedOptions: [
      {
        optionId: "opt-bacon",
        optionName: "Bacon",
        priceDelta: 1000,
        quantity: 2,
        sortOrder: 0
      }
    ]
  }
];

// 1. simple line creation
const simple = createManualSimpleTicketLine({
  productId: "coca",
  productName: "Coca Cola 500ml",
  categoryName: "Bebidas",
  unitPrice: 3000,
  quantity: 1,
  clientLineId: "manual-simple-coca"
});
assert.equal(simple.kind, "simple");
assert.equal(simple.customizationSnapshot, null);
assert.equal(simple.parentClientLineId, null);
assert.equal(simple.unitPrice, 3000);
assert.equal(simple.lineTotal, 3000);
assert.equal(simple.signature.includes("product:coca"), true);
assert.equal(simple.signature.includes("|groups:"), true);

// 2. simple same product merge
let ticket = mergeManualTicketLine(
  [simple],
  createManualSimpleTicketLine({
    productId: "coca",
    productName: "Coca Cola 500ml",
    unitPrice: 3000,
    quantity: 2,
    clientLineId: "manual-simple-coca-2"
  })
);
assert.equal(ticket.length, 1);
assert.equal(ticket[0].quantity, 3);
assert.equal(ticket[0].lineTotal, 9000);

// 3. simple quantity update
ticket = updateManualTicketLineQuantity(ticket, "manual-simple-coca", 2);
assert.equal(ticket[0].quantity, 2);
assert.equal(ticket[0].lineTotal, 6000);

// 4. configured parent line creation
const configured = createManualConfiguredTicketLine({
  productId: "bbq",
  productName: "BBQ Bacon",
  categoryName: "Burgers",
  baseUnitPrice: 12000,
  quantity: 1,
  clientLineId: "manual-cfg-bbq",
  selectedGroups: selectedBacon1,
  configGroups
});
assert.equal(configured.kind, "customized");
assert.equal(configured.unitPrice, 13000);
assert.equal(configured.lineTotal, 13000);
assert.ok(configured.customizationSnapshot);
assert.equal(configured.customizationSnapshot?.version, 2);
assert.equal(configured.selectedGroups?.length, 1);
assert.equal(configured.displaySummary.length > 0, true);
assert.equal(configured.signature.includes("opt-baconx1"), true);
assert.equal(/\|qty:|quantity:2/.test(configured.signature), false);

// 14. signature does not include parent quantity
assert.equal(configured.signature.includes("quantity"), false);
const configuredQty2 = createManualConfiguredTicketLine({
  productId: "bbq",
  productName: "BBQ Bacon",
  baseUnitPrice: 12000,
  quantity: 2,
  clientLineId: "manual-cfg-bbq-q2",
  selectedGroups: selectedBacon1,
  configGroups
});
assert.equal(configured.signature, configuredQty2.signature);

// 5. configured same signature merge
ticket = mergeManualTicketLine([configured], configuredQty2);
assert.equal(ticket.length, 1);
assert.equal(ticket[0].clientLineId, "manual-cfg-bbq");
assert.equal(ticket[0].quantity, 3);
assert.equal(ticket[0].lineTotal, 39000);

// 6. configured different signature stays separate
const configuredDiff = createManualConfiguredTicketLine({
  productId: "bbq",
  productName: "BBQ Bacon",
  baseUnitPrice: 12000,
  quantity: 1,
  clientLineId: "manual-cfg-bbq-bacon2",
  selectedGroups: selectedBacon2,
  configGroups
});
ticket = mergeManualTicketLine(ticket, configuredDiff);
assert.equal(ticket.length, 2);
assert.notEqual(configured.signature, configuredDiff.signature);

// 7. simple vs customized same product stay separate
ticket = mergeManualTicketLine(
  ticket,
  createManualSimpleTicketLine({
    productId: "bbq",
    productName: "BBQ Bacon",
    unitPrice: 12000,
    quantity: 1,
    clientLineId: "manual-simple-bbq"
  })
);
assert.equal(ticket.some((line) => line.kind === "simple" && line.productId === "bbq"), true);
assert.equal(
  ticket.filter((line) => line.productId === "bbq").length >= 3,
  true
);

// 8. upsell child creation with parent link
const bundle = createManualConfiguredTicketBundle({
  productId: "smash",
  productName: "Doble Smash",
  baseUnitPrice: 12500,
  quantity: 2,
  clientLineId: "manual-cfg-smash",
  selectedGroups: selectedBacon1,
  configGroups,
  upsells: [
    {
      productId: "sprite",
      productName: "Sprite 500ml",
      unitPrice: 3000,
      clientLineId: "manual-upsell-sprite"
    }
  ]
});
assert.equal(bundle.parent.kind, "customized");
assert.equal(bundle.children.length, 1);
assert.equal(bundle.children[0].kind, "upsell");
assert.equal(bundle.children[0].parentClientLineId, "manual-cfg-smash");
assert.equal(bundle.children[0].quantity, 2);
assert.equal(bundle.children[0].lineTotal, 6000);
assert.equal(bundle.parent.signature.includes("sprite"), true);

ticket = mergeManualConfiguredSelection([], bundle);
assert.equal(ticket.length, 2);

// 11. parent quantity update updates child quantity/total
ticket = updateManualTicketLineQuantity(ticket, "manual-cfg-smash", 3);
const smashParent = ticket.find((line) => line.clientLineId === "manual-cfg-smash");
const spriteChild = ticket.find((line) => line.clientLineId === "manual-upsell-sprite");
assert.equal(smashParent?.quantity, 3);
assert.equal(spriteChild?.quantity, 3);
assert.equal(spriteChild?.lineTotal, 9000);

// 12. estimated total includes parents + upsell children
const estimated = getManualTicketEstimatedTotal(ticket);
assert.equal(
  estimated,
  (smashParent?.lineTotal ?? 0) + (spriteChild?.lineTotal ?? 0)
);
assert.equal(estimated, smashParent!.unitPrice * 3 + 3000 * 3);

// 9. remove parent cascades children
ticket = removeManualTicketLine(ticket, "manual-cfg-smash");
assert.equal(ticket.length, 0);

// rebuild for child-only remove
ticket = mergeManualConfiguredSelection([], bundle);
ticket = removeManualTicketLine(ticket, "manual-upsell-sprite");
assert.equal(ticket.length, 1);
assert.equal(ticket[0].clientLineId, "manual-cfg-smash");

// 10. remove child does not remove parent — covered above

// 13. invalid quantity rejected/normalized deterministically
assert.equal(normalizeManualTicketQuantity(0), 1);
assert.equal(normalizeManualTicketQuantity(-4), 1);
assert.equal(normalizeManualTicketQuantity(100), 99);
assert.equal(normalizeManualTicketQuantity(2.9), 2);
ticket = updateManualTicketLineQuantity(ticket, "manual-cfg-smash", 0);
assert.equal(ticket[0].quantity, 1);

// Direct upsell qty edit ignored
ticket = mergeManualConfiguredSelection([], bundle);
ticket = updateManualTicketLineQuantity(ticket, "manual-upsell-sprite", 9);
assert.equal(
  ticket.find((line) => line.clientLineId === "manual-upsell-sprite")?.quantity,
  2
);

// Payload adapter basics (also covered in domain verify)
const payload = toManualOrderCreateOrderItems(ticket);
assert.equal(payload.ok, true);
if (payload.ok) {
  assert.equal(payload.items[0].item_kind, "product");
  assert.equal(payload.items[1].item_kind, "upsell");
  assert.equal(
    (payload.items[1] as { parent_client_line_id?: string }).parent_client_line_id,
    "manual-cfg-smash"
  );
}

// orphan upsell rejected
const orphan = createManualUpsellTicketLine({
  productId: "sprite",
  productName: "Sprite 500ml",
  unitPrice: 3000,
  parentClientLineId: "missing-parent",
  quantity: 1,
  clientLineId: "orphan-upsell"
});
const orphanPayload = toManualOrderCreateOrderItems([orphan]);
assert.equal(orphanPayload.ok, false);

const missingSnapshot = {
  ...configured,
  customizationSnapshot: null
};
const missingSnapPayload = toManualOrderCreateOrderItems([missingSnapshot]);
assert.equal(missingSnapPayload.ok, false);

// 15. no React/browser/Supabase imports in domain modules
for (const relative of [
  "lib/orders/manual-order-customization-ticket.ts",
  "lib/orders/manual-order-customization-payload.ts"
]) {
  const source = read(relative);
  assert.equal(source.includes('from "react"'), false, relative);
  assert.equal(source.includes("from 'react'"), false, relative);
  assert.equal(source.includes("localStorage"), false, relative);
  assert.equal(source.includes("window."), false, relative);
  assert.equal(source.includes("document."), false, relative);
  assert.equal(source.includes("@supabase"), false, relative);
  assert.equal(source.includes("createBrowserClient"), false, relative);
}

console.log("PASS: manual-order-customization-ticket.verify.ts");
