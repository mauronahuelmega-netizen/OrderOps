/**
 * Verify ADMIN-PRODUCTS-EDIT-ADVANCED-VISUAL-HIERARCHY-HARD-QA-FIX-1
 *
 * Owner hard-QA follow-up: parent-hidden disables child Eyes (draft only),
 * one-card-per-group + flat inset option list, ghost visibility actions.
 * Does NOT alter unified draft equality / Save / RPC semantics.
 *
 * Run: npx tsx lib/products/admin-products-edit-advanced-visual-hierarchy-hard-qa-fix.verify.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  countCustomizationExceptions,
  toggleIdInCanonicalSet,
  unifiedEditDraftEqual,
  type UnifiedEditDraftSnapshot
} from "@/lib/products/edit-unified-draft";

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
const helper = read("lib/products/edit-unified-draft.ts");
const actions = read("app/admin/(protected)/products/actions.ts");

const draftGroupFn = panel.slice(
  panel.indexOf("function DraftInheritanceGroupAccordion")
);
const draftOptionFn = panel.slice(
  panel.indexOf("function DraftInheritanceOptionRow")
);
const immediateOptionFn = panel.slice(
  panel.indexOf("function ImmediateInheritanceOptionRow"),
  panel.indexOf("function DraftInheritanceGroupAccordion")
);

// ——— Parent-hidden child disable (draft only) ———
assert.ok(/parentGroupHidden/.test(draftOptionFn), "draft option receives parentGroupHidden");
assert.ok(
  /disabled=\{controlsLocked\}|disabled=\{parentGroupHidden\}/.test(
    draftOptionFn.replace(/\s+/g, " ")
  ) || /disabled=\{controlsLocked\}/.test(draftOptionFn),
  "draft option Eye must use real disabled when parent hidden"
);
assert.ok(
  /if \(isGroupHidden\)\s*\{\s*return;\s*\}/.test(draftGroupFn.replace(/\s+/g, " ")) ||
    /if \(isGroupHidden\) \{\s*return;/.test(draftGroupFn),
  "parent-hidden guard must no-op option toggle without mutating draft"
);
assert.ok(
  /Mostrá la sección para editar sus opciones/.test(draftGroupFn),
  "group-hidden helper copy required"
);
assert.ok(/styles\.groupHiddenHelper/.test(draftGroupFn));
assert.ok(/\.groupHiddenHelper/.test(css));

// Parent hide must NOT rewrite hiddenOptionIds in panel (no cascade)
assert.ok(
  !/setHiddenOptionIds/.test(draftGroupFn),
  "draft group accordion must not call setHiddenOptionIds (no cascade)"
);

// Immediate/builder option path must NOT inherit draft parent-hidden disable
assert.ok(
  !/parentGroupHidden/.test(immediateOptionFn),
  "builder immediate option row must not use parentGroupHidden disable"
);
assert.ok(/type="submit"/.test(immediateOptionFn), "immediate option still uses submit forms");

// ——— Exception count remains explicit overrides only ———
{
  const baseline: UnifiedEditDraftSnapshot = {
    name: "x",
    description: "",
    price: 1,
    sku: "",
    stock: 1,
    isAvailable: true,
    trackStock: true,
    imageIntent: "keep",
    hiddenGroupIds: ["g-papas"],
    hiddenOptionIds: ["o-medianas"]
  };
  assert.equal(
    countCustomizationExceptions(baseline.hiddenGroupIds, baseline.hiddenOptionIds),
    2,
    "parent + one explicit child = 2 (not descendant inflation)"
  );
  const afterToggleChild = {
    ...baseline,
    hiddenOptionIds: toggleIdInCanonicalSet(baseline.hiddenOptionIds, "o-medianas")
  };
  assert.equal(
    countCustomizationExceptions(
      afterToggleChild.hiddenGroupIds,
      afterToggleChild.hiddenOptionIds
    ),
    1
  );
  assert.equal(
    unifiedEditDraftEqual(baseline, {
      ...baseline,
      hiddenOptionIds: ["o-medianas"]
    }),
    true
  );
}

// Helper equality semantics untouched by this phase
assert.ok(/export function unifiedEditDraftEqual/.test(helper));
assert.ok(/export function countCustomizationExceptions/.test(helper));
assert.ok(!/parentGroupHidden|controlsLocked/.test(helper));

// ——— Visual structure: one card / flat list / inset ———
assert.ok(/styles\.optionList/.test(draftGroupFn), "optionList wrapper inside group");
assert.ok(/styles\.optionOverridePrimary/.test(draftOptionFn), "name+chip column");
assert.ok(/styles\.optionOverridePrice/.test(draftOptionFn));
assert.ok(/styles\.visibilityActionLocked/.test(draftOptionFn));
assert.ok(
  /\.editHierarchy\s+\.optionOverrideRow\s*\{[^}]*padding:[^}]*28px/.test(
    css.replace(/\s+/g, " ")
  ),
  "real option inset from group title (padding-inline-start ~28px)"
);
assert.ok(
  /\.editHierarchy\s+\.optionOverrideRow\s*\{[^}]*grid-template-columns:[^}]*minmax\(0,\s*1fr\)/.test(
    css.replace(/\s+/g, " ")
  ),
  "option row grid separates name / price / action"
);
assert.ok(
  /\.editHierarchy\s+\.optionOverrideRow\s*\{[^}]*border-radius:\s*0/.test(
    css.replace(/\s+/g, " ")
  )
);
assert.ok(
  !/DraftInheritanceOptionRow[\s\S]*styles\.optionCard/.test(panel),
  "draft options must not use standalone optionCard"
);
assert.ok(
  /\.editHierarchy\s+\.visibilityActionHidden[\s\S]*background:\s*transparent/.test(css),
  "hidden EyeOff must not use heavy filled surface under editHierarchy"
);
assert.ok(
  /\.editHierarchy\s+\.groupDisclosureName[\s\S]*font-weight:\s*700/.test(css),
  "group title outranks option weight"
);
assert.ok(
  /\.editHierarchy\s+\.optionOverrideName[\s\S]*font-weight:\s*500/.test(css)
);

// ——— Edit scoping + Save freeze ———
assert.ok(/mode=["']draft["']/.test(editForm));
assert.ok(/isDraftMode \? styles\.editHierarchy/.test(panel.replace(/\s+/g, " ")));
assert.ok(!/ProductCustomizationOverridesPanel/.test(createForm));
assert.ok(/saveProductEditDraftAction/.test(actions));
assert.ok(!/saveProductEditDraftAction/.test(panel));

// Group disclosure remains type=button (not submit)
assert.ok(
  /className=\{styles\.groupDisclosure\}[\s\S]*?type="button"|type="button"[\s\S]*?className=\{styles\.groupDisclosure\}/.test(
    draftGroupFn.replace(/\s+/g, " ")
  ) || /type="button"\s+className=\{styles\.groupDisclosure\}/.test(draftGroupFn)
);

console.log(
  "admin-products-edit-advanced-visual-hierarchy-hard-qa-fix.verify.ts: PASS"
);
