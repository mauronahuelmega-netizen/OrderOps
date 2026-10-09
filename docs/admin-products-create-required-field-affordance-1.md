# ADMIN-PRODUCTS-CREATE-REQUIRED-FIELD-AFFORDANCE-1

## Result

**PASS** — Create required-field visual affordance closed. Create mobile **FINAL CLOSED / FROZEN**.

## Required Contract Audit

Proven from current Create runtime source **before** markup changes. Native `required` is authority.

| field | required (native) | marker |
|-------|-------------------|--------|
| Nombre | yes | * |
| Categoría | yes | * |
| Precio | yes | * |
| Stock inicial | yes | * |
| Descripción | no | unmarked |
| SKU | no | unmarked |
| Imagen / Agregar imagen | no | unmarked |
| Controlar stock automáticamente | no | unmarked |

Contract matched owner expectation → no `REQUIRED-CONTRACT MISMATCH`.

## Product Convention

- `Label *` = required
- Label without `*` = optional
- One legend explains the convention: `* Campos obligatorios`
- Asterisk is visual only; HTML `required` remains semantic authority

## Implementation

### marker semantics

- Local `RequiredMark` + `requiredFieldLabel(text)` in `create-product-form.tsx`
- Marker: `<span aria-hidden="true">*</span>`
- No `aria-required` added (native `required` already present)
- No `(opcional)` suffix on optional labels

### legend

- Exactly one: `* Campos obligatorios`
- Placement: after image dropzone, before first labeled data field (Nombre)
- Quiet supporting caption — not alert / live region / banner

### style

- `.requiredLegend`, `.fieldLabelInline` (`white-space: nowrap`), `.requiredMark`
- Color: `var(--text-secondary)` — not error red
- Create-local CSS in `product-form.module.css`

### scope

- Create only
- `Input` `label` type widened to `ReactNode` so Create can pass marked labels; Edit still passes plain strings
- No Edit label changes
- No validation / CTA / actions / DB changes

## Mobile Runtime QA

| viewport | theme | wrapping | overflow | result |
|----------|-------|----------|----------|--------|
| 360 | light | label+* attached | 0 | PASS |
| 390 | light | OK | 0 | PASS |
| 390 | dark | OK | 0 | PASS |
| 412 | light | OK | 0 | PASS |

## Validation Regression

- Incomplete required → form invalid / Save disabled (unchanged)
- Fill required only → native `checkValidity()` true (unchanged)
- Clear one required → invalid again (unchanged)
- Optional empty (image / description / SKU) does not block validity
- No submit performed

## Footer / Stock Smoke

- 412 END: `footerToBodyBottom` 0; form `padding-bottom` 0
- Track stock default ON; Stock inicial 0; zero-stock info visible
- dvh / safe-area / sticky contracts untouched

## Accessibility

- Labels remain associated (`htmlFor` / Input label)
- Native `required` preserved on Nombre / Categoría / Precio / Stock inicial
- Marker `aria-hidden` — no duplicate spoken “obligatorio”
- Legend is visible text only (no `role="alert"`, no `aria-live`)
- focus-visible / keyboard / touch unchanged

## Data Safety

- Create submits: **0**
- Products created: **0**
- Products updated: **0**
- Storage: **0**
- Orders: **0**
- DB mutations: **0**

## Verification

| check | result |
|-------|--------|
| focused affordance verify | PASS |
| sticky-footer-end-state | PASS |
| create-mobile-final-visual-qa | PASS (accepts `requiredFieldLabel("Stock inicial")`) |
| create-stock-default-ux-contract | PASS (same) |
| mutation A (remove Precio marker) | FAIL → restored PASS |
| mutation B (SKU marker / Stock unmarked) | FAIL → restored PASS |
| mutation C (strip aria-hidden) | FAIL → restored PASS |
| tsc --noEmit | PASS |
| git diff --check | PASS |
| build | NOT RUN |
| lint | NOT RUN — known tooling debt |

## Runtime Scope

- `components/admin/products/create-product-form.tsx`
- `components/admin/products/product-form.module.css`
- `components/ui/Input.tsx` (`label?: ReactNode` only)
- `lib/products/admin-products-create-required-field-affordance.verify.ts`
- related verify string acceptance for Stock inicial label form
- phase / living docs

**Not changed:** edit-product-form, actions, admin.ts, flyout architecture, DB/RLS/migrations.

## Remaining Create Debt

**NONE**

## Final Create Decision

**CREATE MOBILE = FINAL CLOSED / FROZEN**  
**NO MORE CREATE OWNER POLISH PLANNED**

## Next

OWNER REVIEW → **EDIT SIMPLE MOBILE VISUAL QA**  
`ADMIN-PRODUCTS-COMMIT-PUSH-DEPLOY-1`: **STILL PAUSED**
