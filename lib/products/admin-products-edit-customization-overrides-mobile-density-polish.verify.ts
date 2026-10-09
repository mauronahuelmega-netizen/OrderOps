/**
 * Verify ADMIN-PRODUCTS-EDIT-CUSTOMIZATION-OVERRIDES-MOBILE-DENSITY-POLISH-1
 * (reconciled after progressive disclosure + unified draft save)
 *
 * Historical phase CLOSED the flat dense Secciones/Opciones card presentation.
 * Progressive disclosure superseded that PRESENTATION model. Unified draft
 * supersedes sibling-only dirty boundary: Edit mounts panel in mode="draft".
 * Durable invariants below remain: independent immediate actions for builder,
 * 44px visibility targets, hierarchical group→option mapping, no nested scroll.
 *
 * Run: npx tsx lib/products/admin-products-edit-customization-overrides-mobile-density-polish.verify.ts
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

// SUPERSESSION — flat Secciones/Opciones card layout intentionally retired
assert.ok(
  !/exceptionsStackTitle[\s\S]{0,40}Secciones/.test(panel) && !/>\s*Opciones\s*</.test(panel),
  "flat Secciones/Opciones presentation superseded by hierarchical accordion"
);
assert.ok(/advancedDisclosure/.test(panel), "progressive Advanced disclosure required");
assert.ok(/expandedGroupId/.test(panel), "single-open group accordion required");

// 1 — independent action owners preserved (immediate/builder path)
assert.ok(/disableProductCustomizationGroupOverrideAction/.test(panel));
assert.ok(/disableProductCustomizationOptionOverrideAction/.test(panel));
assert.ok(/restoreProductCustomizationGroupOverrideAction/.test(panel));
assert.ok(/restoreProductCustomizationOptionOverrideAction/.test(panel));
assert.ok(/loadProductCustomizationInheritanceAction/.test(panel));

// 2 — dense hierarchical presentation (group + option rows)
assert.ok(/styles\.advancedGroupRow(?![A-Za-z0-9_])/.test(panel));
assert.ok(/styles\.optionOverrideRow(?![A-Za-z0-9_])/.test(panel));
assert.ok(/group\.options\.map/.test(panel));

// 3 — interactive visibility actions preserve >=44 target
assert.ok(
  /\.visibilityAction[\s\S]*min-height:\s*2\.75rem/.test(css),
  "visibilityAction must keep min-height 2.75rem (44px)"
);
assert.ok(/\.visibilityAction[\s\S]*min-width:\s*2\.75rem/.test(css));

// 4 — status (icon) and disclosure remain distinct sibling controls
assert.ok(/\bEye\b/.test(panel) && /\bEyeOff\b/.test(panel));
assert.ok(/styles\.groupDisclosure/.test(panel));
assert.ok(/styles\.visibilityAction/.test(panel));
assert.ok(
  /className=\{styles\.advancedGroupRow\}[\s\S]*className=\{styles\.groupDisclosure\}[\s\S]*(?:className=\{styles\.visibilityForm\}|styles\.visibilityForm)/.test(
    panel
  )
);
assert.ok(
  /isDisabledForProduct|isGroupHidden|isOptionHidden/.test(panel),
  "visibility state via immediate isDisabledForProduct or draft hidden flags"
);

// 5 — Edit mounts draft mode; panel has no canSave/setIsDirty ownership
assert.ok(/ProductCustomizationOverridesPanel/.test(editForm));
assert.ok(/mode=["']draft["']/.test(editForm));
assert.ok(!/setIsDirty|markDirty|canSave/.test(panel));
assert.ok(!/editAfterForm/.test(editForm), "Advanced is inside form before sticky, not editAfterForm");

// 6 — counts / hierarchy from existing arrays only (no new fetch helpers)
assert.ok(/inheritance\.groups/.test(panel));
assert.ok(/group\.options/.test(panel));
assert.ok(!/select\(|\.from\(|createClient|fetch\(/.test(panel));

// 7 — no customization server/domain semantic rewrite (immediate forms still present for builder)
assert.ok(/override_type:\s*["']group["']/.test(actions));
assert.ok(/override_type:\s*["']option["']/.test(actions));
assert.ok(/name=["']product_id["']/.test(panel));
assert.ok(/name=["']group_id["']/.test(panel));
assert.ok(/name=["']option_id["']/.test(panel));

// 8 — release lip CSS may remain; flyout.tsx must not apply classes
assert.ok(/\.headerReleaseClip::after\s*\{[^}]*height:\s*32px/.test(flyoutCss));
assert.ok(!/headerReleaseClip/.test(flyout));
assert.ok(!/bodyReleaseClip/.test(flyout));

// 9 — no nested-scroll owner introduced in exceptions panel
assert.ok(!/overflow-y:\s*auto/.test(css.match(/\.exceptionsPanel[\s\S]{0,500}/)?.[0] ?? ""));
assert.ok(!/exceptionsPanel[\s\S]{0,200}overflow:\s*(auto|scroll)/.test(css));

// 10 — accessible action names preserved (immediate and/or draft)
assert.ok(
  /aria-label=\{(?:group|option)\.isDisabledForProduct \? restoreLabel : hideLabel\}/.test(panel) ||
    /aria-label=\{isGroupHidden \? restoreLabel : hideLabel\}/.test(panel) ||
    /aria-label=\{isOptionHidden \? restoreLabel : hideLabel\}/.test(panel)
);
assert.ok(/Ocultar \$\{/.test(panel) && /Volver a mostrar \$\{/.test(panel));

console.log(
  "admin-products-edit-customization-overrides-mobile-density-polish.verify.ts: PASS (reconciled for progressive disclosure + unified draft)"
);
