/**
 * Verify ADMIN-PRODUCTS-EDIT-ADVANCED-VISUAL-HIERARCHY-POLISH-1
 *
 * Visual hierarchy only — functional unified draft contract unchanged.
 * Run: npx tsx lib/products/admin-products-edit-advanced-visual-hierarchy-polish.verify.ts
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
const editForm = read("components/admin/products/edit-product-form.tsx");
const createForm = read("components/admin/products/create-product-form.tsx");
const actions = read("app/admin/(protected)/products/actions.ts");
const customizationActions = read(
  "app/admin/(protected)/products/customizations/actions.ts"
);
const flyout = read("components/admin/products/flyout-panel.tsx");
const pkg = read("package.json");

// 1 — Edit-scoped hierarchy variant (builder immediate path untouched by editHierarchy)
assert.ok(/styles\.editHierarchy/.test(panel), "editHierarchy class required for draft mode");
assert.ok(
  /isDraftMode \? styles\.editHierarchy/.test(panel.replace(/\s+/g, " ")) ||
    /isDraftMode\s*\?\s*styles\.editHierarchy/.test(panel),
  "editHierarchy must apply only in draft/Edit mode"
);
assert.ok(/\.editHierarchy/.test(css), "editHierarchy CSS owner required");

// 2 — Level 1 Advanced distinct from form controls / groups
assert.ok(/className=\{styles\.advancedDisclosure\}/.test(panel));
assert.ok(/advancedDisclosureLabel[\s\S]*Avanzado/.test(panel));
assert.ok(/data-level="advanced"/.test(panel));
assert.ok(
  /\.editHierarchy\s+\.advancedDisclosure[\s\S]*\{/.test(css),
  "Advanced section-level styles under editHierarchy"
);

// 3 — Level 2 Group distinct from Advanced
assert.ok(/styles\.groupDisclosure/.test(panel));
assert.ok(/data-level="group"/.test(panel));
assert.ok(
  /\.editHierarchy\s+\.groupDisclosure[\s\S]*\{/.test(css) ||
    /\.editHierarchy\s+\.advancedGroup[\s\S]*\{/.test(css)
);

// 4 — Level 3 Option distinct; flat list / separator architecture
assert.ok(/styles\.optionOverrideRow/.test(panel));
assert.ok(/data-level="option"/.test(panel));
assert.ok(/data-level="options"/.test(panel) || /styles\.groupOptions/.test(panel));
assert.ok(
  /\.editHierarchy\s+\.optionOverrideRow\s*\{[^}]*border-top:[^}]*border-radius:\s*0/.test(
    css.replace(/\s+/g, " ")
  ),
  "option rows must use list/separator architecture under editHierarchy"
);
assert.ok(/styles\.optionOverridePrice/.test(panel), "option price secondary element");
assert.ok(/\.optionOverridePrice/.test(css));
// HARD-QA-FIX supersession: draft options use optionList + optionOverridePrimary grid
assert.ok(
  /styles\.optionList/.test(panel) && /styles\.optionOverridePrimary/.test(panel),
  "STALE VISUAL ASSERTION superseded: optionList + primary column replace card/copy flex"
);

// 5 — Advanced in-memory summary (no fetch)
assert.ok(/advancedSummary/.test(panel));
assert.ok(/formatSectionCount/.test(panel));
assert.ok(/optionTotalCount/.test(panel));
assert.ok(!/select\(|\.from\(|createClient|fetch\(/.test(panel));

// 6 — Hidden semantic marker (non-color-only)
assert.ok(/hiddenBadge/.test(panel));
assert.ok(/>\s*Oculta\s*</.test(panel) || /Oculta/.test(panel));
assert.ok(/\.hiddenBadge/.test(css));
assert.ok(/data-hidden=\{/.test(panel));

// 7 — Visibility action remains secondary but accessible
assert.ok(/styles\.visibilityAction/.test(panel));
assert.ok(
  /\.visibilityAction[\s\S]*min-(?:width|height):\s*2\.75rem/.test(css),
  "visibilityAction >=44px touch target"
);
assert.ok(
  /\.editHierarchy\s+\.visibilityAction[\s\S]*background:\s*transparent/.test(css),
  "Edit hierarchy visibility action is ghost/subtle"
);
const draftOptionSource = panel.slice(panel.indexOf("function DraftInheritanceOptionRow"));
assert.ok(
  /<button\s+type="button"\s+className=\{`\$\{styles\.visibilityAction\}/.test(
    draftOptionSource.replace(/\s+/g, " ")
  ),
  "Draft option Eye must remain type=button with visibilityAction"
);

// 8 — Eye buttons remain type=button in draft path (no submit forms for draft)
assert.ok(/function DraftInheritanceGroupAccordion/.test(panel));
assert.ok(
  /onToggleGroupHidden[\s\S]*type="button"/.test(panel) ||
    /DraftInheritanceGroupAccordion[\s\S]*type="button"[\s\S]*visibilityAction/.test(panel)
);
assert.ok(!/DraftInheritanceOptionRow[\s\S]*type="submit"/.test(panel));

// 9 — No immediate mutation reintroduced on Edit draft path
assert.ok(/mode=["']draft["']/.test(editForm));
assert.ok(/mode\s*===\s*["']draft["']|isDraftMode/.test(panel));
const draftGroupFn = panel.slice(
  panel.indexOf("function DraftInheritanceGroupAccordion")
);
const draftOptionFn = panel.slice(
  panel.indexOf("function DraftInheritanceOptionRow")
);
assert.ok(
  draftGroupFn.length > 0 &&
    !/disableProductCustomizationGroupOverrideAction/.test(draftGroupFn) &&
    !/restoreProductCustomizationGroupOverrideAction/.test(draftGroupFn),
  "Draft group accordion must not call immediate group override actions"
);
assert.ok(
  draftOptionFn.length > 0 &&
    !/disableProductCustomizationOptionOverrideAction/.test(draftOptionFn) &&
    !/restoreProductCustomizationOptionOverrideAction/.test(draftOptionFn),
  "Draft option row must not call immediate option override actions"
);

// 10 — Advanced remains before sticky footer (inside Edit form)
assert.ok(/ProductCustomizationOverridesPanel/.test(editForm));
assert.ok(!/editAfterForm/.test(editForm));
assert.ok(/actionsSticky/.test(editForm) || /editActions/.test(editForm));
const panelIdx = editForm.indexOf("ProductCustomizationOverridesPanel");
const stickyIdx = Math.max(
  editForm.indexOf("actionsSticky"),
  editForm.indexOf("editActions")
);
assert.ok(panelIdx > 0 && stickyIdx > panelIdx, "Advanced markup must appear before sticky actions");

// 11 — Create contract not altered by this phase
assert.ok(!/ProductCustomizationOverridesPanel/.test(createForm));
assert.ok(!/editHierarchy/.test(createForm));

// 12 — No new fetch / Server Action for visual summary
assert.ok(!/saveProductEditDraftAction/.test(panel));
assert.ok(/saveProductEditDraftAction/.test(actions));
assert.ok(/loadProductCustomizationInheritanceAction/.test(panel));
assert.ok(
  !/export async function\s+\w*Advanced/.test(actions) &&
    !/export async function\s+\w*Advanced/.test(customizationActions)
);

// 13 — Accordion / one-group-open preserved
assert.ok(/const \[advancedOpen, setAdvancedOpen\] = useState\(false\)/.test(panel));
assert.ok(/expandedGroupId/.test(panel));
assert.ok(
  /setExpandedGroupId\(\(prev\)\s*=>\s*\(prev\s*===\s*groupId\s*\?\s*null\s*:\s*groupId\)\)/.test(
    panel
  ) || /prev === groupId \? null : groupId/.test(panel)
);

// 14 — Chevron source unchanged
assert.ok(/"lucide-react"/.test(pkg));
assert.ok(/ChevronDown/.test(panel));
assert.ok(/\bEye\b/.test(panel) && /\bEyeOff\b/.test(panel));

// 15 — Release-lip debt left inert (not a cleanup phase)
assert.ok(!/headerReleaseClip/.test(flyout));
assert.ok(!/bodyReleaseClip/.test(flyout));

console.log(
  "admin-products-edit-advanced-visual-hierarchy-polish.verify.ts: PASS"
);
