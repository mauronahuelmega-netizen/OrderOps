/**
 * Source contracts for ADMIN-MANUAL-ORDER-MODAL-MOBILE-SINGLE-SCROLL-FIX-1.
 *
 * Run: npx tsx lib/orders/admin-manual-order-modal-mobile-single-scroll.verify.ts
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
      `${relativePath} must not contain single-scroll leakage (${token})`
    );
  }
}

const css = read("components/admin/orders/manual-order-modal.module.css");
const modal = read("components/admin/orders/manual-order-modal.tsx");
const actions = read("app/admin/(protected)/orders/actions.ts");
const eligibility = read("lib/orders/manual-order-customization-eligibility.ts");
const safety = read("lib/orders/manual-order-customization-safety.ts");

assert.equal(css.includes("@media (max-width: 899px)"), true);

const mobileMatch = css.match(
  /@media\s*\(\s*max-width:\s*899px\s*\)\s*\{([\s\S]*?)(?=@media|$)/
);
assert.ok(mobileMatch, "Mobile/tablet ≤899 media block required");
const mobileBlock = mobileMatch[1];

assert.equal(
  /\.manual-order-modal__body\s*\{[\s\S]*?overflow-y:\s*auto/.test(mobileBlock),
  true,
  "Body must be the primary ≤899 scroll owner"
);
assert.equal(
  /\.manual-order-modal__workstation\s*\{[\s\S]*?overflow:\s*visible/.test(
    mobileBlock
  ),
  true,
  "Workstation must not nest-scroll on ≤899"
);

const productsInMobile = mobileBlock.includes(".manual-order-modal__products-scroll");
const summaryInMobile = mobileBlock.includes(".manual-order-modal__summary-scroll");
assert.equal(productsInMobile && summaryInMobile, true);

assert.equal(
  /overflow:\s*visible/.test(mobileBlock) &&
    mobileBlock.includes("max-height: none"),
  true,
  "Nested panes must drop max-height and nested overflow on ≤899"
);

assert.equal(
  !/max-height:\s*180px/.test(css),
  true,
  "Tablet 180px nested max-heights must be removed"
);

const desktopMatch = css.match(
  /@media\s*\(\s*min-width:\s*900px\s*\)\s*\{([\s\S]*?)(?=@media|$)/
);
assert.ok(desktopMatch, "Desktop ≥900 media block required");
const desktopBlock = desktopMatch[1];
assert.equal(
  desktopBlock.includes("grid-template-columns"),
  true,
  "Desktop dual-pane columns must remain"
);
assert.equal(
  /\.manual-order-modal__products-scroll[\s\S]*?overflow-y:\s*auto/.test(css) ||
    /\.manual-order-modal__products-scroll,\s*\n\.manual-order-modal__summary-scroll\s*\{[\s\S]*?overflow-y:\s*auto/.test(
      css
    ),
  true,
  "Base nested overflow for desktop panes must remain outside ≤899 override"
);

assert.equal(css.includes("manual-order-modal__footer"), true);
assert.equal(modal.includes("Crear pedido"), true);
assert.equal(modal.includes("Cancelar") || modal.includes("cancel"), true);

assert.equal(modal.includes("Requiere personalización"), true);
assert.equal(
  modal.includes("Usá el catálogo hasta habilitar el selector manual.") ||
    modal.includes("Tocá + para configurar opciones antes de agregar."),
  true
);
assert.equal(modal.includes("isManualOrderAvailable"), true);
assert.equal(
  modal.includes("openConfigure") ||
    modal.includes("needsConfiguration") ||
    modal.includes("Configurar"),
  true
);

assert.equal(
  actions.includes("resolveManualOrderProductEligibilityMap"),
  true,
  "Server safety gate must remain"
);
assert.equal(
  eligibility.includes("productNeedsCustomizationModal"),
  true
);
assert.equal(safety.includes("resolveManualOrderProductEligibilityMap"), true);

assertUntouched("app/admin/(protected)/orders/actions.ts", [
  "manual-order-modal__body",
  "SINGLE-SCROLL",
  "max-height: none"
]);
assertUntouched("lib/orders/manual-order-customization-eligibility.ts", [
  "overflow-y"
]);
assertUntouched("lib/orders/manual-order-customization-safety.ts", [
  "overflow-y"
]);
assertUntouched("lib/products/admin.ts", ["overflow-y: auto"]);
assertUntouched("components/admin/admin-mobile-drawer.tsx", [
  "manual-order-modal__body"
]);
assertUntouched("components/admin/orders/DashboardToolbar.tsx", [
  "manual-order-modal__body"
]);
assertUntouched("components/admin/layout/admin-footer.tsx", [
  "manual-order-modal__body"
]);
assertUntouched("app/b/[slug]/checkout/actions.ts", [
  "manual-order-modal__body"
]);
assertUntouched("components/public/catalog/catalog-client.tsx", [
  "manual-order-modal__body"
]);
assertUntouched("app/globals.css", ["manual-order-modal__body"]);
assertUntouched("app/theme-tokens.css", ["manual-order-modal__body"]);

assert.equal(modal.includes("customization_snapshot"), false);
assert.equal(modal.includes("CustomizationPicker"), false);

console.log("PASS: admin-manual-order-modal-mobile-single-scroll.verify.ts");
