/**
 * Verify ADMIN-PRODUCTS-EDIT-ADVANCED-LOADING-STATE-FOOTER-RHYTHM-POLISH-1
 *
 * Advanced loading uses the same disclosure shell (disabled), not detached copy.
 * Edit footer clearance reduced from redundant 4.75rem spacer.
 *
 * Run: npx tsx lib/products/admin-products-edit-advanced-loading-state-footer-rhythm-polish.verify.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(rel: string) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

const panel = read(
  "components/admin/product-customization/product-customization-overrides-panel.tsx"
);
const css = read(
  "components/admin/product-customization/product-customization-admin.module.css"
);
const formCss = read("components/admin/products/product-form.module.css");
const editForm = read("components/admin/products/edit-product-form.tsx");
const createForm = read("components/admin/products/create-product-form.tsx");
const flyout = read("components/admin/products/flyout-panel.tsx");

const loadingGateIdx = panel.indexOf("if (!inheritance && !loadError)");
assert.ok(loadingGateIdx >= 0, "loading shell must gate on !inheritance && !loadError (first paint)");
assert.ok(
  !/if \(isLoading && !inheritance && !loadError\)/.test(panel),
  "loading must not depend solely on useTransition isLoading"
);
const loadingBranch = panel.slice(
  loadingGateIdx,
  panel.indexOf("if (loadError && !inheritance)")
);

// 1 — Loading renders Advanced shell, not detached visible loading paragraph
assert.ok(/Avanzado…/.test(loadingBranch) || /Avanzado\u2026/.test(loadingBranch));
assert.ok(/styles\.advancedDisclosure/.test(loadingBranch));
assert.ok(/advancedDisclosureLoading/.test(loadingBranch));
assert.ok(
  !/className=\{styles\.emptyOptions\}[\s\S]{0,80}Cargando ajustes/.test(loadingBranch),
  "detached visible Cargando ajustes must not occupy loading shell"
);
assert.ok(
  /visuallyHidden[\s\S]*Cargando ajustes avanzados|Cargando ajustes avanzados[\s\S]*visuallyHidden/.test(
    loadingBranch.replace(/\s+/g, " ")
  ) || /role="status"[\s\S]*Cargando ajustes avanzados/.test(loadingBranch),
  "accessible loading status may remain visually hidden"
);

// 2 — Loading Advanced is disabled / busy
assert.ok(/\bdisabled\b/.test(loadingBranch));
assert.ok(/aria-busy="true"/.test(loadingBranch));
assert.ok(/type="button"/.test(loadingBranch));
assert.ok(/aria-expanded="false"/.test(loadingBranch));
assert.ok(!/onClick=\{toggleAdvanced\}/.test(loadingBranch));

// 3 — Ready disclosure still expandable; loading cannot toggle via onClick
assert.ok(/onClick=\{toggleAdvanced\}/.test(panel));
assert.ok(/aria-expanded=\{advancedOpen\}/.test(panel));

// 4 — No fabricated summary/groups while loading
assert.ok(!/advancedSummary/.test(loadingBranch));
assert.ok(!/advancedGroups/.test(loadingBranch));
assert.ok(!/formatSectionCount/.test(loadingBranch));

// 5 — Hard-QA hierarchy classes remain in ready path
assert.ok(/styles\.optionList/.test(panel));
assert.ok(/parentGroupHidden/.test(panel));
assert.ok(/editHierarchy/.test(panel));

// 6 — Sticky footer remains after Advanced in Edit structure
assert.ok(/ProductCustomizationOverridesPanel/.test(editForm));
assert.ok(/actionsSticky/.test(editForm));
const panelIdx = editForm.indexOf("ProductCustomizationOverridesPanel");
const stickyIdx = editForm.indexOf("actionsSticky");
assert.ok(panelIdx > 0 && stickyIdx > panelIdx);

// 7 — Footer clearance: redundant 4.75rem Edit spacer removed/reduced
assert.ok(
  !/\.editForm:has\(\.actionsSticky\)\s*>\s*:nth-last-child\(2\)\s*\{[^}]*padding-bottom:\s*4\.75rem/.test(
    formCss.replace(/\s+/g, " ")
  ),
  "Edit must not keep obsolete 4.75rem Advanced bottom spacer"
);
assert.ok(
  /\.editForm:has\(\.actionsSticky\)\s*>\s*:nth-last-child\(2\)\s*\{[^}]*padding-bottom:\s*1\.5rem/.test(
    formCss.replace(/\s+/g, " ")
  ),
  "Edit keeps modest 1.5rem clearance for sticky reachability"
);
assert.ok(
  /\.createForm:has\(\.actionsSticky\)\s*>\s*:nth-last-child\(2\)\s*\{[^}]*padding-bottom:\s*0/.test(
    formCss.replace(/\s+/g, " ")
  ),
  "Create zero-spacer contract unchanged"
);

// 8 — No new fetch / action
assert.ok(!/select\(|\.from\(|createClient|fetch\(/.test(panel));
assert.ok(!/saveProductEditDraftAction/.test(panel));

// 9 — Create does not mount Advanced panel
assert.ok(!/ProductCustomizationOverridesPanel/.test(createForm));

// 10 — Release-lip remains inert in flyout.tsx
assert.ok(!/headerReleaseClip/.test(flyout));
assert.ok(!/bodyReleaseClip/.test(flyout));

// 11 — Loading CSS owner exists
assert.ok(/\.advancedDisclosureLoading/.test(css));
assert.ok(/\.visuallyHidden/.test(css));

console.log(
  "admin-products-edit-advanced-loading-state-footer-rhythm-polish.verify.ts: PASS"
);
