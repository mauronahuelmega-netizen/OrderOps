/**
 * Verify ADMIN-PRODUCTS-EDIT-SIMPLE-MOBILE-VISUAL-UX-PARITY-1
 * (reconciled after ADMIN-PRODUCTS-EDIT-UNIFIED-DRAFT-SAVE-IMPLEMENTATION-1)
 *
 * Run: npx tsx lib/products/admin-products-edit-simple-mobile-visual-ux-parity.verify.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(rel: string) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

const editForm = read("components/admin/products/edit-product-form.tsx");
const createForm = read("components/admin/products/create-product-form.tsx");
const formCss = read("components/admin/products/product-form.module.css");
const overrides = read(
  "components/admin/product-customization/product-customization-overrides-panel.tsx"
);
const actions = read("app/admin/(protected)/products/actions.ts");

// 1 — Edit required markers (Categoría is read-only — NOT required)
assert.ok(editForm.includes('requiredFieldLabel("Nombre")'));
assert.ok(!editForm.includes('requiredFieldLabel("Categoría")'));
assert.ok(editForm.includes('requiredFieldLabel("Precio")'));
assert.ok(editForm.includes('requiredFieldLabel("Stock actual")'));

// 1b — Categoría read-only (no mutable select)
assert.ok(
  /categoryReadOnlyValue/.test(editForm) ||
    (/Categoría/.test(editForm) && !/name=["']category_id["']/.test(editForm)),
  "Edit Categoría must be read-only without name=category_id"
);
assert.ok(!/name=["']category_id["']/.test(editForm));
assert.ok(/\.categoryReadOnlyValue\s*\{/.test(formCss) || /categoryReadOnlyValue/.test(editForm));

// 2 — optional unmarked
assert.ok(!editForm.includes('requiredFieldLabel("Descripción")'));
assert.ok(!editForm.includes('requiredFieldLabel("SKU")'));
assert.ok(!editForm.includes('requiredFieldLabel("Disponible")'));
assert.ok(!editForm.includes('requiredFieldLabel("Controlar stock automáticamente")'));
assert.ok(!editForm.includes('requiredFieldLabel("Imagen")'));
assert.ok(!editForm.includes('requiredFieldLabel("Agregar imagen")'));

// 3 — Create spacing contract reused (fieldLabelInline column-gap)
assert.ok(/\.fieldLabelInline\s*\{[^}]*column-gap:\s*0\.15em/.test(formCss));
assert.ok(/aria-hidden=["']true["']/.test(editForm.match(/function RequiredMark[\s\S]*?\n\}/)?.[0] ?? ""));

// 4 — one legend
assert.ok((editForm.match(/\* Campos obligatorios|Campos obligatorios/g) ?? []).length >= 1);
assert.ok(editForm.includes("styles.requiredLegend") || editForm.includes("requiredLegend"));

// 5–6 — dirty Save contract preserved (+ customizationReady gate)
assert.ok(/const canSave =[\s\S]*customizationReady[\s\S]*isDirty[\s\S]*isValid/.test(editForm));
assert.ok(/disabled=\{!canSave\}/.test(editForm));
assert.ok(
  /if \(!isDirtyRef\.current \|\| !customizationReadyRef\.current\)[\s\S]*preventDefault/.test(
    editForm
  )
);

// 7 — no visible Activo/Inactivo status copy in Edit base form
assert.ok(!/statusLabel/.test(editForm));
assert.ok(!/Activo|Inactivo/.test(editForm));

// 8–10 — operational labels preserved
assert.ok(editForm.includes("Disponible"));
assert.ok(/name=["']track_stock["']/.test(editForm));
assert.ok(editForm.includes("Stock actual"));
assert.ok(!editForm.includes("Stock inicial"));

// 11 — mobile Edit full-bleed / full-width CTA contract
assert.ok(/styles\.editActions/.test(editForm) || editForm.includes("editActions"));
assert.ok(
  /\.editForm[\s\S]*\.editActions\.actionsSticky[\s\S]*margin-inline:\s*calc\(-1\s*\*\s*var\(--edit-shell-inline\)\)/.test(
    formCss
  )
);
{
  const editCta =
    formCss.match(
      /\.editForm\s+\.editActions\.actionsSticky\s+:global\(\.admin-primary-button\)\s*\{[^}]*\}/
    )?.[0] ?? "";
  assert.ok(/width:\s*100%/.test(editCta), "Edit mobile CTA must be full-width");
  assert.ok(/min-height:\s*3rem/.test(editCta), "Edit mobile CTA preferred 48px");
}

// 12 — desktop not forced: mobile rules are inside max-width 960 media
{
  const mobileBlock = formCss.match(/@media \(max-width:\s*960px\)\s*\{[\s\S]*$/)?.[0] ?? "";
  assert.ok(
    mobileBlock.includes(".editForm .editActions.actionsSticky"),
    "Edit full-width CTA must live under mobile media query"
  );
}

// 13 — Advanced inside form before sticky (not editAfterForm sibling)
assert.ok(/ProductCustomizationOverridesPanel/.test(editForm));
{
  const panelIdx = editForm.indexOf("ProductCustomizationOverridesPanel");
  const stickyIdx = editForm.indexOf("actionsSticky");
  assert.ok(panelIdx > 0 && stickyIdx > panelIdx, "Advanced must precede sticky Save");
}
assert.ok(!/editAfterForm/.test(editForm));
assert.ok(!/editActions/.test(overrides));

// 14 — image intents untouched
assert.ok(/"keep"\s*\|\s*"replace"\s*\|\s*"remove"|EditImageIntent/.test(editForm));
assert.ok(/setImageIntentState\("remove"\)/.test(editForm));

// 15 — Create frozen; Edit uses save draft; legacy update may still be exported
assert.ok(createForm.includes('requiredFieldLabel("Stock inicial")'));
assert.ok(createForm.includes('requiredFieldLabel("Categoría")'));
assert.ok(/name=["']category_id["']/.test(createForm));
assert.ok(/saveProductEditDraftAction/.test(editForm));
assert.ok(!/updateProductAction/.test(editForm));
assert.ok(/export async function saveProductEditDraftAction/.test(actions));
assert.ok(/export async function updateProductAction/.test(actions));
assert.ok(!/editForm|editActions|editToggleHost/.test(createForm));

console.log("admin-products-edit-simple-mobile-visual-ux-parity.verify.ts: PASS");
