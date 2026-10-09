/**
 * Verify ADMIN-PRODUCTS-EDIT-STICKY-FOOTER-RELEASE-STATE-POLISH-1
 * (reconciled after ADMIN-PRODUCTS-EDIT-UNIFIED-DRAFT-SAVE-IMPLEMENTATION-1)
 *
 * SUPERSEDED: Advanced customization lives inside the Edit form BEFORE the sticky
 * Save footer. Flyout release-lip classes may remain in CSS but must not be applied
 * on the Edit path in flyout-panel.tsx.
 *
 * Run: npx tsx lib/products/admin-products-edit-sticky-footer-release-state-polish.verify.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(rel: string) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

const flyout = read("components/admin/products/flyout-panel.tsx");
const flyoutCss = read("components/admin/products/flyout-panel.module.css");
const formCss = read("components/admin/products/product-form.module.css");
const editForm = read("components/admin/products/edit-product-form.tsx");
const createForm = read("components/admin/products/create-product-form.tsx");

// A — Edit sticky footer remains the mobile sticky owner
assert.ok(/styles\.actionsSticky/.test(editForm) && /styles\.editActions/.test(editForm));
assert.ok(/\.actionsSticky[\s\S]*position:\s*sticky/.test(formCss));
assert.ok(/\.actionsSticky[\s\S]*bottom:\s*0/.test(formCss));
assert.ok(
  /\.editForm[\s\S]*\.editActions\.actionsSticky[\s\S]*margin-inline:\s*calc\(-1\s*\*\s*var\(--edit-shell-inline\)\)/.test(
    formCss
  ),
  "Edit mobile footer must remain full-bleed"
);
{
  const editCta =
    formCss.match(
      /\.editForm\s+\.editActions\.actionsSticky\s+:global\(\.admin-primary-button\)\s*\{[^}]*\}/
    )?.[0] ?? "";
  assert.ok(/width:\s*100%/.test(editCta), "Edit mobile CTA full-width");
  assert.ok(/min-height:\s*3rem/.test(editCta), "Edit mobile CTA >=48px");
}

// B — Advanced (overrides panel) is INSIDE form before sticky Save
assert.ok(/ProductCustomizationOverridesPanel/.test(editForm));
{
  const panelIdx = editForm.indexOf("ProductCustomizationOverridesPanel");
  const stickyIdx = editForm.indexOf("actionsSticky");
  assert.ok(panelIdx > 0 && stickyIdx > panelIdx, "Advanced must precede sticky Save");
}
assert.ok(
  !/editAfterForm/.test(editForm),
  "editAfterForm must not place Advanced after the sticky footer"
);

// C — historical release-lip CSS may remain; Edit flyout must NOT apply the classes
assert.ok(
  /\.headerReleaseClip::after\s*\{[^}]*height:\s*32px/.test(flyoutCss),
  "historical Edit header release lip CSS definition may remain"
);
assert.ok(/\.headerReleaseClip::after\s*\{[^}]*background:\s*var\(--bg-surface\)/.test(flyoutCss));
assert.ok(/\.bodyReleaseClip\s*\{[^}]*padding-top:\s*32px/.test(flyoutCss));
assert.ok(
  !/headerReleaseClip/.test(flyout),
  "flyout.tsx must not apply headerReleaseClip on Edit"
);
assert.ok(
  !/bodyReleaseClip/.test(flyout),
  "flyout.tsx must not apply bodyReleaseClip on Edit"
);

// D — Create must not receive Edit release clip (and sticky Create contract untouched)
assert.ok(
  !/create-product[\s\S]{0,200}headerReleaseClip/.test(flyout.replace(/\s+/g, " ")),
  "Create path must not hard-wire headerReleaseClip"
);

// E — no JS scroll / IntersectionObserver release hack
assert.ok(!/IntersectionObserver/.test(flyout));
assert.ok(!/IntersectionObserver/.test(editForm));
assert.ok(!/visualViewport|innerHeight|scrollY|onscroll/.test(editForm));
assert.ok(!/animation-timeline:\s*view\(/.test(formCss), "must not rely on sticky view() fade");

// F — Create sticky footer contract selectors preserved
assert.ok(/\.createForm\s+\.createActions\.actionsSticky/.test(formCss));
assert.ok(/createActions/.test(createForm));

// G — single scroll + dvh preserved
assert.ok(/\.body[\s\S]*overflow-y:\s*auto/.test(flyoutCss));
assert.ok(/height:\s*100dvh/.test(flyoutCss));

console.log("admin-products-edit-sticky-footer-release-state-polish.verify.ts: PASS");
