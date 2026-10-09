/**
 * Verify ADMIN-PRODUCTS-EDIT-DIRTY-STATE-UX-CONTRACT-1
 * (reconciled after ADMIN-PRODUCTS-EDIT-UNIFIED-DRAFT-SAVE-IMPLEMENTATION-1)
 *
 * Run: npx tsx lib/products/admin-products-edit-dirty-state-ux-contract.verify.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(rel: string) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

const editForm = read("components/admin/products/edit-product-form.tsx");
const formCss = read("components/admin/products/product-form.module.css");
const flyout = read("components/admin/products/flyout-panel.tsx");
const provider = read("components/admin/products/products-management-provider.tsx");
const actions = read("app/admin/(protected)/products/actions.ts");
const createForm = read("components/admin/products/create-product-form.tsx");
const helper = read("lib/products/edit-unified-draft.ts");

// A — canonical unified draft snapshot + semantic equality helpers
assert.ok(/type UnifiedEditDraftSnapshot/.test(helper));
assert.ok(/function buildProductBaselineSnapshot/.test(editForm));
assert.ok(/function unifiedEditDraftEqual/.test(helper));
assert.ok(/unifiedEditDraftEqual/.test(editForm));
assert.ok(/persistedBaseline/.test(editForm));
assert.ok(/imageIntent/.test(helper.match(/type UnifiedEditDraftSnapshot[\s\S]*?\n\}/)?.[0] ?? ""));

{
  const snap = helper.match(/type UnifiedEditDraftSnapshot[\s\S]*?\n\}/)?.[0] ?? "";
  for (const field of [
    "name",
    "description",
    "price",
    "sku",
    "stock",
    "isAvailable",
    "trackStock",
    "imageIntent",
    "hiddenGroupIds",
    "hiddenOptionIds"
  ]) {
    assert.ok(snap.includes(field), `snapshot must include ${field}`);
  }
  assert.ok(!/categoryId/.test(snap), "categoryId must not be in unified draft snapshot");
}

// B — dirty derived from current vs persisted baseline (not touch flags)
assert.ok(
  /const isDirty = !unifiedEditDraftEqual\(currentSnapshot, persistedBaseline\)/.test(editForm)
);
assert.ok(!/setDirty\(true\)/.test(editForm));

// C — Save capability requires isDirty + customizationReady
assert.ok(/const canSave =[\s\S]*customizationReady[\s\S]*isDirty[\s\S]*isValid/.test(editForm));
assert.ok(/disabled=\{!canSave(?:\s*\|\|\s*lifecyclePending)?\}/.test(editForm));

// D — pristine / not-ready submit blocked client-side
assert.ok(/function handleFormSubmit/.test(editForm));
assert.ok(
  /if \(!isDirtyRef\.current \|\| !customizationReadyRef\.current\)[\s\S]*preventDefault/.test(
    editForm
  )
);

// E — close request guard + confirmed discard bypass
assert.ok(/registerFlyoutCloseHandler/.test(editForm));
assert.ok(
  /if \(!isDirtyRef\.current\) \{\s*commitClose\(\);\s*return;\s*\}/.test(editForm),
  "dirty close must not commit immediately"
);
assert.ok(/pendingCommitCloseRef\.current = commitClose/.test(editForm));
assert.ok(/handleConfirmDiscard/.test(editForm));
assert.ok(/showModal\(\)/.test(editForm));

// E2 — imageIntent + hidden override ids participate in equality
assert.ok(
  /a\.imageIntent === b\.imageIntent/.test(helper),
  "imageIntent must participate in dirty equality"
);
assert.ok(/idSetsEqual\(a\.hiddenGroupIds, b\.hiddenGroupIds\)/.test(helper));
assert.ok(/idSetsEqual\(a\.hiddenOptionIds, b\.hiddenOptionIds\)/.test(helper));

// F — discard confirmation (no window.confirm)
assert.ok(/¿Descartar cambios\?/.test(editForm));
assert.ok(/Seguir editando/.test(editForm));
assert.ok(/Descartar cambios/.test(editForm));
assert.ok(/edit-product-discard-title/.test(editForm));
assert.ok(!/window\.confirm/.test(editForm));
assert.ok(/\.discardDialog\s*\{/.test(formCss));
assert.ok(
  /min-height:\s*44px/.test(
    formCss.match(/\.discardDialogStay[\s\S]*?\.discardDialogConfirm[\s\S]*?\}/)?.[0] ?? formCss
  )
);

// G — flyout uses requestClose for user dismissal; Save success uses closeFlyout
assert.ok(/requestCloseFlyout/.test(flyout));
assert.ok(/onClick=\{requestCloseFlyout\}/.test(flyout));
assert.ok(/event\.key === "Escape"[\s\S]*requestCloseFlyout\(\)/.test(flyout));
assert.ok(/onSuccess=\{closeFlyout\}/.test(flyout));
assert.ok(/isEditProductConfirmOpen|isEditDiscardConfirmOpen/.test(flyout));
assert.ok(/closest\(["']dialog["']\)/.test(flyout) || /dialog\?\.open/.test(flyout) || /data-edit-product-confirm/.test(flyout));
assert.ok(/discardDialog\.close\(\)|closest\("dialog"\)[\s\S]*\.close\(\)|querySelector[\s\S]*data-edit-product-confirm/.test(flyout));
assert.ok(/registerFlyoutCloseHandler/.test(provider));
assert.ok(/requestCloseFlyout/.test(provider));

// H — image intent is part of dirty; KEEP/REPLACE/REMOVE remain
assert.ok(/EditImageIntent|"keep"\s*\|\s*"replace"\s*\|\s*"remove"/.test(editForm));
assert.ok(/setImageIntentState\("remove"\)/.test(editForm));
assert.ok(/setImageIntentState\("replace"\)/.test(editForm));

// I — customization overrides participate in unified draft (mode="draft")
assert.ok(/ProductCustomizationOverridesPanel/.test(editForm));
assert.ok(/mode=["']draft["']/.test(editForm));
assert.ok(/hiddenGroupIds/.test(editForm) && /hiddenOptionIds/.test(editForm));
assert.ok(/onToggleGroupHidden|onToggleOptionHidden/.test(editForm));

// J — Save success still closes via onSuccess (no discard prompt on success path)
assert.ok(/state\.success[\s\S]*onSuccess\?\.\(\)/.test(editForm));
assert.ok(/onSuccess=\{closeFlyout\}/.test(flyout));

// K — Create / domain untouched; Edit uses save draft; legacy update still exported
assert.ok(!/registerFlyoutCloseHandler/.test(createForm));
assert.ok(!/UnifiedEditDraftSnapshot|EditProductSnapshot/.test(createForm));
assert.ok(/saveProductEditDraftAction/.test(editForm));
assert.ok(!/updateProductAction/.test(editForm));
assert.ok(/export async function saveProductEditDraftAction/.test(actions));
assert.ok(/export async function updateProductAction/.test(actions));

console.log("admin-products-edit-dirty-state-ux-contract.verify.ts: PASS");
