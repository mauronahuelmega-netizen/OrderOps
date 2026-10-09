/**
 * Verify ADMIN-PRODUCTS-CREATE-STOCK-DEFAULT-UX-CONTRACT-1
 *
 * Run: npx tsx lib/products/admin-products-create-stock-default-ux-contract.verify.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(rel: string) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

const createForm = read("components/admin/products/create-product-form.tsx");
const editForm = read("components/admin/products/edit-product-form.tsx");
const formCss = read("components/admin/products/product-form.module.css");
const flyoutCss = read("components/admin/products/flyout-panel.module.css");
const actions = read("app/admin/(protected)/products/actions.ts");
const contract = read("lib/products/products-stock-availability-contract.ts");
const createActionMtimeProbe = actions;

// A — Create initial + success-reset trackStock = true; stock = 0
assert.ok(
  /const \[trackStock,\s*setTrackStock\]\s*=\s*useState\(true\)/.test(createForm),
  "Create trackStock initial must be true"
);
assert.ok(
  /setTrackStock\(true\)/.test(createForm),
  "Create success reset must set trackStock true"
);
assert.ok(
  /const \[stockValue,\s*setStockValue\]\s*=\s*useState\(0\)/.test(createForm),
  "Create stockValue initial must be 0"
);
assert.ok(/setStockValue\(0\)/.test(createForm), "Create success reset stock must be 0");

// Guard: no lingering false defaults on Create trackStock paths
{
  const trackInitMatches = createForm.match(
    /const \[trackStock,\s*setTrackStock\]\s*=\s*useState\((true|false)\)/g
  );
  assert.equal(trackInitMatches?.length, 1);
  assert.ok(trackInitMatches?.[0]?.includes("true"));

  const resetMatches = [...createForm.matchAll(/setTrackStock\((true|false)\)/g)].map((m) => m[1]);
  assert.ok(resetMatches.length >= 1, "at least one setTrackStock reset");
  assert.ok(
    resetMatches.every((v) => v === "true"),
    "all Create setTrackStock calls must be true (success reset default)"
  );
}

// B — Create label Stock inicial; Edit Stock actual
assert.ok(
  createForm.includes('label="Stock inicial"') ||
    createForm.includes('requiredFieldLabel("Stock inicial")'),
  "Create label Stock inicial"
);
assert.ok(!createForm.includes('label="Stock actual"'), "Create must not say Stock actual");
assert.ok(
  editForm.includes('label="Stock actual"') ||
    editForm.includes('requiredFieldLabel("Stock actual")'),
  "Edit retains Stock actual"
);
assert.ok(
  !editForm.includes('label="Stock inicial"') && !editForm.includes('requiredFieldLabel("Stock inicial")'),
  "Edit must not say Stock inicial"
);

// C — zero-stock info derives from trackStock && stockValue <= 0
assert.ok(
  /trackStock\s*&&\s*stockValue\s*<=\s*0/.test(createForm),
  "zero-stock info must gate on trackStock && stockValue <= 0"
);
assert.ok(
  createForm.includes("Con stock 0, el producto se creará como no disponible."),
  "zero-stock consequence copy"
);
assert.ok(createForm.includes("styles.toggleInfo"), "informational (not warning) class");
assert.ok(!/toggleWarning/.test(createForm), "Create must not use warning styling for zero stock");
assert.ok(
  !/role=["']alert["']/.test(createForm.match(/create-stock-zero-info[\s\S]{0,200}/)?.[0] ?? ""),
  "zero-stock info must not use role=alert"
);

// D — compact helper; no restock/Disponible instruction in Create helper
assert.ok(
  createForm.includes("Descontamos el stock con cada pedido"),
  "compact Create helper"
);
assert.ok(
  !createForm.includes("Al reponer stock, volvé a marcarlo como disponible"),
  "Create helper must not instruct unavailable Edit-only reactivation"
);

// E — no Disponible switch in Create; Activo/Inactivo status removed from Create stock switch
assert.ok(
  !/name=["']is_available["']/.test(createForm),
  "Create must not expose is_available switch"
);
assert.ok(
  !/Disponible/.test(createForm),
  "Create must not introduce Disponible control copy"
);
{
  const stockBlock = createForm.match(/createStockBlock[\s\S]*?create-stock-zero-info[\s\S]*?<\/div>/)?.[0] ??
    createForm.match(/createStockBlock[\s\S]*?<\/div>\s*<\/div>\s*<div className=\{styles\.feedback\}/)?.[0] ??
    "";
  assert.ok(stockBlock.length > 0 || createForm.includes("createStockBlock"));
  assert.ok(
    !createForm.includes("statusLabel"),
    "Create must not render Activo/Inactivo statusLabel"
  );
}

// F — focus-visible based ring (not focus-within)
assert.ok(
  /:has\(input:focus-visible\)/.test(formCss),
  "switch ring must use :has(input:focus-visible)"
);
assert.ok(
  !/\.toggleStackHeader\s+:global\(label\):focus-within/.test(formCss),
  "must not use label:focus-within for Create/form switch ring"
);
assert.ok(
  !/\.toggleContainer\s+:global\(label\):focus-within/.test(formCss),
  "must not use toggleContainer label:focus-within for ring"
);
assert.ok(!/\.blur\(\)/.test(createForm), "no blur-on-click modality hack");
assert.ok(
  /\.createToggleHost\s+:global\(input\)\s*\{[\s\S]*width:\s*100%/.test(formCss),
  "Create switch input must fill label for keyboard focusability"
);

// G — Create mobile footer full-bleed; button inset; no 100vw
assert.ok(
  /createActions\.actionsSticky[\s\S]*margin-inline:\s*calc\(-1\s*\*\s*var\(--create-shell-inline\)\)/.test(
    formCss
  ),
  "Create sticky footer full-bleed via negative inline margin"
);
assert.ok(
  /createActions\.actionsSticky[\s\S]*padding:[\s\S]*var\(--create-shell-inline\)/.test(formCss) ||
    /createActions\.actionsSticky[\s\S]*padding-inline:\s*var\(--create-shell-inline\)/.test(formCss),
  "Create footer retains internal inline padding for button inset"
);
assert.ok(
  /\.createForm\s+\.createActions\.actionsSticky\s+:global\(\.admin-primary-button\)\s*\{[^}]*width:\s*100%/.test(
    formCss
  ),
  "Create CTA full-width inside footer"
);
assert.ok(!/width:\s*100vw/.test(formCss), "no 100vw overflow hack in product form CSS");
assert.ok(!editForm.includes("createActions"), "Edit not forced into Create footer treatment");

// H — viewport/safe-area/dvh preserved
assert.ok(/height:\s*100dvh/.test(flyoutCss), "100dvh preserved");
assert.ok(/safe-area-inset-bottom/.test(formCss), "safe-area preserved");
assert.ok(/\.actionsSticky[\s\S]*position:\s*sticky/.test(formCss), "sticky footer preserved");

// I — server authority reused; Create requests available=true; helper gates tracked zero
assert.ok(
  /if\s*\(\s*input\.trackStock\s*&&\s*input\.stock\s*<=\s*0\s*\)/.test(contract),
  "contract: tracked stock <=0 → unavailable"
);
assert.ok(
  /resolveEffectiveProductAvailability\(\{\s*trackStock,\s*stock,\s*requestedAvailable:\s*true\s*\}\)/.test(
    createActionMtimeProbe.replace(/\s+/g, " ")
  ) ||
    /requestedAvailable:\s*true/.test(actions) &&
      actions.includes("resolveEffectiveProductAvailability"),
  "create action still uses resolveEffectiveProductAvailability"
);
assert.ok(
  !/track_stock:\s*true/.test(actions.match(/createProductAction[\s\S]*?updateProductAction/)?.[0] ?? actions.slice(0, 3500)),
  "action must not hard-code track_stock true independent of form"
);

// J — aria associations
assert.ok(createForm.includes('aria-describedby="create-track-stock-helper"'));
assert.ok(createForm.includes('id="create-track-stock-helper"'));
assert.ok(createForm.includes("create-stock-zero-info"));

console.log("admin-products-create-stock-default-ux-contract.verify.ts: PASS");
