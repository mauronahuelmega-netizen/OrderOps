# ADMIN-PRODUCTS-CREATE-REQUIRED-MARKER-SPACING-POLISH-1

## Result

**PASS** — Create required-marker spacing unified under one CSS owner.

## Owner Finding

### before

| field | structural gap (text → `*`) | mark `margin-inline-start` |
|-------|-----------------------------|----------------------------|
| Nombre | ~2.27px | 0.15em applied |
| Categoría | **0px** | **overridden to 0** |
| Precio | ~2.27px | 0.15em applied |
| Stock inicial | ~2.27px | 0.15em applied |

Owner report pattern `Nombre *` / `Categoría*` / `Precio *` / `Stock inicial*` maps to the Categoría flush case. Live before-fix: **only Categoría** lost spacing; Stock inicial already had the margin gap (owner “Stock inicial*” was not reproduced as zero-gap).

### reproduced

- Categoría under `.admin-field` → `*` flush to label
- Nombre / Precio / Stock inicial under `.ui-field` → spaced `*`

## Root Cause

### Nombre

`.ui-field` → `.requiredMark { margin-inline-start: 0.15em }` applied → gap present

### Categoría

Wrapped in `.admin-field`. Shared rule in `admin-surfaces.css`:

```css
.admin-field span,
.admin-field-label,
.admin-field > span {
  margin: 0;
  …
}
```

Specificity `(0,1,1)` beats single-class `.requiredMark` `(0,1,0)` → mark margin zeroed → `Categoría*`

### Precio

`.ui-field` → margin applied → gap present

### Stock inicial

`.ui-field` (via `Input`) → margin applied → gap present

### mechanism

Spacing was owned by **per-mark margin**, which `.admin-field span { margin: 0 }` defeats for Categoría only.

## Fix

### files

- `components/admin/products/product-form.module.css`
- `components/admin/products/create-product-form.tsx` (compact `RequiredMark` markup only)
- `lib/products/admin-products-create-required-marker-spacing-polish.verify.ts`
- docs

### markup

`RequiredMark` renders compact `*` (no surrounding whitespace text). All four labels still use `requiredFieldLabel` — unchanged affordance set.

### CSS

```css
.fieldLabelInline {
  display: inline-flex;
  align-items: baseline;
  column-gap: 0.15em;
  white-space: nowrap;
}

.fieldLabelInline > .requiredMark {
  margin: 0;
  color: var(--text-secondary);
  font-size: inherit;
  font-weight: 600;
}
```

### spacing owner

**`.fieldLabelInline` `column-gap: 0.15em`** — flex gap, immune to `.admin-field span { margin: 0 }`.

Not changed: required attributes, legend, Input API, validation, Edit, footer/stock contracts.

## Mobile Runtime QA

| viewport | theme | Nombre | Categoría | Precio | Stock inicial | overflow | result |
|----------|-------|--------|-----------|--------|---------------|----------|--------|
| 360 | dark (measured) / light target | ~2.27 | ~2.30 | ~2.27 | ~2.27 | 0 | PASS |
| 390 | dark | ~2.27 | ~2.30 | ~2.27 | ~2.27 | 0 | PASS |
| 412 | light | ~2.27 | ~2.30 | ~2.27 | ~2.27 | 0 | PASS |

Wrapping: marker stays attached (`nowrap` on inline group). Baseline: `align-items: baseline`.

## Verification

| check | result |
|-------|--------|
| focused spacing verify | PASS |
| mutation (remove `column-gap`) | FAIL → restored PASS |
| required-field-affordance verify | PASS |
| tsc --noEmit | PASS |
| git diff --check | PASS |

## Data Safety

Creates / updates / Storage / orders / DB: **0**

## Decision

CREATE MOBILE: **FINAL CLOSED / FROZEN**  
CREATE OWNER POLISH: **COMPLETE**

## Next

OWNER REVIEW → EDIT SIMPLE MOBILE VISUAL QA  
COMMIT/PUSH/DEPLOY: **PAUSED**
