/**
 * Source contracts for ADMIN-MANUAL-ORDER-CUSTOMIZATION-SAFETY-GATE-1.
 *
 * Run: npx tsx lib/orders/admin-manual-order-customization-safety-gate.verify.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

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
      `${relativePath} must not contain safety-gate leakage (${token})`
    );
  }
}

const types = read("lib/orders/manual-order-types.ts");
const loader = read("lib/products/admin.ts");
const safety = read("lib/orders/manual-order-customization-safety.ts");
const eligibility = read("lib/orders/manual-order-customization-eligibility.ts");
const modal = read("components/admin/orders/manual-order-modal.tsx");
const modalCss = read("components/admin/orders/manual-order-modal.module.css");
const actions = read("app/admin/(protected)/orders/actions.ts");

assert.equal(types.includes("isManualOrderAvailable"), true);
assert.equal(types.includes("manualOrderUnavailableReason"), true);

assert.equal(eligibility.includes("productNeedsCustomizationModal"), true);
assert.equal(eligibility.includes("resolveManualOrderEligibilityFromSummary"), true);

assert.equal(safety.includes("resolveManualOrderProductEligibilityMap"), true);
assert.equal(safety.includes("loadPublicCustomizationSummariesForProducts"), true);
assert.equal(safety.includes("isProductCustomizationEnabled"), true);

assert.equal(loader.includes("resolveManualOrderProductEligibilityMap"), true);
assert.equal(loader.includes("isManualOrderAvailable"), true);

assert.equal(modal.includes("isManualOrderAvailable"), true);
assert.equal(modal.includes("product-row--blocked") || modal.includes("needsConfiguration"), true);
assert.equal(modal.includes("Requiere personalización") || modal.includes("unavailableReason"), true);
assert.equal(
  modal.includes("!product.isManualOrderAvailable"),
  true,
  "addProduct must not quick-add customizable products as bare lines"
);
assert.equal(
  modal.includes("openConfigure") || modal.includes("Configurar"),
  true,
  "Customizable products must open configure subview"
);
assert.equal(
  modal.includes("manualTicketLinesToCreateInput") ||
    modal.includes("ticketLines: createInput.ticketLines"),
  true,
  "Configured tickets must submit enriched ticketLines"
);
assert.equal(
  modal.includes("La creación del pedido se habilita en la próxima etapa") ||
    modal.includes("CUSTOMIZED_SUBMIT_GUARD_COPY"),
  false,
  "Temporary customized submit guard must be removed after server-payload phase"
);

assert.equal(modalCss.includes("product-row--blocked"), true);
assert.equal(modalCss.includes("product-blocked-badge"), true);

assert.equal(actions.includes("resolveManualOrderProductEligibilityMap"), true);
assert.equal(
  actions.includes("rejectBareCustomizableProducts") ||
    actions.includes("blockedProductIds"),
  true
);
assert.equal(actions.includes("validateCheckoutCartForCreateOrder"), true);
assert.equal(actions.includes("toCreateOrderRpcJson"), true);
assert.equal(
  actions.indexOf("resolveManualOrderProductEligibilityMap") <
    actions.indexOf('supabase.rpc("create_order"'),
  true,
  "Server gate must run before create_order RPC"
);
assert.equal(
  actions.indexOf("validateCheckoutCartForCreateOrder") <
    actions.indexOf('supabase.rpc("create_order"'),
  true,
  "Checkout validation must run before create_order RPC"
);
assert.equal(
  !actions.includes("input.isManualOrderAvailable") &&
    !actions.includes("item.isManualOrderAvailable"),
  true,
  "Must not trust client-supplied eligibility flags"
);

assert.equal(modal.includes("customization_snapshot"), false);
assert.equal(modal.includes("single-scroll") || modal.includes("flex-direction: column"), false);

const leak = [
  "isManualOrderAvailable",
  "resolveManualOrderProductEligibilityMap",
  "Requiere personalización"
];
assertUntouched("components/admin/admin-mobile-drawer.tsx", leak);
assertUntouched("components/admin/orders/DashboardToolbar.tsx", leak);
assertUntouched("components/admin/layout/admin-footer.tsx", leak);
assertUntouched("components/public/catalog/catalog-client.tsx", [
  "isManualOrderAvailable",
  "resolveManualOrderProductEligibilityMap"
]);
assertUntouched("app/b/[slug]/checkout/actions.ts", [
  "isManualOrderAvailable",
  "resolveManualOrderProductEligibilityMap"
]);
assertUntouched("lib/whatsapp/admin.ts", leak);
assertUntouched("lib/orders/customer-order-summary.ts", leak);
assertUntouched("lib/product-customization/order-preparation.ts", [
  "isManualOrderAvailable"
]);
assertUntouched("app/globals.css", ["isManualOrderAvailable"]);
assertUntouched("app/theme-tokens.css", ["isManualOrderAvailable"]);

const migrations = fs.readdirSync(path.join(root, "supabase/migrations"));
assert.equal(
  migrations.some((name) => name.includes("manual-order-customization-safety")),
  false,
  "No safety-gate migration allowed"
);

console.log("PASS: admin-manual-order-customization-safety-gate.verify.ts");
