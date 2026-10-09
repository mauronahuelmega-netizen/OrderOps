# ADMIN-PRODUCTS-CREATE-STOCK-DEFAULT-UX-CONTRACT-1

## Result

**PASS** — Create stock default + mobile stock UX + residual Create footer/focus closed.

## Delta Audit

initial owner:
`create-product-form.tsx` — `useState(true)` for `trackStock` (was `false`)

reset owner:
success `useEffect` — `setTrackStock(true)` + `setStockValue(0)`

availability authority:
`resolveEffectiveProductAvailability` in `lib/products/products-stock-availability-contract.ts`
Create action: `requestedAvailable: true` → tracked + stock≤0 → unavailable (unchanged)

focus-ring owner:
`product-form.module.css` — was `label:focus-within` → now `label:has(input:focus-visible)`;
Create-scoped `.createToggleHost` input fills 44×44 label for keyboard reachability

footer lateral owner:
Create mobile `.createForm .createActions.actionsSticky` negative `margin-inline` matching `--create-shell-inline` + matching internal padding (button stays inset)

## Product Decision

default:
`track_stock` ON on Create open

user override:
YES — switch remains enabled; OFF is valid

stock 0:
VALID initial / reset value

availability:
derived by existing domain contract (no Create Disponible switch)

## Create Contract

initial:
`trackStock=true`, `stockValue=0`

success reset:
same (`true` / `0`)

payload:
form `track_stock` checkbox value (not hard-coded server-side)

server authority:
UNCHANGED — `resolveEffectiveProductAvailability` + existing trigger

## Mobile UX

Stock inicial:
Create-only label (Edit retains Stock actual)

switch row:
label + ON switch; no standalone Activo/Inactivo

helper:
“Descontamos el stock con cada pedido. Al llegar a 0, el producto deja de estar disponible.”

zero-stock info:
`toggleInfo` — “Con stock 0, el producto se creará como no disponible.” when `trackStock && stockValue <= 0`

focus-visible:
`:has(input:focus-visible)` ring; no blur-on-click; pointer leaves no keyboard-style ring

footer full-bleed:
Create mobile sticky surface reaches flyout laterals; CTA inset ~14px / full-width

## Runtime States

0 + ON:
info visible

1 + ON:
info hidden

0 + OFF:
info hidden

0 + ON again:
info visible

## Viewport QA

| width | theme | stock row | footer | overflow | result |
|------:|-------|-----------|--------|----------|--------|
| 360 | dark (short ~640) | fit / switch 44 | bleed ≤1px / CTA inset 14 / visible | 0 | PASS |
| 390 | dark (short ~640) | fit | bleed ≤1px / inset 14 / visible | 0 | PASS |
| 390 | light | fit | white full-bleed / inset button | 0 | PASS |
| 412 | dark (normal ~780) | fit | bleed ≤1px / inset 14 / visible | 0 | PASS |
| ≥900 | — | smoke not required beyond contract | desktop footer unchanged | — | source guard |

## Pointer / Keyboard QA

pointer/touch:
label click toggles; outlineStyle none after pointer activation (no persistent blue ring)

keyboard:
CSS contract `:has(input:focus-visible)` + Create input hit-area fill; automation Tab inside flyout did not always transfer focus in the embedded browser — source + mutation probe D protect regression of focus-within ring

## Edit Regression Guard

track_stock:
persisted (Coca Cola smoke: `true`, stock `3`)

Stock actual:
PRESERVED

Disponible / Activo labels:
PRESERVED on Edit

createActions:
not applied to Edit

## Data Safety

products created: **0**
products updated: **0**
stock DB mutations: **0**
availability DB mutations: **0**
Storage: **0**
orders: **0**

## Verification

focused: PASS (`admin-products-create-stock-default-ux-contract.verify.ts`)
stock contract: PASS (Create helper asserts reconciled to compact Create copy)
viewport: PASS
flyout: PASS
mutations A/B/C/D: FAIL → RESTORED PASS
tsc: PASS
diff: PASS

## Runtime Scope

- `components/admin/products/create-product-form.tsx`
- `components/admin/products/product-form.module.css`
- `lib/products/admin-products-create-stock-default-ux-contract.verify.ts`
- `lib/products/admin-products-create-mobile-viewport-visual-polish.verify.ts` (stock freeze asserts moved to this phase)
- `lib/products/admin-products-stock-availability-contract.verify.ts` (Create helper copy)
- docs: phase + CURRENT_PHASE + living audit + memory handoff

Actions / DB / migrations / Edit TSX: **unchanged**

## Remaining Create Debt

Final Create mobile visual QA pass (owner screenshots / last polish sweep).

## Next

`ADMIN-PRODUCTS-CREATE-MOBILE-FINAL-VISUAL-QA-1`

Then: owner review → Edit simple mobile phase

Release: **STILL PAUSED**
