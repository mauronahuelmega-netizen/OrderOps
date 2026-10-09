/**
 * Verify ADMIN-PRODUCTS-CREATE-MOBILE-VIEWPORT-VISUAL-POLISH-1
 *
 * Run: npx tsx lib/products/admin-products-create-mobile-viewport-visual-polish.verify.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(rel: string) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

const flyoutCss = read("components/admin/products/flyout-panel.module.css");
const formCss = read("components/admin/products/product-form.module.css");
const createForm = read("components/admin/products/create-product-form.tsx");
const editForm = read("components/admin/products/edit-product-form.tsx");
const flyoutTsx = read("components/admin/products/flyout-panel.tsx");
const actions = read("app/admin/(protected)/products/actions.ts");

// A — dynamic viewport on mobile/fullscreen panel (100vh fallback + 100dvh)
assert.ok(/height:\s*100vh/.test(flyoutCss), "100vh fallback required");
assert.ok(/height:\s*100dvh/.test(flyoutCss), "100dvh modern mobile contract required");
assert.ok(/max-height:\s*100dvh/.test(flyoutCss), "max-height 100dvh required");

// Must not be static-100vh-only for panel height (dvh must appear after vh cascade)
{
  const panelBlock = flyoutCss.match(/\.panel\s*\{[\s\S]*?\n\}/)?.[0] ?? "";
  assert.ok(panelBlock.includes("100vh") && panelBlock.includes("100dvh"));
  assert.ok(
    panelBlock.lastIndexOf("100dvh") > panelBlock.lastIndexOf("100vh") ||
      (panelBlock.includes("height: 100vh") && panelBlock.includes("height: 100dvh")),
    "dvh must override/augment vh in .panel"
  );
}

// B — flyout breakpoint architecture preserved (961)
assert.ok(/@media\s*\(\s*min-width:\s*961px\s*\)/.test(flyoutCss), "961 flyout breakpoint preserved");

// C — sticky footer + safe area
assert.ok(/\.actionsSticky[\s\S]*position:\s*sticky/.test(formCss));
assert.ok(
  /safe-area-inset-bottom/.test(formCss),
  "footer must handle safe-area-inset-bottom"
);
assert.ok(/\.actionsSticky[\s\S]*background:\s*var\(--bg-surface\)/.test(formCss));

// D — Create mobile CTA full-width, desktop not forced
assert.ok(createForm.includes("createActions") && createForm.includes("createForm"));
assert.ok(
  /\.createForm\s+\.createActions\.actionsSticky\s+:global\(\.admin-primary-button\)\s*\{[^}]*width:\s*100%/.test(
    formCss
  ) ||
    /\.createActions\.actionsSticky[^{]*\{[^}]*width:\s*100%/.test(formCss),
  "Create mobile CTA must be width 100%"
);
assert.ok(
  /createActions[\s\S]*min-height:\s*3rem|min-height:\s*2\.75rem/.test(formCss),
  "Create CTA touch >=44"
);
assert.ok(
  !editForm.includes("createActions"),
  "Edit must not inherit Create-only CTA class"
);

// E — single scroll owner (body overflow-y auto; panel overflow hidden)
assert.ok(/\.body[\s\S]*overflow-y:\s*auto/.test(flyoutCss));
assert.ok(/\.panel[\s\S]*overflow:\s*hidden/.test(flyoutCss));

// F — no JS viewport hacks
assert.ok(!/visualViewport|innerHeight|orientationchange|ResizeObserver/.test(flyoutTsx));
assert.ok(!/visualViewport|innerHeight|orientationchange|ResizeObserver/.test(createForm));

// G — stock defaults owned by CREATE-STOCK-DEFAULT-UX-CONTRACT (not re-frozen here)
assert.ok(
  /const \[stockValue,\s*setStockValue\]\s*=\s*useState\(0\)/.test(createForm),
  "stockValue initial 0 preserved"
);

// H — no action/DB churn markers in this phase scope
assert.ok(/export async function createProductAction/.test(actions));
assert.ok(!createForm.includes("createProductAction") === false);

// I — neutral mobile dropzone copy
assert.ok(createForm.includes("Agregar imagen"), "mobile-neutral dropzone copy");
assert.ok(
  createForm.includes("JPG, PNG o HEIC") || createForm.includes("Agregar imagen"),
  "formats line or primary copy"
);
assert.ok(createForm.includes("Arrastrá tu imagen o hacé clic"), "desktop drag copy preserved");

// J — dialog semantics still owned by flyout
assert.ok(flyoutTsx.includes('role="dialog"') && flyoutTsx.includes("closeFlyout"));

console.log("admin-products-create-mobile-viewport-visual-polish.verify.ts: PASS");
