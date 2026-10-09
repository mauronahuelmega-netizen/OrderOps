# ADMIN-PRODUCTS-EDIT-SIMPLE-MOBILE-VISUAL-UX-PARITY-1

## Result

**PASS** — Edit base-form mobile visual / UX parity with frozen Create closed.

## Delta Audit

### form owner

`components/admin/products/edit-product-form.tsx`

### shared Create styles

Reused (no Create source edits):
`.requiredLegend` · `.fieldLabelInline` · `.requiredMark` · image dropzone mobile text classes · toggle focus-visible hosts

### Edit-only debt addressed

- missing required legend/markers
- Activo/Inactivo status copy
- loose toggle spacing / long helper
- mobile CTA intrinsic (not full-bleed/full-width)
- empty-image dropzone copy vs Create
- base-form → customization spacing handoff

### scope actually touched

`edit-product-form.tsx` · `product-form.module.css` · focused verify · related verify string acceptance

## Required Fields

legend: `* Campos obligatorios`  
required: Nombre · Categoría · Precio · Stock actual  
optional: Imagen · Descripción · SKU · Disponible · track_stock  
native validation: UNCHANGED

## Image Block

geometry: ~200×200 at 390  
crop / remove: preserved ≥44  
lifecycle: KEEP/REPLACE/REMOVE unchanged · pre-submit Storage 0

## Form Rhythm

fields: Create-aligned gaps under `.editForm`  
dividers: 1.25rem mobile  
density: via spacing + copy, not target shrink

## Operational Toggles

Disponible: compact row · aria-labelledby  
track_stock: compact row · aria-labelledby  
status copy: Activo/Inactivo **removed**  
helper: compact domain-accurate copy  
touch: 44×44 hosts via existing toggleStackHeader

## Footer

mobile surface: FULL BLEED (`.editActions`)  
CTA: INSET / FULL WIDTH / min-height 3rem  
MID: footerToBody 0  
END: formPadB 0 · no trailing strip · sticky releases before customization  
customization release: no overlap with “Ajustes propios…”  
short viewport: scrollable · CTA reachable  
safe-area: preserved  
desktop ≥961: CTA intrinsic (~166px) · not forced full-bleed

## Dirty-State Guard

initial DISABLED · change ENABLED · revert DISABLED · invalid DISABLED  
close dirty → confirm · stay preserves · Escape cancel path preserved

## Runtime Geometry

390: panel 390 · image 200×200 · footer bleed · CTA inset 14 · CTA H 48 · overflow 0  
412 / 360: overflow 0  
899: mobile band still applies · overflow 0  
1100: CTA not full-width

## Responsive QA

| width | theme | result | overflow |
|-------|-------|--------|----------|
| 360 | light | PASS | 0 |
| 390 | light | PASS | 0 |
| 390 | dark | PASS | 0 |
| 412 | — | PASS | 0 |
| 899 | — | PASS | 0 |
| ≥961 | — | PASS | 0 |

## Accessibility

required `*` aria-hidden · native required preserved · focus-visible on switches · pointer without persistent ring · flyout Tab/Escape/dirty dialog preserved

## Create Regression Guard

required + Stock inicial + track ON + footer bleed + padB 0: **PASS / FROZEN** (Create source unchanged)

## Customization Boundary

panel internal edits: **0**  
scroll: continuous · overlap: **false** · mutations: **0**

## Data Safety

products / availability / stock / Storage / customizations / orders: **0**

## Verification

focused parity PASS · dirty PASS · Create affordance/spacing/sticky PASS · flyout PASS · image PASS · stock default PASS  
mutation A (footer width) FAIL→RESTORED · B (Stock actual marker) FAIL→RESTORED · C (isDirty gate) FAIL→RESTORED  
tsc PASS · diff PASS · build/lint NOT RUN

## Runtime Scope

- `components/admin/products/edit-product-form.tsx`
- `components/admin/products/product-form.module.css`
- `lib/products/admin-products-edit-simple-mobile-visual-ux-parity.verify.ts`
- related verify acceptance for Edit Stock actual label form
- docs

Create / flyout / provider / overrides / actions / DB: **unchanged**

## Remaining Edit Debt

customization density: NEXT  
product removal: SEPARATE DECISION PHASE

## Next

ADMIN-PRODUCTS-EDIT-CUSTOMIZATION-OVERRIDES-MOBILE-DENSITY-POLISH-1  
then PRODUCT REMOVAL DECISION PHASE  
COMMIT/PUSH/DEPLOY: PAUSED
