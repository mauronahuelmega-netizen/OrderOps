/**
 * Verify ADMIN-PRODUCTS-CREATE-REQUIRED-FIELD-AFFORDANCE-1
 *
 * Run: npx tsx lib/products/admin-products-create-required-field-affordance.verify.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(rel: string) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

const createForm = read("components/admin/products/create-product-form.tsx");
const editForm = read("components/admin/products/edit-product-form.tsx");
const formCss = read("components/admin/products/product-form.module.css");
const flyoutCss = read("components/admin/products/flyout-panel.module.css");
const actions = read("app/admin/(protected)/products/actions.ts");

function sliceAround(source: string, needle: string, radius = 350): string {
  const i = source.indexOf(needle);
  if (i < 0) return "";
  return source.slice(Math.max(0, i - radius), Math.min(source.length, i + radius));
}

// A — requiredFieldLabel helper + aria-hidden marker
assert.ok(createForm.includes("function RequiredMark"));
assert.ok(createForm.includes("function requiredFieldLabel"));
assert.ok(/aria-hidden=["']true["']/.test(createForm.match(/function RequiredMark[\s\S]*?\n\}/)?.[0] ?? ""));
assert.ok(createForm.includes("* Campos obligatorios") || createForm.includes("Campos obligatorios"));
assert.ok(createForm.includes("styles.requiredLegend") || createForm.includes("requiredLegend"));

// B — marked required fields
assert.ok(createForm.includes('requiredFieldLabel("Nombre")'));
assert.ok(createForm.includes('requiredFieldLabel("Categoría")'));
assert.ok(createForm.includes('requiredFieldLabel("Precio")'));
assert.ok(createForm.includes('requiredFieldLabel("Stock inicial")'));

// C — optional fields unmarked (no requiredFieldLabel for them)
assert.ok(!createForm.includes('requiredFieldLabel("Descripción")'));
assert.ok(!createForm.includes('requiredFieldLabel("SKU")'));
assert.ok(!createForm.includes('requiredFieldLabel("Imagen")'));
assert.ok(!createForm.includes('requiredFieldLabel("Controlar stock automáticamente")'));
assert.ok(!/Agregar imagen[\s\S]{0,40}requiredFieldLabel|requiredFieldLabel\([\s\S]{0,20}Agregar/.test(createForm));

// D — native required remains on the same four controls
{
  const nameBlock = sliceAround(createForm, 'requiredFieldLabel("Nombre")');
  assert.ok(/\brequired\b/.test(nameBlock), "Nombre control remains required");

  const catBlock = sliceAround(createForm, 'name="category_id"');
  assert.ok(/\brequired\b/.test(catBlock), "Categoría select remains required");

  const priceBlock = sliceAround(createForm, 'name="price"');
  assert.ok(/\brequired\b/.test(priceBlock), "Precio remains required");

  const stockBlock = sliceAround(createForm, 'requiredFieldLabel("Stock inicial")');
  assert.ok(/\brequired\b/.test(stockBlock), "Stock inicial remains required");
}

// E — optional controls still lack required
{
  const descBlock = sliceAround(createForm, 'name="description"');
  assert.ok(descBlock.length > 0);
  assert.ok(!/\brequired\b/.test(descBlock), "Descripción must not be required");

  const skuBlock = sliceAround(createForm, 'name="sku"');
  assert.ok(skuBlock.length > 0);
  // sku block may include nearby stock required — check the input itself
  assert.ok(/name="sku"[\s\S]*?(?=<Input|name="stock"|createStockBlock)/.test(createForm));
  const skuInput = createForm.match(/id="create-product-sku"[\s\S]*?\/>/)?.[0] ?? "";
  assert.ok(skuInput.length > 0);
  assert.ok(!/\brequired\b/.test(skuInput), "SKU input must not be required");
}

// F — Edit may share required affordance language; Categoría is read-only (not required marker)
assert.ok(editForm.includes("Campos obligatorios") || editForm.includes('requiredFieldLabel("Stock actual")'));
assert.ok(
  editForm.includes('label="Nombre"') || editForm.includes('requiredFieldLabel("Nombre")')
);
assert.ok(
  editForm.includes('label="Stock actual"') || editForm.includes('requiredFieldLabel("Stock actual")')
);
assert.ok(!editForm.includes('requiredFieldLabel("Stock inicial")'), "Edit must not say Stock inicial");
assert.ok(
  !editForm.includes('requiredFieldLabel("Categoría")'),
  "Edit Categoría is read-only — must not use required marker (Create still does)"
);
assert.ok(
  /categoryReadOnlyValue/.test(editForm) || !/name=["']category_id["']/.test(editForm),
  "Edit must not expose mutable category_id select"
);

// G — CSS affordance styles exist; no error-red token for marker
assert.ok(/\.requiredMark\s*\{/.test(formCss));
assert.ok(/\.requiredLegend\s*\{/.test(formCss));
assert.ok(!/\.requiredMark\s*\{[^}]*color-pending|\.requiredMark\s*\{[^}]*error/i.test(formCss));
// Spacing polish: gap on fieldLabelInline owns marker separation (not mark margin alone)
assert.ok(/\.fieldLabelInline\s*\{[^}]*column-gap:\s*0\.15em/.test(formCss));

// H — frozen Create geometry / stock contracts not reopened in this verify surface
assert.ok(/height:\s*100dvh/.test(flyoutCss));
assert.ok(/safe-area-inset-bottom/.test(formCss));
assert.ok(/const \[trackStock,\s*setTrackStock\]\s*=\s*useState\(true\)/.test(createForm));
assert.ok(/createForm\.shell:has\(\.actionsSticky\)[\s\S]*padding-bottom:\s*0/.test(formCss));

// I — actions untouched by this affordance (no hard-coded required set changes)
assert.ok(/export async function createProductAction/.test(actions));

console.log("admin-products-create-required-field-affordance.verify.ts: PASS");
