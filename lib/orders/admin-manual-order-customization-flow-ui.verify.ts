/**
 * Source contracts for ADMIN-MANUAL-ORDER-CUSTOMIZATION-FLOW-UI-1.
 *
 * Run: npx tsx lib/orders/admin-manual-order-customization-flow-ui.verify.ts
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
      `${relativePath} must not contain UI-phase leakage (${token})`
    );
  }
}

assert.equal(
  fs.existsSync(
    path.join(root, "components/admin/orders/manual-order-customization-panel.tsx")
  ),
  true
);
assert.equal(
  fs.existsSync(
    path.join(
      root,
      "components/admin/orders/manual-order-customization-panel.module.css"
    )
  ),
  true
);

const modal = read("components/admin/orders/manual-order-modal.tsx");
const modalCss = read("components/admin/orders/manual-order-modal.module.css");
const panel = read("components/admin/orders/manual-order-customization-panel.tsx");
const panelCss = read(
  "components/admin/orders/manual-order-customization-panel.module.css"
);
const actions = read("app/admin/(protected)/orders/actions.ts");
const types = read("lib/orders/manual-order-types.ts");
const loader = read("lib/products/admin.ts");

assert.equal(modal.includes('type: "compose"'), true);
assert.equal(modal.includes('type: "configure"'), true);
assert.equal(modal.includes("ManualOrderCustomizationPanel"), true);
assert.equal(modal.includes("createManualSimpleTicketLine"), true);
assert.equal(modal.includes("createManualConfiguredTicketBundle"), true);
assert.equal(modal.includes("mergeManualConfiguredSelection"), true);
assert.equal(modal.includes("updateManualTicketLineQuantity"), true);
assert.equal(modal.includes("removeManualTicketLine"), true);
assert.equal(modal.includes("getManualTicketEstimatedTotal"), true);
assert.equal(modal.includes("openConfigure"), true);
assert.equal(modal.includes("!product.isManualOrderAvailable"), true);
assert.equal(modal.includes("manualTicketLinesToCreateInput"), true);
assert.equal(modal.includes("ticketLines: createInput.ticketLines"), true);
assert.equal(modal.includes("canSubmit"), true);
assert.equal(modal.includes("canSubmitLegacy"), false);
assert.equal(
  modal.includes("La creación del pedido se habilita en la próxima etapa"),
  false
);
assert.equal(modal.includes("toManualOrderCreateOrderItems"), false);
assert.equal(modal.includes("components/public"), false);

assert.equal(panel.includes("components/public"), false);
assert.equal(panel.includes("CustomizationSelectionStateV2"), true);
assert.equal(panel.includes("UPSELL_ASSOCIATED_LABEL"), true);
assert.equal(panel.includes("isManualOrderCustomizationDraftValid"), true);
assert.equal(panelCss.includes("overflow-y: auto"), false);

assert.equal(types.includes("customizationConfig"), true);
assert.equal(types.includes("ManualOrderCreateTicketLineInput"), true);
assert.equal(loader.includes("getPublicProductCustomizationConfig"), true);
assert.equal(loader.includes("customizationConfig"), true);

assert.equal(actions.includes("validateCheckoutCartForCreateOrder"), true);
assert.equal(actions.includes("toCreateOrderRpcJson"), true);
assert.equal(actions.includes("manualCreateTicketLinesToCheckoutCart"), true);
assert.equal(actions.includes("toManualOrderCreateOrderItems"), false);
assert.equal(actions.includes("manual-order-customization-panel"), false);
assert.equal(actions.includes("resolveManualOrderProductEligibilityMap"), true);

assert.equal(modalCss.includes("@media (max-width: 899px)"), true);
assert.equal(
  /overflow:\s*visible/.test(modalCss) && modalCss.includes("max-height: none"),
  true
);

assertUntouched("app/admin/(protected)/orders/actions.ts", [
  "toManualOrderCreateOrderItems",
  "ManualOrderCustomizationPanel",
  "createManualConfiguredTicketBundle"
]);
assertUntouched("components/public/catalog/catalog-client.tsx", [
  "ManualOrderCustomizationPanel"
]);
assertUntouched("app/b/[slug]/checkout/actions.ts", [
  "ManualOrderCustomizationPanel"
]);
assertUntouched("components/admin/admin-mobile-drawer.tsx", [
  "ManualOrderCustomizationPanel"
]);
assertUntouched("components/admin/orders/DashboardToolbar.tsx", [
  "ManualOrderCustomizationPanel"
]);
assertUntouched("components/admin/layout/admin-footer.tsx", [
  "ManualOrderCustomizationPanel"
]);
assertUntouched("app/globals.css", ["manual-order-customization-panel"]);
assertUntouched("app/theme-tokens.css", ["manual-order-customization-panel"]);
assertUntouched("package.json", ["manual-order-customization-panel"]);

const migrations = fs.readdirSync(path.join(root, "supabase/migrations"));
assert.equal(
  migrations.some((name) => /manual.?order.?customization.?flow.?ui/i.test(name)),
  false
);

console.log("PASS: admin-manual-order-customization-flow-ui.verify.ts");
