/**
 * Verify ADMIN-PRODUCTS-FLYOUT-FORM-INTERACTION-POLISH-1
 * (PROD-P2-3 flyout/form remainder, PROD-P2-4, PROD-P2-5)
 *
 * Run: npx tsx lib/products/admin-products-flyout-form-interaction-polish.verify.ts
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
const provider = read("components/admin/products/products-management-provider.tsx");
const formCss = read("components/admin/products/product-form.module.css");
const crop = read("components/admin/products/image-crop-modal.tsx");
const cropCss = read("components/admin/products/image-crop-modal.module.css");
const createForm = read("components/admin/products/create-product-form.tsx");
const editForm = read("components/admin/products/edit-product-form.tsx");
const actions = read("app/admin/(protected)/products/actions.ts");
const cardCss = read("components/admin/products/product-card.module.css");
const tableCss = read("components/admin/products/product-table-view.module.css");
const hook = read("components/admin/products/use-products-desktop-collection.ts");

// A — dialog semantics
assert.ok(flyout.includes('role="dialog"') && flyout.includes('aria-modal="true"'));
assert.ok(flyout.includes('aria-labelledby="admin-product-flyout-title"'));

// B — dialog ref
assert.ok(/dialogRef/.test(flyout) && /ref=\{dialogRef\}/.test(flyout));

// C — initial focus on Close
assert.ok(
  /closeButtonRef/.test(flyout) &&
    /closeButtonRef\.current\?\.focus\(\)/.test(flyout),
  "initial focus must target Close"
);

// D — Escape → requestCloseFlyout (dirty-aware) / closeFlyout legacy
assert.ok(
  /event\.key === "Escape"[\s\S]*requestCloseFlyout\(\)/.test(flyout) ||
    /event\.key === "Escape"[\s\S]*closeFlyout\(\)/.test(flyout),
  "Escape must request flyout close"
);

// E/F — Tab containment on dialog-local path
assert.ok(
  /dialog\.addEventListener\("keydown"/.test(flyout) &&
    /getFlyoutFocusableElements\(dialog\)/.test(flyout),
  "Tab trap must be dialog-local"
);
assert.ok(
  /event\.shiftKey[\s\S]*last\.focus\(\)/.test(flyout) &&
    /first\.focus\(\)/.test(flyout),
  "Shift+Tab and Tab wrap must exist"
);

// G — opener capture + restore
assert.ok(
  /captureActiveOpener/.test(provider) &&
    /openerRef/.test(provider) &&
    /opener\.focus\(\)/.test(provider),
  "return focus to captured opener required"
);
assert.ok(
  /openCreateProduct[\s\S]*captureActiveOpener/.test(provider) ||
    /captureActiveOpener\(openerRef\);[\s\S]*setFlyoutMode\("create-product"\)/.test(provider),
  "manual create must capture opener"
);

// H — no document-global keyboard trap on flyout
assert.ok(
  !/document\.addEventListener\("keydown"/.test(flyout),
  "flyout must not use document keydown trap"
);

// I/J — no external tabindex / positive tabindex
assert.ok(!/tabIndex=\{[1-9]/.test(flyout) && !/tabindex="[1-9]/.test(flyout));
assert.ok(!/querySelectorAll\("\*"\)/.test(flyout));

// K — sticky footer surface
assert.ok(
  /\.actionsSticky[\s\S]*background:\s*var\(--bg-surface\)/.test(formCss) &&
    /\.actionsSticky[\s\S]*border-top:/.test(formCss),
  "sticky footer needs opaque surface + separator"
);

// L — footer clearance
assert.ok(
  /actionsSticky[\s\S]*nth-last-child\(2\)[\s\S]*padding-bottom|nth-last-child\(2\)[\s\S]*actionsSticky/.test(
    formCss
  ) || /padding-bottom:\s*4\.75rem/.test(formCss),
  "form must reserve clearance above sticky footer"
);

// M — touch targets >=44 (2.75rem)
assert.ok(/min-height:\s*2\.75rem/.test(flyoutCss), "close target >=44");
assert.ok(/min-height:\s*2\.75rem/.test(formCss), "form controls >=44");
assert.ok(/editImageBadge[\s\S]*2\.75rem/.test(formCss), "crop badge >=44");
assert.ok(
  /\.toggleStackHeader :global\(label\)[\s\S]*2\.75rem/.test(formCss),
  "form stock/availability switch hit >=44"
);
assert.ok(/min-height:\s*2\.75rem/.test(cropCss), "crop actions >=44");

// N — actions: Create unchanged; Edit uses unified draft save; legacy update may remain exported
assert.ok(/export async function createProductAction/.test(actions));
assert.ok(/export async function saveProductEditDraftAction/.test(actions));
assert.ok(/export async function updateProductAction/.test(actions));
assert.ok(createForm.includes("createProductAction"));
assert.ok(editForm.includes("saveProductEditDraftAction"));
assert.ok(!editForm.includes("updateProductAction"), "Edit must not call legacy updateProductAction");

// O — dirty/unsaved close is owned by EDIT-DIRTY-STATE-UX-CONTRACT (not beforeunload)
assert.ok(!/beforeunload/.test(flyout + provider + createForm + editForm));
assert.ok(/requestCloseFlyout/.test(flyout) && /registerFlyoutCloseHandler/.test(provider));
assert.ok(/isDirty/.test(editForm), "Edit owns unified-draft dirty state");
assert.ok(!/isDirty/.test(createForm), "Create must not gain Edit dirty contract");

// P — crop algorithm untouched (aspect 1 preserved; Escape additive only)
assert.ok(crop.includes("aspect={1}") && crop.includes("getCroppedImg"));

// Q — collection/image scale frozen
assert.ok(
  /align-self:\s*stretch/.test(cardCss) && /aspect-ratio:\s*1\s*\/\s*1/.test(cardCss),
  "card image scale contract preserved"
);
assert.ok(/width:\s*60px/.test(tableCss), "desktop thumb scale preserved");
assert.ok(hook.includes("(min-width: 900px)"), "900 architecture frozen");

console.log("admin-products-flyout-form-interaction-polish.verify.ts: PASS");
