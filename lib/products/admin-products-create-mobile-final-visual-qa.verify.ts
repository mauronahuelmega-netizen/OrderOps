/**
 * Verify ADMIN-PRODUCTS-CREATE-MOBILE-FINAL-VISUAL-QA-1
 *
 * Run: npx tsx lib/products/admin-products-create-mobile-final-visual-qa.verify.ts
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

// A — Create stock defaults remain ON / Stock inicial / zero-info gate
assert.ok(/const \[trackStock,\s*setTrackStock\]\s*=\s*useState\(true\)/.test(createForm));
assert.ok(/setTrackStock\(true\)/.test(createForm));
assert.ok(
  createForm.includes('label="Stock inicial"') ||
    createForm.includes('requiredFieldLabel("Stock inicial")'),
  "Create label Stock inicial"
);
assert.ok(/trackStock\s*&&\s*stockValue\s*<=\s*0/.test(createForm));
assert.ok(!/name=["']is_available["']/.test(createForm));
assert.ok(
  editForm.includes('label="Stock actual"') ||
    editForm.includes('requiredFieldLabel("Stock actual")')
);

// B — Create footer full-bleed + CTA inset/full-width
assert.ok(
  /createActions\.actionsSticky[\s\S]*margin-inline:\s*calc\(-1\s*\*\s*var\(--create-shell-inline\)\)/.test(
    formCss
  )
);
assert.ok(
  /\.createForm\s+\.createActions\.actionsSticky\s+:global\(\.admin-primary-button\)\s*\{[^}]*width:\s*100%/.test(
    formCss
  )
);
assert.ok(!editForm.includes("createActions"));

// C — viewport / safe-area / sticky
assert.ok(/height:\s*100dvh/.test(flyoutCss));
assert.ok(/safe-area-inset-bottom/.test(formCss));
assert.ok(/\.actionsSticky[\s\S]*position:\s*sticky/.test(formCss));

// D — pointer ring remains focus-visible based
assert.ok(/:has\(input:focus-visible\)/.test(formCss));
assert.ok(!/\.toggleStackHeader\s+:global\(label\):focus-within/.test(formCss));

// E — bottom-gap microfix intent: Create must not reintroduce large empty feedback spacer
assert.ok(
  /\.createForm:has\(\.actionsSticky\)\s*>\s*:nth-last-child\(2\)\s*\{[^}]*padding-bottom:\s*0/.test(
    formCss
  ),
  "Create must not reserve large padding-bottom on empty feedback sibling"
);
assert.ok(
  !/\.createForm:has\(\.actionsSticky\)\s*>\s*:nth-last-child\(2\)\s*\{[^}]*padding-bottom:\s*5\.25rem/.test(
    formCss
  ),
  "Create must not reintroduce 5.25rem artificial bottom spacer"
);
assert.ok(
  /\.createForm\s+\.feedback:empty\s*\{[^}]*display:\s*none/.test(formCss),
  "empty Create feedback must collapse"
);

// F — Edit clearance preserved (not Create-collapsed)
assert.ok(
  /\.formRoot:has\(\.actionsSticky\)\s*>\s*:nth-last-child\(2\)\s*\{[^}]*padding-bottom:\s*4\.75rem/.test(
    formCss
  ),
  "Edit formRoot footer clearance preserved"
);

// G — no 100vw / blur hacks
assert.ok(!/width:\s*100vw/.test(formCss));
assert.ok(!/\.blur\(\)/.test(createForm));

console.log("admin-products-create-mobile-final-visual-qa.verify.ts: PASS");
