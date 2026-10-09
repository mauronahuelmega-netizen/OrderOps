/**
 * Verify ADMIN-PRODUCTS-CREATE-REQUIRED-MARKER-SPACING-POLISH-1
 *
 * Spacing between Create required label text and `*` must be owned by
 * `.fieldLabelInline` flex gap — not per-mark margin (defeated by
 * `.admin-field span { margin: 0 }` on Categoría) and not manual whitespace.
 *
 * Run: npx tsx lib/products/admin-products-create-required-marker-spacing-polish.verify.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(rel: string) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

const createForm = read("components/admin/products/create-product-form.tsx");
const formCss = read("components/admin/products/product-form.module.css");
const adminSurfaces = read("components/admin/admin-surfaces.css");

// A — structural spacing owner: inline-flex + column-gap on fieldLabelInline
{
  const block = formCss.match(/\.fieldLabelInline\s*\{[^}]*\}/)?.[0] ?? "";
  assert.ok(/display:\s*inline-flex/.test(block), "fieldLabelInline must be inline-flex");
  assert.ok(/column-gap:\s*0\.15em/.test(block), "fieldLabelInline must own spacing via column-gap");
  assert.ok(/white-space:\s*nowrap/.test(block), "fieldLabelInline keeps marker attached");
}

// B — requiredMark must not be the sole spacing owner via margin-inline-start
{
  const markBlock =
    formCss.match(/\.fieldLabelInline\s*>\s*\.requiredMark\s*\{[^}]*\}/)?.[0] ??
    formCss.match(/\.requiredMark\s*\{[^}]*\}/)?.[0] ??
    "";
  assert.ok(markBlock.length > 0, "requiredMark style block exists");
  assert.ok(
    !/margin-inline-start:\s*0\.15em/.test(markBlock),
    "do not rely on requiredMark margin-inline-start (admin-field span resets margin)"
  );
  assert.ok(/margin:\s*0/.test(markBlock) || !/margin-inline-start/.test(markBlock));
}

// C — RequiredMark has no manual whitespace padding around *
{
  const markFn = createForm.match(/function RequiredMark\([\s\S]*?\n\}/)?.[0] ?? "";
  assert.ok(markFn.includes('aria-hidden="true"'));
  assert.ok(
    /requiredMark[^>]*>\*</.test(markFn.replace(/\s+/g, " ")) ||
      /aria-hidden=["']true["']>\*</.test(markFn.replace(/\s+/g, "")),
    "RequiredMark must render compact * without surrounding whitespace text"
  );
}

// D — all four Create required labels still share requiredFieldLabel
assert.ok(createForm.includes('requiredFieldLabel("Nombre")'));
assert.ok(createForm.includes('requiredFieldLabel("Categoría")'));
assert.ok(createForm.includes('requiredFieldLabel("Precio")'));
assert.ok(createForm.includes('requiredFieldLabel("Stock inicial")'));

// E — Categoría remains under admin-field (regression surface that zeroed mark margin)
{
  const catBlock = createForm.slice(
    createForm.indexOf('requiredFieldLabel("Categoría")') - 200,
    createForm.indexOf('requiredFieldLabel("Categoría")') + 80
  );
  assert.ok(/admin-field/.test(catBlock), "Categoría still in admin-field — gap owner must survive it");
}

// F — admin-surfaces still has the conflicting span margin reset (document the threat)
assert.ok(
  /\.admin-field span[\s\S]*?margin:\s*0/.test(adminSurfaces),
  "admin-field span margin:0 remains — spacing must not depend on mark margin alone"
);

// G — affordance contract untouched (no validation rewrite in this polish)
assert.ok(createForm.includes("* Campos obligatorios") || createForm.includes("Campos obligatorios"));
assert.ok(/name="category_id"/.test(createForm));
assert.ok(/\brequired\b/.test(createForm.slice(createForm.indexOf('name="category_id"'), createForm.indexOf('name="category_id"') + 280)));

console.log("admin-products-create-required-marker-spacing-polish.verify.ts: PASS");
