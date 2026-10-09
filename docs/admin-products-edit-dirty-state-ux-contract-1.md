# ADMIN-PRODUCTS-EDIT-DIRTY-STATE-UX-CONTRACT-1

## Result

**PASS** — Edit base-form dirty / unsaved-changes contract closed.

## Delta Audit

### form state owner

`edit-product-form.tsx` — controlled / semi-controlled fields:
name, categoryId, description, price, sku, stock, isAvailable, trackStock, imageIntent

### baseline owner

`buildEditBaselineSnapshot(product)` from persisted `AdminProduct` on open / product id change

### close owner

Canonical user dismissal: `requestCloseFlyout` (provider)  
Immediate close: `closeFlyout` (Save success / confirmed discard)  
Triggers: Cerrar · Escape · backdrop → `requestCloseFlyout`

### save-success behavior

`router.refresh()` + `onSuccess={closeFlyout}` — **closes Edit immediately** (bypasses discard confirmation)

### image intent

`keep` | `replace` | `remove` — included in snapshot; pre-submit Storage still 0

### customization persistence

`ProductCustomizationOverridesPanel` — independent actions; **outside** base dirty snapshot

## Dirty Contract

`isDirty = !editSnapshotsEqual(currentSnapshot, baselineSnapshot)`

Not touch-tracking. Change → revert → pristine.

## Canonical Snapshot

### fields

name · categoryId · description · price · sku · stock · isAvailable · trackStock · imageIntent

### normalization

- price: `Number` semantic equality (mirrors `getPriceValue` finite ≥0)
- sku/description null → `""`
- strings compared as held in the form (no new `.trim()` / case folding)
- image: intent enum only (not Blob vs URL)

## Save Contract

| state | Save |
|-------|------|
| pristine | DISABLED |
| dirty + valid | ENABLED |
| dirty + invalid | DISABLED |
| pending / upload / process / category | DISABLED |

Pristine submit: `handleFormSubmit` → `preventDefault` (no action)

Failure: dirty preserved (no baseline rebase)

Success: flyout closes via `closeFlyout` (no discard prompt)

## Close Contract

| path | pristine | dirty |
|------|----------|-------|
| Cerrar | immediate | confirm |
| Escape | immediate | confirm |
| backdrop | immediate | confirm |
| confirmation Escape | — | cancel discard → Edit remains dirty |
| Seguir editando | — | preserve local |
| Descartar cambios | — | local discard only → `closeFlyout` |

## Confirmation UX

Feature-local `<dialog class="discardDialog">` (no `window.confirm`)

Copy:
- ¿Descartar cambios?
- Tenés cambios sin guardar. Si cerrás ahora, se perderán.
- Seguir editando / Descartar cambios

Initial focus: Seguir editando · actions ≥44px · light/dark tokens

## Image Dirty State

KEEP → pristine · REMOVE → dirty · REPLACE → dirty · discard → no Storage

## Change → Revert

Verified: name, Disponible, stock (and category/price via same snapshot)

## Runtime QA

| state | dirty | valid | Save | close result |
|-------|-------|-------|------|--------------|
| initial | false | true | disabled | immediate |
| name +1 | true | true | enabled | confirm |
| name revert | false | true | disabled | immediate |
| clear name | true | false | disabled | — |
| disponible toggle/revert | true→false | true | en→dis | — |
| stock +1/revert | true→false | true | en→dis | — |
| Quitar imagen | true | true | enabled | confirm; discard restores image |
| Escape dirty | — | — | — | confirm |
| Escape confirm | — | — | — | cancel → dirty Edit |

360/390/412 · light/dark · overflow 0 · desktop ≥961 smoke

## Accessibility

dialog labelled/described · Seguir editando focused · Escape cancel ownership · Tab deferred to confirm when open

## Customization Boundary

Not in snapshot · independent mutations · do not enable base Save

## Data Safety

products/availability/stock/Storage/orders/customizations: **0**

## Verification

focused dirty verify PASS · flyout PASS · image lifecycle PASS · probes A/B/C FAIL→RESTORED · tsc PASS · diff PASS

## Runtime Scope

- `edit-product-form.tsx`
- `flyout-panel.tsx`
- `products-management-provider.tsx`
- `product-form.module.css` (discard dialog only)
- verifies + docs

**Unchanged:** create · actions · admin.ts · overrides panel · DB · image optimizer

## Debt Closure

**PROD-P3-18 CLOSED** — ADMIN-PRODUCTS-EDIT-DIRTY-STATE-UX-CONTRACT-1

## Remaining Edit Debt

Visual parity / customization density / product removal — separate phases

## Next

ADMIN-PRODUCTS-EDIT-SIMPLE-MOBILE-VISUAL-UX-PARITY-1  
then ADMIN-PRODUCTS-EDIT-CUSTOMIZATION-OVERRIDES-MOBILE-DENSITY-POLISH-1  
product removal: SEPARATE DECISION PHASE  
COMMIT/PUSH/DEPLOY: PAUSED
