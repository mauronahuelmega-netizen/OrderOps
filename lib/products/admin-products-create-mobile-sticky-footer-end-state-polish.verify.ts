/**
 * Verify ADMIN-PRODUCTS-CREATE-MOBILE-STICKY-FOOTER-END-STATE-POLISH-1
 *
 * Run: npx tsx lib/products/admin-products-create-mobile-sticky-footer-end-state-polish.verify.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(rel: string) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

const formCss = read("components/admin/products/product-form.module.css");
const flyoutCss = read("components/admin/products/flyout-panel.module.css");
const createForm = read("components/admin/products/create-product-form.tsx");
const flyoutTsx = read("components/admin/products/flyout-panel.tsx");

// A — Create shell must not own trailing post-footer padding (END-only band)
assert.ok(
  /\.createForm\.shell:has\(\.actionsSticky\)\s*\{[^}]*padding-bottom:\s*0/.test(formCss) ||
    /\.createForm\.shell\s*\{[^}]*padding:\s*[^;]*\s0\s*;/.test(formCss),
  "Create shell with sticky actions must have padding-bottom: 0"
);
assert.ok(
  !/\.createForm\.shell\s*\{[^}]*padding:\s*0\.75rem\s+var\(--create-shell-inline\)\s+0\.875rem/.test(
    formCss
  ),
  "must not restore Create mobile shell trailing 0.875rem bottom padding"
);

// B — safe-area remains on sticky footer (canonical inset owner)
assert.ok(/safe-area-inset-bottom/.test(formCss));
assert.ok(
  /\.createForm\s+\.createActions\.actionsSticky[\s\S]*safe-area-inset-bottom/.test(formCss) ||
    /\.actionsSticky[\s\S]*safe-area-inset-bottom/.test(formCss)
);

// C — sticky architecture + dvh + single scroll
assert.ok(/\.actionsSticky[\s\S]*position:\s*sticky/.test(formCss));
assert.ok(/\.actionsSticky[\s\S]*bottom:\s*0/.test(formCss));
assert.ok(/height:\s*100dvh/.test(flyoutCss));
assert.ok(/\.body[\s\S]*overflow-y:\s*auto/.test(flyoutCss));

// D — no JS viewport hacks; previous feedback spacer not restored
assert.ok(!/visualViewport|innerHeight|orientationchange/.test(flyoutTsx));
assert.ok(!/visualViewport|innerHeight/.test(createForm));
assert.ok(
  !/\.createForm:has\(\.actionsSticky\)\s*>\s*:nth-last-child\(2\)\s*\{[^}]*padding-bottom:\s*5\.25rem/.test(
    formCss
  )
);
assert.ok(/\.createForm\s+\.feedback:empty/.test(formCss));

// E — Edit formRoot clearance preserved
assert.ok(
  /\.formRoot:has\(\.actionsSticky\)\s*>\s*:nth-last-child\(2\)\s*\{[^}]*padding-bottom:\s*4\.75rem/.test(
    formCss
  )
);

console.log("admin-products-create-mobile-sticky-footer-end-state-polish.verify.ts: PASS");
