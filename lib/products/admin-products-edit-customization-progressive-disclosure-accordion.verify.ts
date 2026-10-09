/**
 * Verify ADMIN-PRODUCTS-EDIT-CUSTOMIZATION-PROGRESSIVE-DISCLOSURE-ACCORDION-1
 * (reconciled after ADMIN-PRODUCTS-EDIT-UNIFIED-DRAFT-SAVE-IMPLEMENTATION-1)
 *
 * Run: npx tsx lib/products/admin-products-edit-customization-progressive-disclosure-accordion.verify.ts
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
const flyout = read("components/admin/products/flyout-panel.tsx");
const flyoutCss = read("components/admin/products/flyout-panel.module.css");
const actions = read("app/admin/(protected)/products/customizations/actions.ts");
const pkg = read("package.json");

// 1 — top-level Advanced disclosure, default closed
assert.ok(/const \[advancedOpen, setAdvancedOpen\] = useState\(false\)/.test(panel));
assert.ok(/aria-expanded=\{advancedOpen\}/.test(panel));
assert.ok(/aria-controls=\{advancedPanelId\}/.test(panel));
assert.ok(/className=\{styles\.advancedDisclosure\}/.test(panel));
assert.ok(/advancedDisclosureLabel[\s\S]*Avanzado/.test(panel));

// 2 — chevron from existing lucide-react
assert.ok(/"lucide-react"/.test(pkg));
assert.ok(/ChevronDown/.test(panel));
assert.ok(/aria-hidden="true"/.test(panel));
assert.ok(/advancedChevron/.test(css));

// 3 — active exception count discoverable while closed (count > 0 only)
assert.ok(/exceptionCount\s*>\s*0/.test(panel));
assert.ok(/advancedExceptionCount/.test(panel));
assert.ok(/formatExceptionCount/.test(panel));

// 4 — single expandedGroupId contract
assert.ok(/expandedGroupId/.test(panel));
assert.ok(/useState<string\s*\|\s*null>\(null\)/.test(panel));
assert.ok(
  /setExpandedGroupId\(\(prev\)\s*=>\s*\(prev\s*===\s*groupId\s*\?\s*null\s*:\s*groupId\)\)/.test(
    panel
  ) || /prev === groupId \? null : groupId/.test(panel)
);
assert.ok(/expanded=\{expandedGroupId === group\.groupId\}/.test(panel));

// 5 — closing Advanced resets group expansion
assert.ok(/setExpandedGroupId\(null\)/.test(panel));

// 6 — product change resets disclosure state
assert.ok(
  /useEffect\(\(\)\s*=>\s*\{\s*setAdvancedOpen\(false\);\s*setExpandedGroupId\(null\);\s*\},\s*\[productId\]\)/.test(
    panel.replace(/\s+/g, " ")
  ) ||
    (/setAdvancedOpen\(false\)/.test(panel) &&
      /setExpandedGroupId\(null\)/.test(panel) &&
      /\[productId\]/.test(panel))
);

// 7 — group disclosure + visibility are sibling controls (immediate form OR draft button)
assert.ok(/styles\.advancedGroupRow/.test(panel));
assert.ok(/styles\.groupDisclosure/.test(panel));
assert.ok(/styles\.visibilityAction/.test(panel));
assert.ok(
  /className=\{styles\.advancedGroupRow\}[\s\S]*className=\{styles\.groupDisclosure\}[\s\S]*(?:className=\{styles\.visibilityForm\}|styles\.visibilityForm)/.test(
    panel
  ),
  "visibility control must be sibling under advancedGroupRow, not nested in disclosure"
);
assert.ok(
  /groupDisclosure[\s\S]*?<\/button>\s*<form[\s\S]*?visibilityForm/.test(panel.replace(/\s+/g, " ")) ||
    /<\/button>\s*<form\s+action=\{group\.isDisabledForProduct/.test(panel) ||
    (/styles\.visibilityForm/.test(panel) &&
      /onToggleGroupHidden|isGroupHidden/.test(panel)),
  "visibility sibling: immediate <form className={styles.visibilityForm}> OR draft button with visibilityAction"
);

// 8 — Eye / EyeOff represent current state (immediate isDisabledForProduct OR draft isGroupHidden/isOptionHidden)
assert.ok(/from "lucide-react"/.test(panel));
assert.ok(/\bEye\b/.test(panel) && /\bEyeOff\b/.test(panel));
assert.ok(
  /isDisabledForProduct \? \(\s*<EyeOff/.test(panel.replace(/\s+/g, " ")) ||
    /isGroupHidden \? \(\s*<EyeOff/.test(panel.replace(/\s+/g, " ")) ||
    /isOptionHidden \? \(\s*<EyeOff/.test(panel.replace(/\s+/g, " ")),
  "EyeOff must reflect disabled/hidden state via isDisabledForProduct or draft hidden flags"
);
assert.ok(/visibilityActionHidden/.test(css));

// 9 — visibility touch target >=44
assert.ok(
  /\.visibilityAction[\s\S]*min-(?:width|height):\s*2\.75rem/.test(css),
  "visibilityAction must keep 2.75rem (44px) target"
);
assert.ok(/min-width:\s*2\.75rem/.test(css) && /min-height:\s*2\.75rem/.test(css));

// 10 — options nested under group (conditional on expanded)
assert.ok(/group\.options\.map/.test(panel));
assert.ok(/expanded \? \(/.test(panel) || /expanded\s*\?\s*\(/.test(panel));
assert.ok(!/exceptionsStackTitle[\s\S]*Secciones/.test(panel));
assert.ok(!/>\s*Opciones\s*</.test(panel));
assert.ok(!/exceptionsStacks/.test(panel));

// 11 — hierarchical mapping uses group.options (no string inference)
assert.ok(/group\.options/.test(panel));
assert.ok(!/Otras opciones/.test(panel));

// 12 — existing action owners preserved for immediate mode; no new fetch for expansion
assert.ok(/disableProductCustomizationGroupOverrideAction/.test(panel));
assert.ok(/disableProductCustomizationOptionOverrideAction/.test(panel));
assert.ok(/restoreProductCustomizationGroupOverrideAction/.test(panel));
assert.ok(/restoreProductCustomizationOptionOverrideAction/.test(panel));
assert.ok(/loadProductCustomizationInheritanceAction/.test(panel));
assert.ok(/name=["']product_id["']/.test(panel));
assert.ok(/name=["']group_id["']/.test(panel));
assert.ok(/name=["']option_id["']/.test(panel));
assert.ok(/override_type:\s*["']group["']/.test(actions));
assert.ok(/override_type:\s*["']option["']/.test(actions));
assert.ok(!/select\(|\.from\(|createClient|fetch\(/.test(panel));

// 13 — descriptive action aria-labels (immediate and/or draft)
assert.ok(
  /aria-label=\{group\.isDisabledForProduct \? restoreLabel : hideLabel\}/.test(panel) ||
    /aria-label=\{isGroupHidden \? restoreLabel : hideLabel\}/.test(panel)
);
assert.ok(
  /aria-label=\{option\.isDisabledForProduct \? restoreLabel : hideLabel\}/.test(panel) ||
    /aria-label=\{isOptionHidden \? restoreLabel : hideLabel\}/.test(panel)
);
assert.ok(/Ocultar \$\{.*\} solo en/.test(panel));
assert.ok(/Volver a mostrar \$\{.*\} en/.test(panel));

// 14 — Edit uses draft mode; panel itself owns no Save/dirty setters
assert.ok(/ProductCustomizationOverridesPanel/.test(editForm));
assert.ok(/mode=["']draft["']/.test(editForm));
assert.ok(!/setIsDirty|markDirty|canSave/.test(panel));

// 15 — release lip: CSS definition kept; flyout.tsx must not apply classes
assert.ok(/\.headerReleaseClip::after\s*\{[^}]*height:\s*32px/.test(flyoutCss));
assert.ok(!/headerReleaseClip/.test(flyout), "flyout.tsx must not reference headerReleaseClip");
assert.ok(!/bodyReleaseClip/.test(flyout), "flyout.tsx must not reference bodyReleaseClip");

// 16 — no nested scroll owner in exceptions panel
assert.ok(!/overflow-y:\s*auto/.test(css.match(/\.exceptionsPanel[\s\S]{0,500}/)?.[0] ?? ""));
assert.ok(!/advancedPanel[\s\S]{0,200}overflow:\s*(auto|scroll)/.test(css));
assert.ok(!/groupOptions[\s\S]{0,200}overflow:\s*(auto|scroll)/.test(css));

// 17 — advanced disclosure touch target
assert.ok(/\.advancedDisclosure[\s\S]*min-height:\s*3rem/.test(css));

console.log(
  "admin-products-edit-customization-progressive-disclosure-accordion.verify.ts: PASS"
);
