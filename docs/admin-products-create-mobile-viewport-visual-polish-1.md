# ADMIN-PRODUCTS-CREATE-MOBILE-VIEWPORT-VISUAL-POLISH-1

## Result

**PASS** — Create mobile viewport / visual surface closed.

Stock default / availability / payload: **UNCHANGED** (deferred).
Create submits: **0**. Commit / push / deploy: **NONE**.

## Real-Device Trigger

Owner Android screenshots: with browser chrome expanded, **Guardar producto** was clipped below the usable visual viewport; after chrome collapsed, the sticky CTA appeared. Historical fixed-390 emulated height alone was insufficient.

## Delta Audit

viewport owner:
`.panel` in `flyout-panel.module.css` (`position: fixed`)

scroll owner:
`.body` (`flex: 1; overflow-y: auto; min-height: 0`)

footer owner:
`.actionsSticky` in `product-form.module.css` (`position: sticky; bottom: 0`)

root cause:
**CASE A** — mobile panel height/max-height used static **`100vh` only**. When the browser UI reduces the visual viewport below layout viewport, the sticky footer sits inside a taller-than-visible panel and can fall below the usable screen.

flyout breakpoint:
**`min-width: 961px`** desktop inset — **PRESERVED** (not replaced by Products collection 900)

Stock freeze (Create):
- `trackStock` initial / reset: **`false`**
- `stockValue` initial: **`0`**

## Viewport Fix

before:
`height/max-height: 100vh` only on `.panel`

after:
`100vh` fallback → **`100dvh`** override (also desktop `calc(...dvh...)`)

dvh contract:
CSS-first progressive enhancement; no JS viewport listeners

safe area:
footer `padding-bottom: max(12px, env(safe-area-inset-bottom, 0px))`

single scroll:
panel `overflow: hidden`; body remains sole vertical scroller

## Create CTA

mobile (&lt;961):
**full width** · **min-height 3rem (48px)** · Create-scoped `.createActions`

desktop:
Edit/Create desktop sizing unchanged; Edit Save measured **~166px** (not forced full-width)

disabled:
feature-local opacity + readable label; enabled logic unchanged

enabled:
unchanged validity / submit wiring

## Density

dropzone:
mobile square `min(200px, 68vw)`; copy **Agregar imagen** + **JPG, PNG o HEIC**; desktop drag copy preserved

form rhythm:
Create mobile tighter section/grid/divider/toggle gaps

divider:
`1.25rem` vertical on Create mobile

stock area:
clearance via `.createForm:has(.actionsSticky)` padding; scrolled bottom keeps stock/helper above CTA

touch targets:
inputs/selects/Close/switch/CTA ≥44 preserved

## Dropzone Copy

mobile: Agregar imagen (+ formats; HEIC accepted by `accept` + decoder)
desktop: Arrastrá tu imagen o hacé clic
behavior / crop / optimizer: **FROZEN**

## Runtime QA

| width | height class | theme | footer visible | overflow | result |
|-------|--------------|-------|----------------|----------|--------|
| 390 | short ~600 | dark | yes | 0 | PASS |
| 390 | short ~640 | dark | yes | 0 | PASS |
| 390 | short ~600 | light | yes | 0 | PASS |
| 390 | normal ~780 | — | Edit guard | 0 | PASS |
| 412 | — | — | covered by same &lt;961 CSS | — | PASS* |

\*Same fullscreen flyout band; width family exercised via 390 + overflow checks.

## Geometry Evidence

innerHeight (short): **600 / 640**
visualViewport: **matched innerHeight in harness**
footer/CTA rect: CTA bottom ≤ usable (+2px tol); height **48**; width **~361** (full width)
panel height: **equals usable** (`640px` / `600px` with dvh)

## Shared Edit Guard

result: **PASS** — Edit opens; sticky **Guardar cambios** visible; not full-width; Escape closes; no Save

source impact: shared `.panel` dvh + shared sticky safe-area; Create-only density/CTA classes

## Accessibility

focus / Tab / Escape: Escape closes Create & Edit (regression)
return focus: prior flyout contract unchanged
touch: ≥44 preserved

## Data Safety

creates: **0** · updates: **0** · Storage: **0** · orders: **0**

## Verification

focused: **PASS**
mutation A (static 100vh-only): **FAIL → restored PASS**
mutation B (CTA width): **FAIL → restored PASS**
related flyout interaction: **PASS**
tsc: **PASS**
diff: **PASS**

## Runtime Scope

MODIFIED:
- `components/admin/products/flyout-panel.module.css`
- `components/admin/products/product-form.module.css`
- `components/admin/products/create-product-form.tsx`

NEW:
- `lib/products/admin-products-create-mobile-viewport-visual-polish.verify.ts`
- `docs/admin-products-create-mobile-viewport-visual-polish-1.md`

## Deferred Stock Contract

Create stock default ON / “Stock inicial” / helper UX →
**ADMIN-PRODUCTS-CREATE-STOCK-DEFAULT-UX-CONTRACT-1**

## Next

`ADMIN-PRODUCTS-CREATE-STOCK-DEFAULT-UX-CONTRACT-1`

Then: `ADMIN-PRODUCTS-CREATE-MOBILE-FINAL-VISUAL-QA-1`

Release: **STILL PAUSED**
