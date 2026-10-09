/**
 * Verify ADMIN-PRODUCTS-EDIT-ADVANCED-PREMIUM-VISUAL-CLOSEOUT-1
 *
 * Continuous expanded group header surface, action contrast classes,
 * empty-valid structural shell, loading preserved, hierarchy preserved.
 *
 * Run: npx tsx lib/products/admin-products-edit-advanced-premium-visual-closeout.verify.ts
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
const createForm = read("components/admin/products/create-product-form.tsx");

const draftGroupStart = panel.indexOf("function DraftInheritanceGroupAccordion");
const draftGroupEnd = panel.indexOf("function DraftInheritanceOptionRow");
assert.ok(draftGroupStart > 0 && draftGroupEnd > draftGroupStart);
const draftGroup = panel.slice(draftGroupStart, draftGroupEnd);

// 1 — Expanded background owner is whole group header, not disclosure-only
assert.ok(
  /styles\.groupHeader/.test(draftGroup),
  "draft group must mark groupHeader as surface owner"
);
assert.ok(
  /\.editHierarchy\s+\.advancedGroup\[data-expanded="true"\]\s+\.groupHeader\s*\{[^}]*background:\s*color-mix/.test(
    css.replace(/\s+/g, " ")
  ),
  "expanded background must live on groupHeader"
);
assert.ok(
  /\.editHierarchy\s+\.advancedGroup\[data-expanded="true"\]\s+\.groupDisclosure\s*\{[^}]*background:\s*transparent/.test(
    css.replace(/\s+/g, " ")
  ),
  "expanded disclosure background must be transparent (header owns surface)"
);
assert.ok(
  !/\.editHierarchy\s+\.advancedGroup\[data-expanded="true"\]\s+\.groupDisclosure\s*\{[^}]*background:\s*color-mix/.test(
    css.replace(/\s+/g, " ")
  ),
  "expanded disclosure must not own the tinted header surface alone"
);

// 2 — Visibility action stays transparent over header
assert.ok(
  /\.editHierarchy\s+\.visibilityAction[\s\S]*\{[\s\S]*background:\s*transparent/.test(css)
);
assert.ok(!/visibilityActionWhiteCell|eyeCell|visibilityCell/.test(css));

// 3 — Active Eye differs from disabled
assert.ok(
  /\.editHierarchy\s+\.visibilityAction\s*\{[\s\S]*color:\s*var\(--text-secondary\)/.test(css),
  "enabled Eye uses secondary (actionable)"
);
assert.ok(
  /\.editHierarchy\s+\.visibilityAction:disabled[\s\S]*\{[\s\S]*color:\s*color-mix/.test(css) ||
    /\.editHierarchy\s+\.visibilityActionLocked:disabled[\s\S]*color:\s*color-mix/.test(css),
  "disabled Eye uses distinct muted color"
);
assert.ok(
  !/\.editHierarchy\s+\.visibilityAction:disabled[\s\S]*\{[\s\S]*opacity:\s*0\.48/.test(css),
  "disabled Eye must not use near-invisible opacity"
);

// 4 — Actual disabled semantics retained
assert.ok(
  /disabled=\{controlsLocked\}/.test(panel),
  "option Eye must use actual disabled={controlsLocked}"
);

// 5 — Empty-valid Advanced shell exists and is not loading
const emptyIdx = panel.indexOf('data-empty="true"');
assert.ok(emptyIdx > 0, "empty-valid shell required");
const emptyBranch = panel.slice(
  panel.indexOf("inheritance && inheritance.groups.length === 0"),
  panel.indexOf("const collapsedHiddenLabel")
);
assert.ok(/Sin ajustes/.test(emptyBranch));
assert.ok(/Avanzado/.test(emptyBranch));
assert.ok(!/Avanzado…/.test(emptyBranch) && !/Avanzado\u2026/.test(emptyBranch));
assert.ok(!/aria-busy/.test(emptyBranch));
assert.ok(/\bdisabled\b/.test(emptyBranch));
assert.ok(/aria-expanded="false"/.test(emptyBranch));
assert.ok(!/formatSectionCount|formatOptionCount|advancedSummary|advancedGroups/.test(emptyBranch));
assert.ok(
  !/if\s*\(\s*!inheritance\s*\|\|\s*inheritance\.groups\.length\s*===\s*0\s*\)\s*\{\s*return\s+null/.test(
    panel
  ),
  "empty-valid must not return null before structural shell"
);

// 6 — Loading shell preserved
assert.ok(/if\s*\(\s*!inheritance\s*&&\s*!loadError\s*\)/.test(panel));
assert.ok(/Avanzado…/.test(panel) || /Avanzado\u2026/.test(panel));
assert.ok(/data-loading="true"/.test(panel));

// 7 — Option hierarchy preserved
assert.ok(/styles\.optionList/.test(panel));
assert.ok(/parentGroupHidden/.test(panel));
assert.ok(/editHierarchy/.test(panel));
assert.ok(
  /grid-template-columns:\s*minmax\(0,\s*1fr\)\s+auto\s+2\.75rem/.test(css),
  "option row long-content grid guard"
);

// 8 — No new fetch / action
assert.ok(!/createClient|\.from\(|fetch\(/.test(panel));
assert.ok(!/saveProductEditDraftAction/.test(panel));

// 9 — Create unchanged / footer CSS untouched by this phase intent
assert.ok(!/ProductCustomizationOverridesPanel/.test(createForm));
assert.ok(
  /\.editForm:has\(\.actionsSticky\)\s*>\s*:nth-last-child\(2\)\s*\{[^}]*padding-bottom:\s*1\.5rem/.test(
    formCss.replace(/\s+/g, " ")
  ),
  "footer rhythm must remain 1.5rem"
);

// 10 — Metadata / status contrast tokens (secondary not tertiary)
assert.ok(
  /\.editHierarchy\s+\.groupDisclosureMeta[\s\S]*color:\s*var\(--text-secondary\)/.test(css)
);
assert.ok(
  /\.editHierarchy\s+\.advancedExceptionCount[\s\S]*color:\s*var\(--text-secondary\)/.test(css)
);
assert.ok(
  /\.editHierarchy\s+\.optionOverridePrice[\s\S]*color:\s*var\(--text-secondary\)/.test(css)
);

console.log(
  "admin-products-edit-advanced-premium-visual-closeout.verify.ts: PASS"
);
