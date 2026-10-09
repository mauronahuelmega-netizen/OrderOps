/**
 * Verify ADMIN-PRODUCTS-EDIT-UNIFIED-DRAFT-SAVE-IMPLEMENTATION-1
 *
 * Run: npx tsx lib/products/admin-products-edit-unified-draft-save-implementation.verify.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  canonicalizeIdSet,
  countCustomizationExceptions,
  idSetsEqual,
  toggleIdInCanonicalSet,
  unifiedEditDraftEqual,
  type UnifiedEditDraftSnapshot
} from "@/lib/products/edit-unified-draft";

const ROOT = process.cwd();

function read(rel: string) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

const helper = read("lib/products/edit-unified-draft.ts");
const editForm = read("components/admin/products/edit-product-form.tsx");
const panel = read(
  "components/admin/product-customization/product-customization-overrides-panel.tsx"
);
const actions = read("app/admin/(protected)/products/actions.ts");
const createForm = read("components/admin/products/create-product-form.tsx");
const formCss = read("components/admin/products/product-form.module.css");
const flyout = read("components/admin/products/flyout-panel.tsx");
const builder = read(
  "components/admin/product-customization/owner-customization-builder.tsx"
);

function baseline(over: Partial<UnifiedEditDraftSnapshot> = {}): UnifiedEditDraftSnapshot {
  return {
    name: "Burger",
    description: "",
    price: 10,
    sku: "B-1",
    stock: 5,
    isAvailable: true,
    trackStock: true,
    imageIntent: "keep",
    hiddenGroupIds: [],
    hiddenOptionIds: [],
    ...over
  };
}

// A/B — equality includes group + option ids
{
  const a = baseline({ hiddenGroupIds: ["g1"], hiddenOptionIds: ["o1"] });
  const b = baseline({ hiddenGroupIds: ["g1"], hiddenOptionIds: ["o1"] });
  const c = baseline({ hiddenGroupIds: ["g2"], hiddenOptionIds: ["o1"] });
  const d = baseline({ hiddenGroupIds: ["g1"], hiddenOptionIds: ["o2"] });
  assert.equal(unifiedEditDraftEqual(a, b), true);
  assert.equal(unifiedEditDraftEqual(a, c), false, "group ids participate");
  assert.equal(unifiedEditDraftEqual(a, d), false, "option ids participate");
}

// C — set ordering does not create dirty
{
  const a = baseline({ hiddenGroupIds: ["a", "b"], hiddenOptionIds: ["x", "y"] });
  const b = baseline({ hiddenGroupIds: ["b", "a"], hiddenOptionIds: ["y", "x"] });
  assert.equal(unifiedEditDraftEqual(a, b), true);
  assert.equal(idSetsEqual(["a", "b"], ["b", "a"]), true);
}

// D — duplicates do not create dirty
{
  const a = baseline({ hiddenGroupIds: ["g1", "g1"], hiddenOptionIds: ["o1", "o1"] });
  const b = baseline({ hiddenGroupIds: ["g1"], hiddenOptionIds: ["o1"] });
  assert.equal(unifiedEditDraftEqual(a, b), true);
  assert.deepEqual(canonicalizeIdSet(["g1", "g1", ""]), ["g1"]);
}

// E/F — group toggle → dirty → revert → pristine
{
  const base = baseline({ hiddenGroupIds: ["g1"] });
  let current = baseline({ hiddenGroupIds: ["g1"] });
  assert.equal(unifiedEditDraftEqual(current, base), true);
  current = {
    ...current,
    hiddenGroupIds: toggleIdInCanonicalSet(current.hiddenGroupIds, "g1")
  };
  assert.equal(unifiedEditDraftEqual(current, base), false, "group hide dirty");
  current = {
    ...current,
    hiddenGroupIds: toggleIdInCanonicalSet(current.hiddenGroupIds, "g1")
  };
  assert.equal(unifiedEditDraftEqual(current, base), true, "group revert pristine");
}

// G/H — option toggle → dirty → revert → pristine
{
  const base = baseline({ hiddenOptionIds: [] });
  let current = baseline({ hiddenOptionIds: [] });
  current = {
    ...current,
    hiddenOptionIds: toggleIdInCanonicalSet(current.hiddenOptionIds, "o9")
  };
  assert.equal(unifiedEditDraftEqual(current, base), false, "option hide dirty");
  current = {
    ...current,
    hiddenOptionIds: toggleIdInCanonicalSet(current.hiddenOptionIds, "o9")
  };
  assert.equal(unifiedEditDraftEqual(current, base), true, "option revert pristine");
}

// I — accordion/disclosure excluded from draft helper type
assert.ok(/type UnifiedEditDraftSnapshot/.test(helper));
{
  const snap = helper.match(/type UnifiedEditDraftSnapshot[\s\S]*?\n\}/)?.[0] ?? "";
  assert.ok(!/advancedOpen|expandedGroupId|accordion/.test(snap));
  assert.ok(/hiddenGroupIds/.test(snap) && /hiddenOptionIds/.test(snap));
  assert.ok(!/categoryId/.test(snap), "J — category excluded from draft");
}

// K — customization readiness gates Save
assert.ok(/customizationReady/.test(editForm));
assert.ok(/const canSave =[\s\S]*customizationReady[\s\S]*isDirty/.test(editForm));
assert.ok(/CustomizationLoadState|"loading"|"ready"|"error"|"empty"/.test(editForm));

// L — pristine blocks Save
assert.ok(/disabled=\{!canSave(?:\s*\|\|\s*lifecyclePending)?\}/.test(editForm));
assert.ok(
  /if \(!isDirtyRef\.current \|\| !customizationReadyRef\.current\)[\s\S]*preventDefault/.test(
    editForm
  )
);

// M — Edit panel draft mode: no immediate override mutation forms on draft path
assert.ok(/mode=["']draft["']/.test(editForm));
assert.ok(/mode\?:\s*"immediate"\s*\|\s*"draft"/.test(panel) || /mode = "immediate"/.test(panel));
assert.ok(/onToggleGroupHidden/.test(panel));
assert.ok(/onToggleOptionHidden/.test(panel));
assert.ok(
  /isDraftMode[\s\S]*DraftInheritanceGroupAccordion|DraftInheritanceGroupAccordion[\s\S]*isDraftMode|isDraftMode[\s\S]*DraftGroupAccordion|DraftGroupAccordion[\s\S]*isDraftMode/.test(
    panel
  ),
  "draft mode must render draft group accordion"
);
assert.ok(
  !/mode=["']draft["'][\s\S]{0,400}disableProductCustomizationGroupOverrideAction/.test(
    editForm
  )
);

// N — unified server action calls save_product_edit_draft
assert.ok(/export async function saveProductEditDraftAction/.test(actions));
assert.ok(/save_product_edit_draft/.test(actions));
assert.ok(/saveProductEditDraftAction/.test(editForm));
assert.ok(!/updateProductAction/.test(editForm));

// O — normal Edit action does not submit mutable category_id
assert.ok(!/name=["']category_id["']/.test(editForm));
{
  const saveStart = actions.indexOf("export async function saveProductEditDraftAction");
  const saveEnd = actions.indexOf("\nasync function validateCategoryOwnership", saveStart);
  const saveBody = actions.slice(saveStart, saveEnd > saveStart ? saveEnd : undefined);
  assert.ok(saveBody.length > 0, "saveProductEditDraftAction body extractable");
  assert.ok(!/formData\.get\(["']category_id["']\)/.test(saveBody));
  assert.ok(
    !/await validateCategoryOwnership|validateCategoryOwnership\(/.test(saveBody),
    "saveProductEditDraftAction must not call validateCategoryOwnership"
  );
  assert.ok(!/p_category_id/.test(saveBody));
}

// P — canonical hidden sets reach action/RPC payload
assert.ok(/name=["']hidden_group_ids["']/.test(editForm));
assert.ok(/name=["']hidden_option_ids["']/.test(editForm));
assert.ok(/FormData\.getAll\(["']hidden_group_ids["']\)|parseHiddenIdList\(formData,\s*["']hidden_group_ids["']\)/.test(actions));
assert.ok(/p_hidden_group_ids:\s*hiddenGroupIds/.test(actions));
assert.ok(/p_hidden_option_ids:\s*hiddenOptionIds/.test(actions));

// Q — one unified action, not sequential override actions in Edit
assert.ok(!/disableProductCustomizationGroupOverrideAction/.test(editForm));
assert.ok(!/restoreProductCustomizationOptionOverrideAction/.test(editForm));
assert.ok(/await saveProductEditDraftAction/.test(editForm));

// R — Create category behavior unchanged
assert.ok(/name=["']category_id["']/.test(createForm));
assert.ok(/requiredFieldLabel\(["']Categoría["']\)/.test(createForm));
assert.ok(/\brequired\b/.test(createForm.slice(createForm.indexOf('name="category_id"'), createForm.indexOf('name="category_id"') + 280)));

// S — cache invalidation union
{
  const saveBody = actions.slice(actions.indexOf("export async function saveProductEditDraftAction"));
  assert.ok(/revalidatePath\(["']\/admin\/products["']\)/.test(saveBody));
  assert.ok(/revalidatePath\(["']\/admin\/products\/customizations["']\)/.test(saveBody));
  assert.ok(/scope:\s*["']catalog["']/.test(saveBody));
  assert.ok(/scope:\s*["']customization["']/.test(saveBody));
}

// T — whole-editor footer after Advanced in Edit structure
{
  const panelIdx = editForm.indexOf("ProductCustomizationOverridesPanel");
  const stickyIdx = editForm.indexOf("actionsSticky");
  assert.ok(panelIdx > 0 && stickyIdx > panelIdx, "Advanced must precede sticky Save");
  assert.ok(!/editAfterForm/.test(editForm));
}

// Extra — exception count helper + draft ownership
assert.equal(countCustomizationExceptions(["g1"], ["o1", "o2"]), 3);
assert.ok(/unifiedEditDraftEqual/.test(editForm));
assert.ok(/categoryReadOnlyValue/.test(editForm));
assert.ok(/\.categoryReadOnlyValue\s*\{/.test(formCss));

// Extra — release lip no longer wired on Edit flyout path
assert.ok(!/headerReleaseClip/.test(flyout));
assert.ok(!/bodyReleaseClip/.test(flyout));

// Extra — builder still uses panel (immediate default)
assert.ok(/ProductCustomizationOverridesPanel/.test(builder));
assert.ok(/disableProductCustomizationGroupOverrideAction/.test(panel));

console.log("admin-products-edit-unified-draft-save-implementation.verify.ts: PASS");
